import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Level } from "@prisma/client";

// 選手比較ツール(/compare)の検索用。今季1軍出場歴のある選手を対象に、
// 打者・投手それぞれ最新日のスナップショットから名前の部分一致で最大10件ずつ返す
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length === 0) return NextResponse.json({ results: [] });

  const season = new Date().getFullYear();

  const [battingRows, pitchingRows] = await Promise.all([
    prisma.playerBattingStat.findMany({
      where: { season, level: Level.ICHIGUN, playerName: { contains: q } },
      include: { team: true },
      orderBy: { date: "desc" },
      distinct: ["playerId"],
      take: 10,
    }),
    prisma.playerPitchingStat.findMany({
      where: { season, level: Level.ICHIGUN, playerName: { contains: q } },
      include: { team: true },
      orderBy: { date: "desc" },
      distinct: ["playerId"],
      take: 10,
    }),
  ]);

  const results = [
    ...battingRows.map((b) => ({ playerId: b.playerId, playerName: b.playerName, teamName: b.team.name, type: "batting" as const })),
    ...pitchingRows.map((p) => ({ playerId: p.playerId, playerName: p.playerName, teamName: p.team.name, type: "pitching" as const })),
  ].slice(0, 15);

  return NextResponse.json({ results });
}
