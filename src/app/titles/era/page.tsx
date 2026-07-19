import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Level } from "@prisma/client";
import { Table, Th, Td } from "@/components/Table";
import { latestPerPlayer } from "@/lib/latestPerPlayer";
import { teamAbbr } from "@/lib/teamAbbr";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "防御率ランキング（全選手）",
  description: "NPB1軍の全投手（規定投球回未到達を含む）の防御率を今シーズンの投球回順に一覧できるランキング。",
  alternates: { canonical: "/titles/era" },
};

async function getPitchers() {
  const season = new Date().getFullYear();
  const rows = await prisma.playerPitchingStat.findMany({
    where: { level: Level.ICHIGUN, season },
    include: { team: true },
  });
  return latestPerPlayer(rows)
    .filter((p) => p.inningsPitched > 0)
    .sort((a, b) => a.era - b.era);
}

export default async function EraRankingPage() {
  const pitchers = await getPitchers();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
        <Link href="/titles" className="hover:underline" style={{ color: "var(--accent)" }}>
          タイトルレース
        </Link>
      </p>
      <h1 className="text-2xl font-bold mb-2">防御率ランキング（全選手）</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-secondary)" }}>
        規定投球回未到達の選手も含む、今シーズン登板のある全投手（{pitchers.length}人）の防御率一覧です。
      </p>

      <Table>
        <thead>
          <tr>
            <Th align="right">順位</Th>
            <Th>選手</Th>
            <Th align="right">防御率</Th>
            <Th align="right">投球回</Th>
            <Th align="right">奪三振</Th>
          </tr>
        </thead>
        <tbody>
          {pitchers.map((p, i) => (
            <tr key={p.playerId} className="hover:bg-black/[0.03]">
              <Td align="right" muted>
                {i + 1}
              </Td>
              <Td>
                <Link href={`/players/${p.playerId}`} className="hover:underline">
                  {p.playerName}
                </Link>
                <Link
                  href={`/teams/${p.team.slug}`}
                  className="text-xs ml-1 hover:underline"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  ({teamAbbr(p.team.slug)})
                </Link>
              </Td>
              <Td align="right">
                <span className="font-semibold">{p.era.toFixed(2)}</span>
              </Td>
              <Td align="right" muted>
                {p.inningsPitched.toFixed(1)}
              </Td>
              <Td align="right" muted>
                {p.strikeouts}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </main>
  );
}
