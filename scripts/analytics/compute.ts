// 試合結果（得失点・勝敗）から算出する分析系指標の純粋関数群

export interface FinishedGame {
  date: Date;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
}

// ピタゴラス勝率（Bill James式、指数2）。得失点から見た「実力相応の勝率」
export function computePythagoreanWinPct(runsScored: number, runsAllowed: number): number {
  if (runsScored === 0 && runsAllowed === 0) return 0.5;
  return runsScored ** 2 / (runsScored ** 2 + runsAllowed ** 2);
}

// 対戦相手の強さを加味したパワーランキング。ホームアドバンテージは考慮しない簡易版
export function computeEloRatings(
  games: FinishedGame[],
  kFactor = 20,
  initialRating = 1500,
): Map<string, number> {
  const ratings = new Map<string, number>();
  const sorted = [...games].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const g of sorted) {
    const homeRating = ratings.get(g.homeTeamId) ?? initialRating;
    const awayRating = ratings.get(g.awayTeamId) ?? initialRating;
    const expectedHome = 1 / (1 + 10 ** ((awayRating - homeRating) / 400));

    let actualHome: number;
    if (g.homeScore > g.awayScore) actualHome = 1;
    else if (g.homeScore < g.awayScore) actualHome = 0;
    else actualHome = 0.5;

    const delta = kFactor * (actualHome - expectedHome);
    ratings.set(g.homeTeamId, homeRating + delta);
    ratings.set(g.awayTeamId, awayRating - delta);
  }

  return ratings;
}

export function computeLast10(
  games: FinishedGame[],
  teamId: string,
): { wins: number; losses: number; draws: number } {
  const teamGames = games
    .filter((g) => g.homeTeamId === teamId || g.awayTeamId === teamId)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  let wins = 0;
  let losses = 0;
  let draws = 0;
  for (const g of teamGames) {
    const isHome = g.homeTeamId === teamId;
    const teamScore = isHome ? g.homeScore : g.awayScore;
    const oppScore = isHome ? g.awayScore : g.homeScore;
    if (teamScore > oppScore) wins++;
    else if (teamScore < oppScore) losses++;
    else draws++;
  }
  return { wins, losses, draws };
}
