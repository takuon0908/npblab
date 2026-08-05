import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProspectCategory, Level } from "@prisma/client";
import { Table, Th, Td } from "@/components/Table";
import { RankBar } from "@/components/RankBar";
import { latestPerPlayer } from "@/lib/latestPerPlayer";
import { calcFipConstant, calcFip, calcWoba, calcWhip, calcKPercent, calcBBPercent } from "@/lib/sabermetrics";
import { teamAbbr } from "@/lib/teamAbbr";
import { siteUrl } from "@/lib/siteUrl";

const QUALIFYING_PA_PER_GAME = 3.1;
const QUALIFYING_IP_PER_GAME = 1;

// データは1日1回(日次パイプライン)しか更新されないため6時間に緩めている(Supabase egress対策)
export const revalidate = 21600;

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

  const whipLeaders = qualifiedPitchers
    .map((p) => ({ ...p, whip: calcWhip(p) }))
    .sort((a, b) => a.whip - b.whip)
    .slice(0, 5);

  // K%は高いほど三振が多く、BB%は高いほど四球が多い（＝選球眼が良い）ことを示す
  const kPercentLeaders = qualifiedBatters
    .map((b) => ({ ...b, kPercent: calcKPercent(b) }))
    .sort((a, b) => a.kPercent - b.kPercent)
    .slice(0, 5);

  const bbPercentLeaders = qualifiedBatters
    .map((b) => ({ ...b, bbPercent: calcBBPercent(b) }))
    .sort((a, b) => b.bbPercent - a.bbPercent)
    .slice(0, 5);

  return { wobaLeaders, fipLeaders, whipLeaders, kPercentLeaders, bbPercentLeaders };
}

function itemListJsonLd(name: string, items: { playerId: string; playerName: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.playerName,
      url: `${siteUrl}/players/${item.playerId}`,
    })),
  };
}

