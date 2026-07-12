// 2軍成績の1軍換算ロジック（純粋関数）
// 「同一シーズン、1軍と2軍それぞれのリーグ平均の比」を換算係数として使う。
// 特定選手の球場補正・対戦相手調整は行っていない粗い推計であることを前提とする

export interface BattingSample {
  playerId: string;
  playerName: string;
  teamId: string;
  atBats: number;
  obp: number;
  slg: number;
}

export interface PitchingSample {
  playerId: string;
  playerName: string;
  teamId: string;
  inningsPitched: number;
  era: number;
}

export interface RatedPlayer {
  playerId: string;
  playerName: string;
  teamId: string;
  nigunValue: number;
  translatedValue: number;
  sampleSize: number;
  rank: number;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function computeBattingTranslation(
  nigunBatters: BattingSample[],
  ichigunBatters: BattingSample[],
  minAtBats: number,
): RatedPlayer[] {
  const ichigunAvgOps = average(ichigunBatters.map((b) => b.obp + b.slg));
  const nigunAvgOps = average(nigunBatters.map((b) => b.obp + b.slg));
  const factor = nigunAvgOps === 0 ? 1 : ichigunAvgOps / nigunAvgOps;

  const qualified = nigunBatters.filter((b) => b.atBats >= minAtBats);
  const rated = qualified
    .map((b) => {
      const nigunValue = b.obp + b.slg;
      return {
        playerId: b.playerId,
        playerName: b.playerName,
        teamId: b.teamId,
        nigunValue,
        translatedValue: nigunValue * factor,
        sampleSize: b.atBats,
        rank: 0,
      };
    })
    .sort((a, b) => b.translatedValue - a.translatedValue || b.sampleSize - a.sampleSize);

  rated.forEach((r, i) => (r.rank = i + 1));
  return rated;
}

export function computePitchingTranslation(
  nigunPitchers: PitchingSample[],
  ichigunPitchers: PitchingSample[],
  minInnings: number,
): RatedPlayer[] {
  const ichigunAvgEra = average(ichigunPitchers.filter((p) => p.inningsPitched > 0).map((p) => p.era));
  const nigunAvgEra = average(nigunPitchers.filter((p) => p.inningsPitched > 0).map((p) => p.era));
  const factor = nigunAvgEra === 0 ? 1 : ichigunAvgEra / nigunAvgEra;

  const qualified = nigunPitchers.filter((p) => p.inningsPitched >= minInnings);
  const rated = qualified
    .map((p) => ({
      playerId: p.playerId,
      playerName: p.playerName,
      teamId: p.teamId,
      nigunValue: p.era,
      translatedValue: p.era * factor,
      sampleSize: Math.floor(p.inningsPitched),
      rank: 0,
    }))
    // ERAは低いほど良い。同着の場合は投球回が多い（＝安定してより多くの試練を乗り越えている）方を上位に
    .sort((a, b) => a.translatedValue - b.translatedValue || b.sampleSize - a.sampleSize);

  rated.forEach((r, i) => (r.rank = i + 1));
  return rated;
}
