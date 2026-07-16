import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProspectCategory } from "@prisma/client";
import { Table, Th, Td } from "@/components/Table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "独自指標 LABバリューMVPランキング",
  description:
    "打者・投手を同じ物差し（リーグ平均からの標準得点）で比較する、プロ野球LAB独自の貢献度指数「LABバリュー」ランキング。",
  alternates: { canonical: "/analysis" },
};

const CATEGORY_LABEL: Record<ProspectCategory, string> = {
  [ProspectCategory.BATTING]: "打者",
  [ProspectCategory.PITCHING]: "投手",
};

async function getMvpRanking() {
  const latest = await prisma.playerValueRating.aggregate({ _max: { date: true } });
  if (!latest._max.date) return null;

  const rows = await prisma.playerValueRating.findMany({
    where: { date: latest._max.date },
    include: { team: true },
    orderBy: { rank: "asc" },
    take: 20,
  });
  return rows;
}

export default async function AnalysisPage() {
  const rows = await getMvpRanking();

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">独自指標</h1>
      <p className="text-sm mb-1" style={{ color: "var(--ink-secondary)" }}>
        <strong>LABバリュー</strong>
        は、1軍の打者・投手を「リーグ平均をどれだけ上回ったか」という同じ物差しで比較する当サイト独自の貢献度指数です。
      </p>
      <p className="text-xs mb-8" style={{ color: "var(--ink-muted)" }}>
        算出方法の詳細は
        <Link href="/about/methodology" className="mx-1 hover:underline" style={{ color: "var(--accent)" }}>
          算出方法について
        </Link>
        をご覧ください。打席数100・投球回30未満の選手は対象外です。
      </p>

      {!rows ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          データがありません。<code>npm run scrape</code> と <code>npm run mvp</code> を実行してください。
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>選手</Th>
              <Th>区分</Th>
              <Th align="right">成績</Th>
              <Th align="right">LABバリュー</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.playerId} className="hover:bg-black/[0.03]">
                <Td>
                  <span className="text-xs mr-1.5" style={{ color: "var(--ink-muted)" }}>
                    {r.rank}
                  </span>
                  {r.playerName}
                  <Link
                    href={`/teams/${r.team.slug}`}
                    className="text-xs ml-1 hover:underline"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    ({r.team.name})
                  </Link>
                </Td>
                <Td muted>{CATEGORY_LABEL[r.category]}</Td>
                <Td align="right" muted>
                  {r.category === ProspectCategory.BATTING
                    ? `OPS ${r.rawStat.toFixed(3)}`
                    : `防御率 ${r.rawStat.toFixed(2)}`}
                </Td>
                <Td align="right">
                  <span className="font-semibold">{r.value.toFixed(2)}</span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </main>
  );
}
