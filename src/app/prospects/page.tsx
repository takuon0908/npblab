import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProspectCategory } from "@prisma/client";
import { Table, Th, Td } from "@/components/Table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "2軍注目選手ランキング・1軍昇格候補",
  description:
    "NPB2軍(ファーム)の打撃・投手成績を1軍換算した独自ランキング。1軍と2軍のリーグ平均差から算出し、今1軍で通用しそうな昇格候補選手が分かります。",
  alternates: { canonical: "/prospects" },
};

async function getProspects() {
  const latest = await prisma.prospectRating.aggregate({ _max: { date: true } });
  if (!latest._max.date) return null;

  const rows = await prisma.prospectRating.findMany({
    where: { date: latest._max.date },
    include: { team: true },
    orderBy: { rank: "asc" },
  });

  return {
    batters: rows.filter((r) => r.category === ProspectCategory.BATTING).slice(0, 15),
    pitchers: rows.filter((r) => r.category === ProspectCategory.PITCHING).slice(0, 15),
  };
}

export default async function ProspectsPage() {
  const data = await getProspects();

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">2軍注目選手</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-secondary)" }}>
        2軍成績を、同シーズンの1軍・2軍のリーグ平均差から算出した係数で「1軍換算」した参考値です。
        球場補正や対戦相手の強さは考慮していない粗い推計であり、特定選手の昇格後の成績を保証するものではありません。
      </p>

      {!data ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          データがありません。<code>npm run scrape</code> と <code>npm run prospects</code> を実行してください。
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 min-w-0">
          <div>
            <h2 className="font-semibold mb-1">打者（OPS換算）</h2>
            <p className="text-xs mb-3" style={{ color: "var(--ink-muted)" }}>
              打数30以上が対象。OPS = 出塁率 + 長打率
            </p>
            <Table>
              <thead>
                <tr>
                  <Th>選手</Th>
                  <Th align="right">2軍</Th>
                  <Th align="right">換算</Th>
                </tr>
              </thead>
              <tbody>
                {data.batters.map((p) => (
                  <tr key={p.playerId} className="hover:bg-black/[0.03]">
                    <Td>
                      <span className="text-xs mr-1.5" style={{ color: "var(--ink-muted)" }}>
                        {p.rank}
                      </span>
                      {p.playerName}
                      <span className="text-xs ml-1" style={{ color: "var(--ink-secondary)" }}>
                        ({p.team.name})
                      </span>
                    </Td>
                    <Td align="right" muted>
                      {p.nigunValue.toFixed(3)}
                    </Td>
                    <Td align="right">
                      <span className="font-semibold">{p.translatedValue.toFixed(3)}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div>
            <h2 className="font-semibold mb-1">投手（防御率換算）</h2>
            <p className="text-xs mb-3" style={{ color: "var(--ink-muted)" }}>
              投球回10以上が対象
            </p>
            <Table>
              <thead>
                <tr>
                  <Th>選手</Th>
                  <Th align="right">2軍</Th>
                  <Th align="right">換算</Th>
                </tr>
              </thead>
              <tbody>
                {data.pitchers.map((p) => (
                  <tr key={p.playerId} className="hover:bg-black/[0.03]">
                    <Td>
                      <span className="text-xs mr-1.5" style={{ color: "var(--ink-muted)" }}>
                        {p.rank}
                      </span>
                      {p.playerName}
                      <span className="text-xs ml-1" style={{ color: "var(--ink-secondary)" }}>
                        ({p.team.name})
                      </span>
                    </Td>
                    <Td align="right" muted>
                      {p.nigunValue.toFixed(2)}
                    </Td>
                    <Td align="right">
                      <span className="font-semibold">{p.translatedValue.toFixed(2)}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}
    </main>
  );
}
