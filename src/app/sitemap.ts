import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getColumns } from "@/lib/microcms";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const teams = await prisma.team.findMany({ select: { slug: true } });

  const season = new Date().getFullYear();
  const [battingPlayers, pitchingPlayers] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { season }, distinct: ["playerId"], select: { playerId: true } }),
    prisma.playerPitchingStat.findMany({ where: { season }, distinct: ["playerId"], select: { playerId: true } }),
  ]);
  const playerIds = [...new Set([...battingPlayers, ...pitchingPlayers].map((p) => p.playerId))];

  let columnSlugs: string[] = [];
  try {
    const { contents } = await getColumns(100);
    columnSlugs = contents.map((c) => c.slug);
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
    { url: `${siteUrl}/about/methodology`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const teamRoutes: MetadataRoute.Sitemap = teams.map((t) => ({
    url: `${siteUrl}/teams/${t.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

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

  return [...staticRoutes, ...teamRoutes, ...playerRoutes, ...columnRoutes];
}