export default async function AnalysisPage() {
  const rows = await getMvpRanking();
  const sabermetrics = await getSabermetricsLeaders();

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-black mb-2">独自指標</h1>
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
      <p className="text-sm mb-10">
        <Link href="/analysis/innings" className="hover:underline" style={{ color: "var(--accent)" }}>
          イニング別 得点・失点傾向を見る →
        </Link>
      </p>

      {!rows ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          データがありません。<code>npm run scrape</code> と <code>npm run mvp</code> を実行してください。
        </p>
      ) : (
        <>
          {/* eslint-disable-next-line react/no-danger */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd("LABバリューMVPランキング", rows)) }}
          />
          <Table>
          <thead>
            <tr>
              <Th>選手</Th>
              <Th align="right">成績</Th>
              <Th align="right">LABバリュー</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.playerId} className="hover:bg-white/[0.05]">
                <Td>
                  <span className="text-xs mr-1.5" style={{ color: "var(--ink-muted)" }}>
                    {r.rank}
                  </span>
                  <Link href={`/players/${r.playerId}`} className="hover:underline">
                    {r.playerName}
                  </Link>
                  <span
                    className="text-[10px] ml-1.5 px-1 py-0.5 rounded"
                    style={{
                      color: r.category === ProspectCategory.BATTING ? "var(--good)" : "var(--accent)",
                      background: r.category === ProspectCategory.BATTING ? "var(--good-soft)" : "var(--accent-track)",
                    }}
                  >
                    {CATEGORY_LABEL[r.category]}
                  </span>
                  <Link
                    href={`/teams/${r.team.slug}`}
                    className="text-xs ml-1 hover:underline"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    ({teamAbbr(r.team.slug)})
                  </Link>
                </Td>
                <Td align="right" muted>
                  {r.category === ProspectCategory.BATTING ? r.rawStat.toFixed(3) : r.rawStat.toFixed(2)}
                </Td>
                <Td align="right">
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-semibold">{r.value.toFixed(2)}</span>
                    <RankBar ratio={rows[0].value > 0 ? r.value / rows[0].value : 0} />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
          </Table>
        </>
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
              {/* eslint-disable-next-line react/no-danger */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd("wOBAランキング", sabermetrics.wobaLeaders)) }}
              />
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
                    <tr key={b.playerId} className="hover:bg-white/[0.05]">
                      <Td>
                        <span className="text-xs mr-1.5" style={{ color: "var(--ink-muted)" }}>
                          {i + 1}
                        </span>
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
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="font-semibold text-base">{b.woba.toFixed(3)}</span>
                          <RankBar ratio={b.woba / sabermetrics.wobaLeaders[0].woba} />
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd("FIPランキング", sabermetrics.fipLeaders)) }}
              />
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
                    <tr key={p.playerId} className="hover:bg-white/[0.05]">
                      <Td>
                        <span className="text-xs mr-1.5" style={{ color: "var(--ink-muted)" }}>
                          {i + 1}
                        </span>
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
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="font-semibold text-base">{p.fip.toFixed(2)}</span>
                          <RankBar ratio={sabermetrics.fipLeaders[0].fip / p.fip} />
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {sabermetrics && (
        <div className="mt-12">
          <h2 className="font-semibold mb-1">WHIP・K%・BB%</h2>
          <p className="text-xs mb-4" style={{ color: "var(--ink-muted)" }}>
            WHIPは投手が1イニングあたりに出した走者数（低いほど良い）。K%・BB%は打者の全打席に占める三振・四球の割合で、
            選球眼やアプローチの傾向を示します。規定打席・規定投球回に到達した選手が対象です。
          </p>
          <div className="grid gap-8 sm:grid-cols-3 min-w-0">
            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd("WHIPランキング", sabermetrics.whipLeaders)) }}
              />
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-secondary)" }}>
                WHIP（投手）
              </h3>
              <Table>
                <thead>
                  <tr>
                    <Th>選手</Th>
                    <Th align="right">WHIP</Th>
                  </tr>
                </thead>
                <tbody>
                  {sabermetrics.whipLeaders.map((p, i) => (
                    <tr key={p.playerId} className="hover:bg-white/[0.05]">
                      <Td>
                        <span className="text-xs mr-1.5" style={{ color: "var(--ink-muted)" }}>
                          {i + 1}
                        </span>
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
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="font-semibold text-base">{p.whip.toFixed(2)}</span>
                          <RankBar ratio={sabermetrics.whipLeaders[0].whip / p.whip} />
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd("低K%ランキング", sabermetrics.kPercentLeaders)) }}
              />
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-secondary)" }}>
                低K%（打者、三振が少ない順）
              </h3>
              <Table>
                <thead>
                  <tr>
                    <Th>選手</Th>
                    <Th align="right">K%</Th>
                  </tr>
                </thead>
                <tbody>
                  {sabermetrics.kPercentLeaders.map((b, i) => (
                    <tr key={b.playerId} className="hover:bg-white/[0.05]">
                      <Td>
                        <span className="text-xs mr-1.5" style={{ color: "var(--ink-muted)" }}>
                          {i + 1}
                        </span>
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
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="font-semibold text-base">{(b.kPercent * 100).toFixed(1)}%</span>
                          <RankBar ratio={sabermetrics.kPercentLeaders[0].kPercent / b.kPercent} />
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd("高BB%ランキング", sabermetrics.bbPercentLeaders)) }}
              />
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-secondary)" }}>
                高BB%（打者、四球が多い順）
              </h3>
              <Table>
                <thead>
                  <tr>
                    <Th>選手</Th>
                    <Th align="right">BB%</Th>
                  </tr>
                </thead>
                <tbody>
                  {sabermetrics.bbPercentLeaders.map((b, i) => (
                    <tr key={b.playerId} className="hover:bg-white/[0.05]">
                      <Td>
                        <span className="text-xs mr-1.5" style={{ color: "var(--ink-muted)" }}>
                          {i + 1}
                        </span>
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
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="font-semibold text-base">{(b.bbPercent * 100).toFixed(1)}%</span>
                          <RankBar ratio={b.bbPercent / sabermetrics.bbPercentLeaders[0].bbPercent} />
                        </div>
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
