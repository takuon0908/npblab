import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getAllColumns, CATEGORIES } from "@/lib/microcms";
import { categoryToSlug } from "@/lib/categorySlug";
import { siteUrl } from "@/lib/siteUrl";
import { hasSufficientSeasonSample } from "@/lib/playerContentQuality";

// revalidate未指定だとビルド時(=コードデプロイ時)にしか再生成されない。
// 日次パイプラインはコードを触らずSupabaseにデータを書き込むだけなので、それだと
// デプロイの無い日に増えた新規選手・新着記事がサイトマップに反映されないまま取り残される
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const teams = await prisma.team.findMany({ select: { slug: true } });

  const season = new Date().getFullYear();
  const [battingRows, pitchingRows] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { season }, select: { playerId: true, level: true, atBats: true, games: true } }),
    prisma.playerPitchingStat.findMany({ where: { season }, select: { playerId: true, level: true, inningsPitched: true } }),
  ]);
  const allPlayerIds = [...new Set([...battingRows.map((p) => p.playerId), ...pitchingRows.map((p) => p.playerId)])];
  // 今季ほぼ出場のない選手はページの情報量が乏しく、AdSenseの品質審査で
  // 「有用性の低いコンテンツ」の一因になりうるため、検索エンジンに送るURLから除外する
  // (ページ自体はnoindexで残るのみ。詳細はplayerContentQuality.ts、players/[playerId]/page.tsx)
  const playerIds = allPlayerIds.filter((playerId) =>
    hasSufficientSeasonSample(
      battingRows.filter((b) => b.playerId === playerId),
      pitchingRows.filter((p) => p.playerId === playerId),
    ),
  );

  let columns: { slug: string; updatedAt: string }[] = [];
  try {
    columns = (await getAllColumns()).map((c) => ({ slug: c.slug, updatedAt: c.updatedAt }));
  } catch {
    // microCMS未設定の段階ではコラムのURLは含めない
  }

  const now = new Date();
  // 「実際にデータが更新された日」をlastModifiedに使う(サイトマップ生成時刻ではなく)。
  // ビルド時刻をそのまま使うと、日次パイプラインが動かなかった日でもGoogleに
  // 「今日更新された」と伝えてしまい、更新頻度の信号として不正確になるため
  const latestStandings = await prisma.standingsSnapshot.aggregate({ _max: { date: true } });
  const dataUpdatedAt = latestStandings._max.date ?? now;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1, lastModified: dataUpdatedAt },
    { url: `${siteUrl}/games`, changeFrequency: "daily", priority: 0.9, lastModified: dataUpdatedAt },
    { url: `${siteUrl}/teams`, changeFrequency: "daily", priority: 0.9, lastModified: dataUpdatedAt },
    { url: `${siteUrl}/titles`, changeFrequency: "daily", priority: 0.9, lastModified: dataUpdatedAt },
    { url: `${siteUrl}/titles/batting-average`, changeFrequency: "daily", priority: 0.7, lastModified: dataUpdatedAt },
    { url: `${siteUrl}/titles/era`, changeFrequency: "daily", priority: 0.7, lastModified: dataUpdatedAt },
    { url: `${siteUrl}/prospects`, changeFrequency: "daily", priority: 0.8, lastModified: dataUpdatedAt },
    { url: `${siteUrl}/analysis`, changeFrequency: "daily", priority: 0.8, lastModified: dataUpdatedAt },
    { url: `${siteUrl}/analysis/innings`, changeFrequency: "daily", priority: 0.7, lastModified: dataUpdatedAt },
    { url: `${siteUrl}/columns`, changeFrequency: "daily", priority: 0.7, lastModified: now },
    { url: `${siteUrl}/columns/ranking`, changeFrequency: "daily", priority: 0.6, lastModified: now },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.4, lastModified: now },
    { url: `${siteUrl}/about/methodology`, changeFrequency: "monthly", priority: 0.4, lastModified: now },
    { url: `${siteUrl}/privacy`, changeFrequency: "monthly", priority: 0.3, lastModified: now },
  ];

  const teamRoutes: MetadataRoute.Sitemap = teams.flatMap((t) => [
    { url: `${siteUrl}/teams/${t.slug}`, changeFrequency: "daily" as const, priority: 0.8, lastModified: dataUpdatedAt },
    { url: `${siteUrl}/teams/${t.slug}/roster`, changeFrequency: "daily" as const, priority: 0.6, lastModified: dataUpdatedAt },
  ]);

  const playerRoutes: MetadataRoute.Sitemap = playerIds.map((playerId) => ({
    url: `${siteUrl}/players/${encodeURIComponent(playerId)}`,
    changeFrequency: "daily",
    priority: 0.6,
    lastModified: dataUpdatedAt,
  }));

  const columnRoutes: MetadataRoute.Sitemap = columns.map((c) => ({
    url: `${siteUrl}/columns/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
    lastModified: new Date(c.updatedAt),
  }));

  const columnCategoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${siteUrl}/columns/category/${categoryToSlug(c)}`,
    changeFrequency: "daily",
    priority: 0.6,
    lastModified: now,
  }));

  return [...staticRoutes, ...teamRoutes, ...playerRoutes, ...columnRoutes, ...columnCategoryRoutes];
}
