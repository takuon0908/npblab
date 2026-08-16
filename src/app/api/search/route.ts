import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Level } from "@prisma/client";
import { searchColumns } from "@/lib/microcms";

export interface SearchResultItem {
  type: "player" | "team" | "column";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

// コマンドパレット(⌘K)用の横断検索API。選手・球団・コラムを1回のリクエストでまとめて返す
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length === 0) return NextResponse.json({ results: [] });

  const season = new Date().getFullYear();

  const [teams, battingRows, columnsResult] = await Promise.all([
    prisma.team.findMany({ where: { name: { contains: q } }, take: 5 }),
    prisma.playerBattingStat.findMany({
      where: { season, level: Level.ICHIGUN, playerName: { contains: q } },
      include: { team: true },
      orderBy: { date: "desc" },
      distinct: ["playerId"],
      take: 5,
    }),
    searchColumns(q, 5).catch(() => ({ contents: [] as { id: string; slug: string; title: string; category?: string[] }[] })),
  ]);

  const results: SearchResultItem[] = [
    ...teams.map((t) => ({
      type: "team" as const,
      id: t.id,
      title: t.name,
      subtitle: t.league === "CENTRAL" ? "セ・リーグ" : "パ・リーグ",
      href: `/teams/${t.slug}`,
    })),
    ...battingRows.map((b) => ({
      type: "player" as const,
      id: b.playerId,
      title: b.playerName,
      subtitle: b.team.name,
      href: `/players/${encodeURIComponent(b.playerId)}`,
    })),
    ...columnsResult.contents.map((c) => ({
      type: "column" as const,
      id: c.id,
      title: c.title,
      subtitle: c.category?.[0],
      href: `/columns/${c.slug}`,
    })),
  ];

  return NextResponse.json({ results });
}
