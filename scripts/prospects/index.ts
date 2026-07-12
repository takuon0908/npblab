// 日次バッチのエントリポイント
// 2軍成績を1軍換算し、注目選手ランキングとしてProspectRatingに書き戻す

import { PrismaClient, Level, ProspectCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computeBattingTranslation, computePitchingTranslation } from "./compute";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URLが設定されていません");
}
const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const MIN_AT_BATS = 30;
const MIN_INNINGS = 10;

async function main() {
  const date = new Date(todayIso());
  const season = new Date().getFullYear();

  const [nigunBatting, ichigunBatting, nigunPitching, ichigunPitching] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { level: Level.NIGUN, season } }),
    prisma.playerBattingStat.findMany({ where: { level: Level.ICHIGUN, season } }),
    prisma.playerPitchingStat.findMany({ where: { level: Level.NIGUN, season } }),
    prisma.playerPitchingStat.findMany({ where: { level: Level.ICHIGUN, season } }),
  ]);

  const battingRatings = computeBattingTranslation(nigunBatting, ichigunBatting, MIN_AT_BATS);
  const pitchingRatings = computePitchingTranslation(nigunPitching, ichigunPitching, MIN_INNINGS);

  let count = 0;
  for (const r of battingRatings) {
    await prisma.prospectRating.upsert({
      where: { playerId_category_date: { playerId: r.playerId, category: ProspectCategory.BATTING, date } },
      update: {
        playerName: r.playerName,
        teamId: r.teamId,
        nigunValue: r.nigunValue,
        translatedValue: r.translatedValue,
        sampleSize: r.sampleSize,
        rank: r.rank,
      },
      create: {
        playerId: r.playerId,
        playerName: r.playerName,
        teamId: r.teamId,
        date,
        category: ProspectCategory.BATTING,
        nigunValue: r.nigunValue,
        translatedValue: r.translatedValue,
        sampleSize: r.sampleSize,
        rank: r.rank,
      },
    });
    count++;
  }

  for (const r of pitchingRatings) {
    await prisma.prospectRating.upsert({
      where: { playerId_category_date: { playerId: r.playerId, category: ProspectCategory.PITCHING, date } },
      update: {
        playerName: r.playerName,
        teamId: r.teamId,
        nigunValue: r.nigunValue,
        translatedValue: r.translatedValue,
        sampleSize: r.sampleSize,
        rank: r.rank,
      },
      create: {
        playerId: r.playerId,
        playerName: r.playerName,
        teamId: r.teamId,
        date,
        category: ProspectCategory.PITCHING,
        nigunValue: r.nigunValue,
        translatedValue: r.translatedValue,
        sampleSize: r.sampleSize,
        rank: r.rank,
      },
    });
    count++;
  }

  console.log({ battingCount: battingRatings.length, pitchingCount: pitchingRatings.length, total: count });
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
