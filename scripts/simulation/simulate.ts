// 優勝確率・タイトル獲得確率のモンテカルロシミュレーション本体
// DB読み込み部分を持たない純粋関数群。DBアクセスはindex.ts側で行う

export interface TeamRecord {
  teamId: string;
  league: "central" | "pacific";
  wins: number;
  losses: number;
  // What-If用: 指定するとwins/lossesから算出する勝率の代わりにこちらを使う
  // （例: 得失点を仮に増減させたピタゴラス勝率で「補強したら優勝確率がどう変わるか」を試算する）
  winPctOverride?: number;
}

export interface ScheduledGame {
  homeTeamId: string;
  awayTeamId: string;
}

// log5法: 2チームの勝率からその対戦の勝率を推定する（セイバーメトリクスの標準的な近似式）
function log5WinProb(winPctA: number, winPctB: number): number {
  const denom = winPctA + winPctB - 2 * winPctA * winPctB;
  if (denom <= 0) return 0.5;
  return (winPctA - winPctA * winPctB) / denom;
}

export interface ChampionshipResult {
  probability: number;
  projectedWins: number;
  projectedLosses: number;
}

export function simulateLeagueChampionship(
  teams: TeamRecord[],
  remainingGames: ScheduledGame[],
  runs = 10000,
): Record<string, ChampionshipResult> {
  const firstPlaceCount: Record<string, number> = {};
  const winsSum: Record<string, number> = {};
  for (const t of teams) {
    firstPlaceCount[t.teamId] = 0;
    winsSum[t.teamId] = 0;
  }

  const byLeague = new Map<string, TeamRecord[]>();
  for (const t of teams) {
    const arr = byLeague.get(t.league) ?? [];
    arr.push(t);
    byLeague.set(t.league, arr);
  }

  const remainingGameCount: Record<string, number> = {};
  for (const t of teams) remainingGameCount[t.teamId] = 0;
  for (const game of remainingGames) {
    if (remainingGameCount[game.homeTeamId] !== undefined) remainingGameCount[game.homeTeamId]++;
    if (remainingGameCount[game.awayTeamId] !== undefined) remainingGameCount[game.awayTeamId]++;
  }

  for (let i = 0; i < runs; i++) {
    const wins = new Map(teams.map((t) => [t.teamId, t.wins]));

    for (const game of remainingGames) {
      const home = teams.find((t) => t.teamId === game.homeTeamId);
      const away = teams.find((t) => t.teamId === game.awayTeamId);
      if (!home || !away) continue;

      const homePct = home.winPctOverride ?? home.wins / Math.max(home.wins + home.losses, 1);
      const awayPct = away.winPctOverride ?? away.wins / Math.max(away.wins + away.losses, 1);
      const homeWinProb = log5WinProb(homePct, awayPct);

      if (Math.random() < homeWinProb) {
        wins.set(home.teamId, (wins.get(home.teamId) ?? 0) + 1);
      } else {
        wins.set(away.teamId, (wins.get(away.teamId) ?? 0) + 1);
      }
    }

    for (const t of teams) winsSum[t.teamId] += wins.get(t.teamId) ?? 0;

    for (const [, leagueTeams] of byLeague) {
      const maxWins = Math.max(...leagueTeams.map((t) => wins.get(t.teamId) ?? 0));
      const leaders = leagueTeams.filter((t) => (wins.get(t.teamId) ?? 0) === maxWins);
      // 最終勝数タイの場合は均等に按分（簡易的な扱い。実際はプレーオフ等の規定が別途ある）
      for (const leader of leaders) {
        firstPlaceCount[leader.teamId] += 1 / leaders.length;
      }
    }
  }

  const results: Record<string, ChampionshipResult> = {};
  for (const t of teams) {
    const projectedWins = winsSum[t.teamId] / runs;
    const totalGames = t.wins + t.losses + remainingGameCount[t.teamId];
    results[t.teamId] = {
      probability: firstPlaceCount[t.teamId] / runs,
      projectedWins,
      projectedLosses: totalGames - projectedWins,
    };
  }
  return results;
}

export interface TitleCandidate {
  playerId: string;
  currentValue: number;
  remainingGames: number;
  perGameRate: number; // 1試合あたりの期待値（HR数、勝利数など。ポアソン分布でばらつきを表現）
}

export function simulateTitleRace(
  candidates: TitleCandidate[],
  runs = 10000,
): Record<string, number> {
  const winCount: Record<string, number> = {};
  for (const c of candidates) winCount[c.playerId] = 0;

  for (let i = 0; i < runs; i++) {
    let bestPlayerId: string | null = null;
    let bestValue = -Infinity;

    for (const c of candidates) {
      const projectedAddition = samplePoisson(c.perGameRate * c.remainingGames);
      const finalValue = c.currentValue + projectedAddition;
      if (finalValue > bestValue) {
        bestValue = finalValue;
        bestPlayerId = c.playerId;
      }
    }

    if (bestPlayerId) winCount[bestPlayerId] += 1;
  }

  const probabilities: Record<string, number> = {};
  for (const c of candidates) probabilities[c.playerId] = winCount[c.playerId] / runs;
  return probabilities;
}

// Knuthのアルゴリズムによるポアソン分布サンプリング
function samplePoisson(lambda: number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}
