import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Level } from "@prisma/client";
import { Table, Th, Td } from "@/components/Table";
import { latestPerPlayer } from "@/lib/latestPerPlayer";
import { teamAbbr } from "@/lib/teamAbbr";
import { formatAvg } from "@/lib/format";

// データは1日1回(日次パイプライン)しか更新されないため24時間に緩めている(Supabase egress/Vercel ISR Writes対策)
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "打率ランキング（全選手）",
  description: "NPB1軍の全選手（規定打席未到達を含む）の打率を今シーズンの打数順に一覧できるランキング。",
  alternates: { canonical: "/titles/batting-average" },
};

async function getBatters() {
  const season = new Date().getFullYear();
  const rows = await prisma.playerBattingStat.findMany({
    where: { level: Level.ICHIGUN, season },
    include: { team: true },
  });
  return latestPerPlayer(rows)
    .filter((b) => b.atBats > 0)
    .sort((a, b) => b.avg - a.avg);
}

export default async function BattingAverageRankingPage() {
  const batters = await getBatters();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
        <Link href="/titles" className="hover:underline" style={{ color: "var(--accent)" }}>
          タイトルレース
        </Link>
      </p>
      <h1 className="text-2xl font-black mb-2">打率ランキング（全選手）</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-secondary)" }}>
        規定打席未到達の選手も含む、今シーズン打数のある全選手（{batters.length}人）の打率一覧です。
      </p>

      <Table>
        <thead>
          <tr>
            <Th align="right">順位</Th>
            <Th>選手</Th>
            <Th align="right">打率</Th>
            <Th align="right">打数</Th>
            <Th align="right">安打</Th>
          </tr>
        </thead>
        <tbody>
          {batters.map((b, i) => (
            <tr key={b.playerId} className="hover:bg-white/[0.05]">
              <Td align="right" muted>
                {i + 1}
              </Td>
              <Td>
                <Link href={`/players/${b.playerId}`} className="hover:underline">
                  {b.playerName}
                </Link>
                <Link
                  href={`/teams/${b.team.slug}`}
                  className="text-xs ml-1 hover:underline"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  ({teamAbbr(b.team.slug)})
                </Link>
              </Td>
              <Td align="right">
                <span className="font-semibold">{formatAvg(b.avg)}</span>
              </Td>
              <Td align="right" muted>
                {b.atBats}
              </Td>
              <Td align="right" muted>
                {b.hits}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </main>
  );
}
