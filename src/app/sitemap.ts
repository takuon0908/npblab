import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getAllColumns, CATEGORIES } from "@/lib/microcms";
import { categoryToSlug } from "@/lib/categorySlug";
import { siteUrl } from "@/lib/siteUrl";

// revalidate未指定だとビルド時(=コードデプロイ時)にしか再生成されない。
// 日次パイプラインはコードを触らずSupabaseにデータを書き込むだけなので、それだと
// デプロイの無い日に増えた新規選手・新着記事がサイトマップに反映されないまま取り残される
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const teams = await prisma.team.findMany({ select: { slug: true } });

  const season = new Date().getFullYear();
  const [battingPlayers, pitchingPlayers] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { season }, distinct: ["playerId"], select: { playerId: true } }),
    prisma.playerPitchingStat.findMany({ where: { season }, distinct: ["playerId"], select: { playerId: true } }),
  ]);
  const playerIds = [...new Set([...battingPlayers, ...pitchingPlayers].map((p) => p.playerId))];

  let columns: { slug: string; updatedAt: string }[] = [];
  try {
    columns = (await getAllColumns()).map((c) => ({ slug: c.slug, updatedAt: c.updatedAt }));
  } catch {
    // microCMS未設定の段階ではコラムのURLは含めない
  }

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1, lastModified: now },
    { url: `${siteUrl}/games`, changeFrequency: "daily", priority: 0.9, lastModified: now },
    { url: `${siteUrl}/teams`, changeFrequency: "daily", priority: 0.9, lastModified: now },
    { url: `${siteUrl}/titles`, changeFrequency: "daily", priority: 0.9, lastModified: now },
    { url: `${siteUrl}/titles/batting-average`, changeFrequency: "daily", priority: 0.7, lastModified: now },
    { url: `${siteUrl}/titles/era`, changeFrequency: "daily", priority: 0.7, lastModified: now },
    { url: `${siteUrl}/prospects`, changeFrequency: "daily", priority: 0.8, lastModified: now },
    { url: `${siteUrl}/analysis`, changeFrequency: "daily", priority: 0.8, lastModified: now },
    { url: `${siteUrl}/analysis/innings`, changeFrequency: "daily", priority: 0.7, lastModified: now },
    { url: `${siteUrl}/columns`, changeFrequency: "daily", priority: 0.7, lastModified: now },
    { url: `${siteUrl}/columns/ranking`, changeFrequency: "daily", priority: 0.6, lastModified: now },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.4, lastModified: now },
    { url: `${siteUrl}/about/methodology`, changeFrequency: "monthly", priority: 0.4, lastModified: now },
  ];

  const teamRoutes: MetadataRoute.Sitemap = teams.flatMap((t) => [
    { url: `${siteUrl}/teams/${t.slug}`, changeFrequency: "daily" as const, priority: 0.8, lastModified: now },
    { url: `${siteUrl}/teams/${t.slug}/roster`, changeFrequency: "daily" as const, priority: 0.6, lastModified: now },
  ]);

  const playerRoutes: MetadataRoute.Sitemap = playerIds.map((playerId) => ({
    url: `${siteUrl}/players/${encodeURIComponent(playerId)}`,
    changeFrequency: "daily",
    priority: 0.6,
    lastModified: now,
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
