// 「LABバリュー」独自指標の算出ロジック（純粋関数）
// 打者・投手をそのまま比較できないため、それぞれ「リーグ平均からどれだけ上乗せしたか」を
// 出場量で重みづけした上で、カテゴリ内で標準化（z-score）して同じ物差しに乗せる。
// 正式なWAR算出ではなく、公開データのみで作れる簡易な近似値であることが前提。

export interface BattingSample {
  playerId: string;
  playerName: string;
  teamId: string;
  plateAppearances: number;
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

export interface ValueRating {
  playerId: string;
  playerName: string;
  teamId: string;
  rawStat: number;
  sampleSize: number;
  value: number;
  rank: number;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  if (values.length === 0) return 0;
  const variance = mean(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}

// z-scoreで標準化。母集団の分散が0（全員同じ値）の場合は全員0とする
function zScores(values: number[]): number[] {
  const avg = mean(values);
  const sd = stddev(values, avg);
  if (sd === 0) return values.map(() => 0);
  return values.map((v) => (v - avg) / sd);
}

export function computeBattingValue(
  batters: BattingSample[],
  minPlateAppearances: number,
): Omit<ValueRating, "rank">[] {
  const qualified = batters.filter((b) => b.plateAppearances >= minPlateAppearances);
  if (qualified.length === 0) return [];

  const leagueAvgOps = mean(qualified.map((b) => b.obp + b.slg));
  // 「リーグ平均を上回ったOPS × 出場量」＝一人がチームにもたらした上乗せ分の粗い近似
  const production = qualified.map((b) => (b.obp + b.slg - leagueAvgOps) * b.plateAppearances);
  const scores = zScores(production);

  return qualified.map((b, i) => ({
    playerId: b.playerId,
    playerName: b.playerName,
    teamId: b.teamId,
    rawStat: b.obp + b.slg,
    sampleSize: b.plateAppearances,
    value: scores[i],
  }));
}

export function computePitchingValue(
  pitchers: PitchingSample[],
  minInningsPitched: number,
): Omit<ValueRating, "rank">[] {
  const qualified = pitchers.filter((p) => p.inningsPitched >= minInningsPitched);
  if (qualified.length === 0) return [];

  const leagueAvgEra = mean(qualified.map((p) => p.era));
  // 「リーグ平均より防御率をどれだけ下回ったか × 投球回」＝失点を防いだ貢献量の粗い近似
  const production = qualified.map((p) => (leagueAvgEra - p.era) * p.inningsPitched);
  const scores = zScores(production);

  return qualified.map((p, i) => ({
    playerId: p.playerId,
    playerName: p.playerName,
    teamId: p.teamId,
    rawStat: p.era,
    sampleSize: Math.floor(p.inningsPitched),
    value: scores[i],
  }));
}

// 打者・投手のvalue(z-score)は同じ物差しなので、合算してそのまま順位づけできる
export function rankCombined<T extends { value: number }>(rated: T[]): (T & { rank: number })[] {
  return [...rated]
    .sort((a, b) => b.value - a.value)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
