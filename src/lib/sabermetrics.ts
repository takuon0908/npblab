// 公開されている一般的な線形加重係数を使った簡易セイバーメトリクス指標。
// NPBの実際の得点環境に合わせて厳密に較正した値ではない、当サイト独自の近似試算であることが前提

export interface PitchingLine {
  inningsPitched: number;
  homeRuns: number;
  walks: number;
  hitByPitch: number;
  strikeouts: number;
}

// FIP(Fielding Independent Pitching): 守備・運に依存しない投手個人の責任範囲(本塁打・四死球・奪三振)だけで
// 防御率相当のスケールに変換した指標。定数はリーグ全体の防御率に合わせて動的に較正する
export function calcFipConstant(league: (PitchingLine & { era: number })[]): number {
  const totalIp = league.reduce((sum, p) => sum + p.inningsPitched, 0);
  if (totalIp === 0) return 3.1;

  const totalEarnedRuns = league.reduce((sum, p) => sum + (p.era * p.inningsPitched) / 9, 0);
  const lgEra = (totalEarnedRuns / totalIp) * 9;

  const totalHr = league.reduce((sum, p) => sum + p.homeRuns, 0);
  const totalBb = league.reduce((sum, p) => sum + p.walks, 0);
  const totalHbp = league.reduce((sum, p) => sum + p.hitByPitch, 0);
  const totalK = league.reduce((sum, p) => sum + p.strikeouts, 0);
  const rawComponent = (13 * totalHr + 3 * (totalBb + totalHbp) - 2 * totalK) / totalIp;

  return lgEra - rawComponent;
}

export function calcFip(p: PitchingLine, constant: number): number {
  if (p.inningsPitched === 0) return 0;
  return (13 * p.homeRuns + 3 * (p.walks + p.hitByPitch) - 2 * p.strikeouts) / p.inningsPitched + constant;
}

export interface BattingLine {
  plateAppearances: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  walks: number;
  hitByPitch: number;
}

// wOBA(weighted On-Base Average): 出塁の質を単打・二塁打・三塁打・本塁打・四死球で重みづけした総合打撃指標。
// 係数は近年のMLB分析で広く使われる近似値を採用（NPB固有の較正は行っていない）
export function calcWoba(b: BattingLine): number {
  if (b.plateAppearances === 0) return 0;
  const singles = b.hits - b.doubles - b.triples - b.homeRuns;
  const numerator =
    0.69 * b.walks + 0.72 * b.hitByPitch + 0.89 * singles + 1.27 * b.doubles + 1.62 * b.triples + 2.1 * b.homeRuns;
  return numerator / b.plateAppearances;
}
