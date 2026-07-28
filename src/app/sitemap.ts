import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getColumns, CATEGORIES } from "@/lib/microcms";
import { categoryToSlug } from "@/lib/categorySlug";
import { siteUrl } from "@/lib/siteUrl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const teams = await prisma.team.findMany({ select: { slug: true } });

  const season = new Date().getFullYear();
  const [battingPlayers, pitchingPlayers] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { season }, distinct: ["playerId"], select: { playerId: true } }),
    prisma.playerPitchingStat.findMany({ where: { season }, distinct: ["playerId"], select: { playerId: true } }),
  ]);
  const playerIds = [...new Set([...battingPlayers, ...pitchingPlayers].map((p) => p.playerId))];

  // getColumnsは1回のリクエストにつき最大100件までしか返さないため、
  // 公開済みコラムが100本を超えた場合に漏れが出ないようoffsetでページングして全件取得する
  let columnSlugs: string[] = [];
  try {
    const pageSize = 100;
    let offset = 0;
    for (;;) {
      const { contents, totalCount } = await getColumns(pageSize, undefined, undefined, offset);
      columnSlugs.push(...contents.map((c) => c.slug));
      offset += pageSize;
      if (offset >= totalCount || contents.length === 0) break;
    }
  } catch {
    // microCMS未設定の段階ではコラムのURLは含めない
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/games`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/teams`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/titles`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/titles/batting-average`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/titles/era`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/prospects`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/analysis`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/columns`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/columns/ranking`, changeFrequency: "daily", priority: 0.6 },
    { url: `${siteUrl}/about/methodology`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const teamRoutes: MetadataRoute.Sitemap = teams.flatMap((t) => [
    { url: `${siteUrl}/teams/${t.slug}`, changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${siteUrl}/teams/${t.slug}/roster`, changeFrequency: "daily" as const, priority: 0.6 },
  ]);

  const playerRoutes: MetadataRoute.Sitemap = playerIds.map((playerId) => ({
    url: `${siteUrl}/players/${encodeURIComponent(playerId)}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const columnRoutes: MetadataRoute.Sitemap = columnSlugs.map((slug) => ({
    url: `${siteUrl}/columns/${slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const columnCategoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${siteUrl}/columns/category/${categoryToSlug(c)}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticRoutes, ...teamRoutes, ...playerRoutes, ...columnRoutes, ...columnCategoryRoutes];
}
