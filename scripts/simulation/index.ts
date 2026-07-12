// 日次バッチのエントリポイント
// DBから現在の順位・残り日程・タイトルリーダーズを読み込み、simulate.tsで確率を計算して書き戻す

import { PrismaClient, League, TitleCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  simulateLeagueChampionship,
  simulateTitleRace,
  type TeamRecord,
  type ScheduledGame,
  type TitleCandidate,
} from "./simulate";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URLが設定されていません");
}
const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ポアソン分布で加算していくのが妥当な「積み上げ型」の記録のみを対象にする。
// 打率・防御率のような比率成績は、規定打席/規定投球回の判定や母数の扱いが別モデルになるため対象外（TODO）
const COUNTING_CATEGORIES: TitleCategory[] = [
  TitleCategory.HOME_RUNS,
  TitleCategory.RBI,
  TitleCategory.STOLEN_BASES,
  TitleCategory.WINS,
  TitleCategory.STRIKEOUTS,
  TitleCategory.SAVES,
  TitleCategory.HOLDS,
];

async function simulateChampionship(date: Date, runs: number) {
  const latest = await prisma.standingsSnapshot.aggregate({ _max: { date: true } });
  const latestDate = latest._max.date;
  if (!latestDate) throw new Error("StandingsSnapshotが空です。先にnpm run scrapeを実行してください");

  const standings = await prisma.standingsSnapshot.findMany({
    where: { date: latestDate },
    include: { team: true },
  });

  const teams: TeamRecord[] = standings.map((s) => ({
    teamId: s.teamId,
    league: s.team.league === League.CENTRAL ? "central" : "pacific",
    wins: s.wins,
    losses: s.losses,
  }));

  const remainingGames = await prisma.game.findMany({
    where: { isFinished: false, date: { gte: date } },
  });
  const scheduledGames: ScheduledGame[] = remainingGames.map((g) => ({
    homeTeamId: g.homeTeamId,
    awayTeamId: g.awayTeamId,
  }));

  const results = simulateLeagueChampionship(teams, scheduledGames, runs);

  for (const [teamId, result] of Object.entries(results)) {
    await prisma.championshipProbability.upsert({
      where: { teamId_date: { teamId, date } },
      update: {
        probability: result.probability,
        projectedWins: result.projectedWins,
        projectedLosses: result.projectedLosses,
        simulationRuns: runs,
      },
      create: {
        teamId,
        date,
        probability: result.probability,
        projectedWins: result.projectedWins,
        projectedLosses: result.projectedLosses,
        simulationRuns: runs,
      },
    });
  }

  return { teamCount: teams.length, remainingGameCount: scheduledGames.length };
}

async function remainingGamesForTeam(teamId: string, date: Date): Promise<number> {
  return prisma.game.count({
    where: {
      isFinished: false,
      date: { gte: date },
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
  });
}

async function simulateTitleRaces(date: Date, runs: number) {
  const latest = await prisma.titleLeaderSnapshot.aggregate({ _max: { date: true } });
  const latestDate = latest._max.date;
  if (!latestDate) throw new Error("TitleLeaderSnapshotが空です。先にnpm run scrapeを実行してください");

  let candidateCount = 0;

  for (const category of COUNTING_CATEGORIES) {
    const leaders = await prisma.titleLeaderSnapshot.findMany({
      where: { category, date: latestDate },
      include: { team: true },
    });
    if (leaders.length === 0) continue;

    const candidates: TitleCandidate[] = [];
    const meta = new Map<string, { playerName: string; teamId: string; currentValue: number; perGameRate: number; remaining: number }>();

    for (const leader of leaders) {
      const standing = await prisma.standingsSnapshot.findFirst({
        where: { teamId: leader.teamId },
        orderBy: { date: "desc" },
      });
      const teamGamesPlayed = standing ? standing.wins + standing.losses + standing.draws : 0;
      const perGameRate = teamGamesPlayed > 0 ? leader.value / teamGamesPlayed : 0;
      const remaining = await remainingGamesForTeam(leader.teamId, date);

      candidates.push({
        playerId: leader.playerId,
        currentValue: leader.value,
        remainingGames: remaining,
        perGameRate,
      });
      meta.set(leader.playerId, {
        playerName: leader.playerName,
        teamId: leader.teamId,
        currentValue: leader.value,
        perGameRate,
        remaining,
      });
    }

    const probabilities = simulateTitleRace(candidates, runs);

    for (const [playerId, probability] of Object.entries(probabilities)) {
      const info = meta.get(playerId)!;
      const projectedValue = info.currentValue + info.perGameRate * info.remaining;

      await prisma.titleRaceProbability.upsert({
        where: { playerId_category_date: { playerId, category, date } },
        update: {
          probability,
          currentValue: info.currentValue,
          projectedValue,
          playerName: info.playerName,
          teamId: info.teamId,
        },
        create: {
          playerId,
          playerName: info.playerName,
          teamId: info.teamId,
          category,
          date,
          probability,
          currentValue: info.currentValue,
          projectedValue,
        },
      });
      candidateCount++;
    }
  }

  return { candidateCount };
}

async function main() {
  const date = new Date(todayIso());
  const runs = 10000;

  const championshipResult = await simulateChampionship(date, runs);
  const titleResult = await simulateTitleRaces(date, runs);

  console.log({ championshipResult, titleResult });
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
