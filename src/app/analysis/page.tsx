import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProspectCategory, Level } from "@prisma/client";
import { Table, Th, Td } from "@/components/Table";
import { latestPerPlayer } from "@/lib/latestPerPlayer";
import { calcFipConstant, calcFip, calcWoba } from "@/lib/sabermetrics";

const QUALIFYING_PA_PER_GAME = 3.1;
const QUALIFYING_IP_PER_GAME = 1;

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

// FIP(投手)・wOBA(打者)は公開されている一般的な線形加重係数を使った簡易試算（src/lib/sabermetrics.ts参照）
async function getSabermetricsLeaders() {
  const standingsLatest = await prisma.standingsSnapshot.aggregate({ _max: { date: true } });
  if (!standingsLatest._max.date) return null;

  const standings = await prisma.standingsSnapshot.findMany({ where: { date: standingsLatest._max.date } });
  const teamGames = new Map(standings.map((s) => [s.teamId, s.wins + s.losses + s.draws]));

  const season = new Date().getFullYear();
  const [battingRows, pitchingRows] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { level: Level.ICHIGUN, season }, include: { team: true } }),
    prisma.playerPitchingStat.findMany({ where: { level: Level.ICHIGUN, season }, include: { team: true } }),
  ]);

  const qualifiedBatters = latestPerPlayer(battingRows).filter(
    (b) => b.plateAppearances >= (teamGames.get(b.teamId) ?? 0) * QUALIFYING_PA_PER_GAME,
  );
  const qualifiedPitchers = latestPerPlayer(pitchingRows).filter(
    (p) => p.inningsPitched >= (teamGames.get(p.teamId) ?? 0) * QUALIFYING_IP_PER_GAME,
  );

  const fipConstant = calcFipConstant(qualifiedPitchers);

  const wobaLeaders = qualifiedBatters
    .map((b) => ({ ...b, woba: calcWoba(b) }))
    .sort((a, b) => b.woba - a.woba)
    .slice(0, 5);

  const fipLeaders = qualifiedPitchers
    .map((p) => ({ ...p, fip: calcFip(p, fipConstant) }))
    .sort((a, b) => a.fip - b.fip)
    .slice(0, 5);

  return { wobaLeaders, fipLeaders };
}

export default async function AnalysisPage() {
  const rows = await getMvpRanking();
  const sabermetrics = await getSabermetricsLeaders();

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

      {sabermetrics && (
        <div className="mt-12">
          <h2 className="font-semibold mb-1">FIP・wOBA（セイバーメトリクス指標）</h2>
          <p className="text-xs mb-4" style={{ color: "var(--ink-muted)" }}>
            公開されている一般的な線形加重係数を使った、当サイト独自の簡易試算です。NPBの得点環境に厳密に
            較正した値ではありません。規定打席・規定投球回に到達した選手が対象です。
          </p>
          <div className="grid gap-8 sm:grid-cols-2 min-w-0">
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-secondary)" }}>
                wOBA（打者）
              </h3>
              <Table>
                <thead>
                  <tr>
                    <Th>選手</Th>
                    <Th align="right">wOBA</Th>
                  </tr>
                </thead>
                <tbody>
                  {sabermetrics.wobaLeaders.map((b, i) => (
                    <tr key={b.playerId} className="hover:bg-black/[0.03]">
                      <Td>
                        <span className="text-xs mr-1.5" style={{ color: "var(--ink-muted)" }}>
                          {i + 1}
                        </span>
                        {b.playerName}
                        <Link
                          href={`/teams/${b.team.slug}`}
                          className="text-xs ml-1 hover:underline"
                          style={{ color: "var(--ink-secondary)" }}
                        >
                          ({b.team.name})
                        </Link>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold text-base">{b.woba.toFixed(3)}</span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-secondary)" }}>
                FIP（投手）
              </h3>
              <Table>
                <thead>
                  <tr>
                    <Th>選手</Th>
                    <Th align="right">FIP</Th>
                  </tr>
                </thead>
                <tbody>
                  {sabermetrics.fipLeaders.map((p, i) => (
                    <tr key={p.playerId} className="hover:bg-black/[0.03]">
                      <Td>
                        <span className="text-xs mr-1.5" style={{ color: "var(--ink-muted)" }}>
                          {i + 1}
                        </span>
                        {p.playerName}
                        <Link
                          href={`/teams/${p.team.slug}`}
                          className="text-xs ml-1 hover:underline"
                          style={{ color: "var(--ink-secondary)" }}
                        >
                          ({p.team.name})
                        </Link>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold text-base">{p.fip.toFixed(2)}</span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
