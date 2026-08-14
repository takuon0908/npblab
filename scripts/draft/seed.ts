// リサーチ結果(scripts/draft/data/*.ts)をDraftPickテーブルにupsertする共通スクリプト。
// 使い方: npx tsx --env-file=.env.local scripts/draft/seed.ts <teamSlug> <データファイルへの相対パス(拡張子無し)>
// 例:     npx tsx --env-file=.env.local scripts/draft/seed.ts tigers data/tigers-2021-2025
import { prisma } from "@/lib/prisma";

export interface DraftPickInput {
  year: number;
  round: number;
  isDevelopmental?: boolean;
  playerName: string;
  playerId?: string;
  position: string;
  previousAffiliation?: string;
  npbDebutMade: boolean;
  careerGames?: number;
  qualifiedSeasons: number;
  titles?: string;
  isActive: boolean;
  note?: string;
}

async function main() {
  const teamSlug = process.argv[2];
  const dataPath = process.argv[3];
  if (!teamSlug || !dataPath) {
    console.error("使い方: npx tsx --env-file=.env.local scripts/draft/seed.ts <teamSlug> <データファイルパス(拡張子無し)>");
    process.exit(1);
  }

  const team = await prisma.team.findUnique({ where: { slug: teamSlug } });
  if (!team) {
    console.error(`球団が見つかりません: slug=${teamSlug}`);
    process.exit(1);
  }

  const mod = (await import(`./${dataPath}`)) as { picks: DraftPickInput[] };
  const picks = mod.picks;

  for (const p of picks) {
    await prisma.draftPick.upsert({
      where: {
        year_round_isDevelopmental_teamId_playerName: {
          year: p.year,
          round: p.round,
          isDevelopmental: p.isDevelopmental ?? false,
          teamId: team.id,
          playerName: p.playerName,
        },
      },
      create: {
        year: p.year,
        round: p.round,
        isDevelopmental: p.isDevelopmental ?? false,
        teamId: team.id,
        playerName: p.playerName,
        playerId: p.playerId,
        position: p.position,
        previousAffiliation: p.previousAffiliation,
        npbDebutMade: p.npbDebutMade,
        careerGames: p.careerGames,
        qualifiedSeasons: p.qualifiedSeasons,
        titles: p.titles,
        isActive: p.isActive,
        note: p.note,
      },
      update: {
        playerId: p.playerId,
        position: p.position,
        previousAffiliation: p.previousAffiliation,
        npbDebutMade: p.npbDebutMade,
        careerGames: p.careerGames,
        qualifiedSeasons: p.qualifiedSeasons,
        titles: p.titles,
        isActive: p.isActive,
        note: p.note,
      },
    });
  }

  console.log(`${picks.length}件を ${team.name} (${teamSlug}) に登録/更新しました`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
