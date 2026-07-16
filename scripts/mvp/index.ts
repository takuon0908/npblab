// 日次バッチのエントリポイント
// 1軍打者・投手を「LABバリュー」独自指標で算出し、合算ランキングとしてPlayerValueRatingに書き戻す

import { PrismaClient, Level, ProspectCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computeBattingValue, computePitchingValue, rankCombined } from "./compute";
import { latestPerPlayer } from "../shared/latestPerPlayer";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URLが設定されていません");
}
const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// シーズン中盤時点の目安。規定打席/投球回の正式基準ではなく、サンプルサイズが
// 極端に小さい選手を除外するための緩い足切り
const MIN_PLATE_APPEARANCES = 100;
const MIN_INNINGS_PITCHED = 30;

async function main() {
  const date = new Date(todayIso());
  const season = new Date().getFullYear();

  const [battingStats, pitchingStats] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { level: Level.ICHIGUN, season } }),
    prisma.playerPitchingStat.findMany({ where: { level: Level.ICHIGUN, season } }),
  ]);

  const battingValues = computeBattingValue(latestPerPlayer(battingStats), MIN_PLATE_APPEARANCES);
  const pitchingValues = computePitchingValue(latestPerPlayer(pitchingStats), MIN_INNINGS_PITCHED);

  const combined = rankCombined([
    ...battingValues.map((v) => ({ ...v, category: ProspectCategory.BATTING })),
    ...pitchingValues.map((v) => ({ ...v, category: ProspectCategory.PITCHING })),
  ]);

  let count = 0;
  for (const r of combined) {
    await prisma.playerValueRating.upsert({
      where: { playerId_category_date: { playerId: r.playerId, category: r.category, date } },
      update: {
        playerName: r.playerName,
        teamId: r.teamId,
        rawStat: r.rawStat,
        sampleSize: r.sampleSize,
        value: r.value,
        rank: r.rank,
      },
      create: {
        playerId: r.playerId,
        playerName: r.playerName,
        teamId: r.teamId,
        date,
        season,
        category: r.category,
        rawStat: r.rawStat,
        sampleSize: r.sampleSize,
        value: r.value,
        rank: r.rank,
      },
    });
    count++;
  }

  console.log({
    battingCount: battingValues.length,
    pitchingCount: pitchingValues.length,
    total: count,
  });
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
