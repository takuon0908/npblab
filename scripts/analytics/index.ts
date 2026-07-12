// 日次バッチのエントリポイント
// 試合結果からピタゴラス勝率・パワーランキング・直近成績・特徴の要約文を計算し、TeamInsightに書き戻す

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computePythagoreanWinPct, computeEloRatings, computeLast10, type FinishedGame } from "./compute";
import { generateTeamSummary } from "./summary";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URLが設定されていません");
}
const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const date = new Date(todayIso());

  const teams = await prisma.team.findMany();
  const finishedGames = await prisma.game.findMany({ where: { isFinished: true } });

  const games: FinishedGame[] = finishedGames.map((g) => ({
    date: g.date,
    homeTeamId: g.homeTeamId,
    awayTeamId: g.awayTeamId,
    homeScore: g.homeScore!,
    awayScore: g.awayScore!,
  }));

  const eloRatings = computeEloRatings(games);

  const runTotals = new Map<string, { runsScored: number; runsAllowed: number }>();
  for (const t of teams) runTotals.set(t.id, { runsScored: 0, runsAllowed: 0 });
  for (const g of games) {
    const home = runTotals.get(g.homeTeamId);
    const away = runTotals.get(g.awayTeamId);
    if (home) {
      home.runsScored += g.homeScore;
      home.runsAllowed += g.awayScore;
    }
    if (away) {
      away.runsScored += g.awayScore;
      away.runsAllowed += g.homeScore;
    }
  }

  const latestStandingsDate = await prisma.standingsSnapshot.aggregate({ _max: { date: true } });
  if (!latestStandingsDate._max.date) {
    throw new Error("StandingsSnapshotが空です。先にnpm run scrapeを実行してください");
  }
  const standings = await prisma.standingsSnapshot.findMany({
    where: { date: latestStandingsDate._max.date },
  });
  const standingByTeam = new Map(standings.map((s) => [s.teamId, s]));

  const byLeague = new Map<string, typeof teams>();
  for (const t of teams) {
    const arr = byLeague.get(t.league) ?? [];
    arr.push(t);
    byLeague.set(t.league, arr);
  }

  let count = 0;
  for (const [, leagueTeams] of byLeague) {
    const ranked = leagueTeams
      .map((t) => ({ team: t, ...(runTotals.get(t.id) ?? { runsScored: 0, runsAllowed: 0 }) }))
      .sort((a, b) => b.runsScored - a.runsScored);
    const offenseRankByTeam = new Map(ranked.map((r, i) => [r.team.id, i + 1]));

    const rankedByAllowed = [...ranked].sort((a, b) => a.runsAllowed - b.runsAllowed);
    const defenseRankByTeam = new Map(rankedByAllowed.map((r, i) => [r.team.id, i + 1]));

    for (const t of leagueTeams) {
      const totals = runTotals.get(t.id) ?? { runsScored: 0, runsAllowed: 0 };
      const pythagoreanWinPct = computePythagoreanWinPct(totals.runsScored, totals.runsAllowed);
      const standing = standingByTeam.get(t.id);
      const actualWinPct = standing?.winPct ?? 0.5;
      const last10 = computeLast10(games, t.id);
      const offenseRank = offenseRankByTeam.get(t.id) ?? leagueTeams.length;
      const defenseRank = defenseRankByTeam.get(t.id) ?? leagueTeams.length;
      const gamesPlayed = standing ? standing.wins + standing.losses + standing.draws : 0;

      const summary = generateTeamSummary({
        offenseRank,
        defenseRank,
        leagueSize: leagueTeams.length,
        luckGap: actualWinPct - pythagoreanWinPct,
        last10Wins: last10.wins,
        last10Losses: last10.losses,
        last10Draws: last10.draws,
      });

      await prisma.teamInsight.upsert({
        where: { teamId_date: { teamId: t.id, date } },
        update: {
          pythagoreanWinPct,
          actualWinPct,
          eloRating: eloRatings.get(t.id) ?? 1500,
          last10Wins: last10.wins,
          last10Losses: last10.losses,
          last10Draws: last10.draws,
          offenseRank,
          defenseRank,
          summary,
          runsScored: totals.runsScored,
          runsAllowed: totals.runsAllowed,
          gamesPlayed,
        },
        create: {
          teamId: t.id,
          date,
          pythagoreanWinPct,
          actualWinPct,
          eloRating: eloRatings.get(t.id) ?? 1500,
          last10Wins: last10.wins,
          last10Losses: last10.losses,
          last10Draws: last10.draws,
          offenseRank,
          defenseRank,
          summary,
          runsScored: totals.runsScored,
          runsAllowed: totals.runsAllowed,
          gamesPlayed,
        },
      });
      count++;
    }
  }

  console.log({ teamInsightCount: count });
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
