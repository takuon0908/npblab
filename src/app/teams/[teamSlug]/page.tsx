import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Level } from "@prisma/client";
import { StatTile } from "@/components/StatTile";
import { Meter } from "@/components/Meter";
import { CountUpNumber } from "@/components/CountUpNumber";
import { ChampionshipTrendChart } from "@/components/ChampionshipTrendChart";
import { GamesAboveBelow500 } from "@/components/GamesAboveBelow500";
import { Table, Th, Td } from "@/components/Table";
import { ArticleCoverImage } from "@/components/ArticleCoverImage";
import { computeWhatIf } from "@/lib/whatif";
import { calcMagicNumber } from "@/lib/baseball";
import { latestPerPlayer } from "@/lib/latestPerPlayer";
import { getAllColumns } from "@/lib/microcms";
import { formatDateJa } from "@/lib/date";
import { detectColumnTeamSlug, TEAM_THEME } from "@/lib/teamTheme";
import { siteUrl } from "@/lib/siteUrl";
import { getTeamSocialLinks } from "@/lib/teamSocialLinks";
import { TeamSocialLinksRow } from "@/components/TeamSocialLinks";
import { getTeamReporter } from "@/lib/teamReporters";
import { TeamReporterBadge } from "@/components/TeamReporterBadge";
import { A8Banner } from "@/components/A8Banner";
import { RakutenProductCard } from "@/components/RakutenProductCard";
import { getTeamGoods } from "@/lib/teamGoods";
import { formatAvg } from "@/lib/format";

const MIN_AT_BATS_FOR_AVG_LEADER = 10;
const MIN_INNINGS_FOR_ERA_LEADER = 10;

function topBy<T>(rows: T[], key: (row: T) => number, filter?: (row: T) => boolean) {
  const pool = filter ? rows.filter(filter) : rows;
  if (pool.length === 0) return null;
  return pool.reduce((best, row) => (key(row) > key(best) ? row : best));
}

function bottomBy<T>(rows: T[], key: (row: T) => number, filter?: (row: T) => boolean) {
  const pool = filter ? rows.filter(filter) : rows;
  if (pool.length === 0) return null;
  return pool.reduce((best, row) => (key(row) < key(best) ? row : best));
}

async function getTeamLeaders(teamId: string) {
  const season = new Date().getFullYear();
  const [battingRows, pitchingRows] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { teamId, level: Level.ICHIGUN, season } }),
    prisma.playerPitchingStat.findMany({ where: { teamId, level: Level.ICHIGUN, season } }),
  ]);

  const batters = latestPerPlayer(battingRows);
  const pitchers = latestPerPlayer(pitchingRows);

  return {
    avg: topBy(batters, (b) => b.avg, (b) => b.atBats >= MIN_AT_BATS_FOR_AVG_LEADER),
    homeRuns: topBy(batters, (b) => b.homeRuns),
    rbi: topBy(batters, (b) => b.rbi),
    stolenBases: topBy(batters, (b) => b.stolenBases),
    era: bottomBy(pitchers, (p) => p.era, (p) => p.inningsPitched >= MIN_INNINGS_FOR_ERA_LEADER),
    wins: topBy(pitchers, (p) => p.wins),
    strikeouts: topBy(pitchers, (p) => p.strikeouts),
    saves: topBy(pitchers, (p) => p.saves),
  };
}

// コラム記事のうち、この球団を扱っている(タイトル/本文から検出できる)ものを最新3件まで拾う。
// microCMS未設定のビルド環境でも失敗させない
async function getRelatedColumns(teamSlug: string) {
  try {
    const contents = await getAllColumns();
    return contents.filter((c) => detectColumnTeamSlug(c) === teamSlug).slice(0, 3);
  } catch {
    return [];
  }
}

// 年ごとに最新のスナップショット（完結済みシーズンはseason-end代表日、当年は最新日）を1件ずつ拾う
function summarizeByYear<T extends { date: Date }>(rows: T[]): T[] {
  const byYear = new Map<number, T>();
  for (const row of rows) {
    const year = row.date.getFullYear();
    if (!byYear.has(year)) byYear.set(year, row);
  }
  return [...byYear.values()].sort((a, b) => b.date.getFullYear() - a.date.getFullYear());
}

// データは1日1回(日次パイプライン)しか更新されないため24時間に緩めている(Supabase egress/Vercel ISR Writes対策)
export const revalidate = 86400;

export async function generateStaticParams() {
  const teams = await prisma.team.findMany({ select: { slug: true } });
  return teams.map((team) => ({ teamSlug: team.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}): Promise<Metadata> {
  const { teamSlug } = await params;
  const team = await prisma.team.findUnique({ where: { slug: teamSlug } });
  if (!team) return {};

  return {
    title: `${team.name} 順位・優勝確率・戦力分析`,
    description: `${team.name}の最新順位、貯金借金、優勝確率、パワーランキング、補強シミュレーションを毎日更新。データに基づく戦力分析でチームの現在地がわかります。`,
    alternates: { canonical: `/teams/${teamSlug}` },
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  const team = await prisma.team.findUnique({ where: { slug: teamSlug } });
  if (!team) notFound();

  const teamAccent = TEAM_THEME[team.slug]?.accent ?? "var(--accent)";

  const [standing, championshipHistory, championshipTrend, remainingGames, insight, leagueInsights, allStandings, relatedColumns] =
    await Promise.all([
      prisma.standingsSnapshot.findFirst({ where: { teamId: team.id }, orderBy: { date: "desc" } }),
      prisma.championshipProbability.findMany({
        where: { teamId: team.id },
        orderBy: { date: "desc" },
        take: 2,
      }),
      prisma.championshipProbability.findMany({
        where: { teamId: team.id },
        orderBy: { date: "asc" },
      }),
      prisma.game.count({
        where: {
          isFinished: false,
          date: { gte: new Date(new Date().toISOString().slice(0, 10)) },
          OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
        },
      }),
      prisma.teamInsight.findFirst({ where: { teamId: team.id }, orderBy: { date: "desc" } }),
      prisma.teamInsight.findMany({
        where: { team: { league: team.league } },
        orderBy: { date: "desc" },
        distinct: ["teamId"],
      }),
      prisma.standingsSnapshot.findMany({ where: { teamId: team.id }, orderBy: { date: "desc" } }),
      getRelatedColumns(team.slug),
    ]);

  // 「優勝確率」だけでなく「現在○位」という検索需要の大きいワードもページ内に
  // 明示するため、リーグ内の現在順位を算出する
  let leagueRank: { rank: number; total: number } | null = null;
  if (standing) {
    const latestDatePerTeam = await prisma.standingsSnapshot.findMany({
      where: { team: { league: team.league } },
      orderBy: { date: "desc" },
      distinct: ["teamId"],
    });
    const sorted = [...latestDatePerTeam].sort((a, b) => b.winPct - a.winPct);
    const rank = sorted.findIndex((s) => s.teamId === team.id) + 1;
    if (rank > 0) leagueRank = { rank, total: sorted.length };
  }

  const yearlyStandings = summarizeByYear(allStandings);
  const trendData = championshipTrend.map((c) => ({
    date: c.date.toISOString().slice(0, 10),
    probability: c.probability,
  }));

  const championship = championshipHistory[0] ?? null;
  const probabilityDelta =
    championshipHistory[0] && championshipHistory[1]
      ? championshipHistory[0].probability - championshipHistory[1].probability
      : null;

  const eloRank =
    insight && leagueInsights.length > 0
      ? [...leagueInsights].sort((a, b) => b.eloRating - a.eloRating).findIndex((i) => i.teamId === team.id) + 1
      : null;

  let magicNumber: number | null = null;
  if (standing) {
    const latestStandingsDate = await prisma.standingsSnapshot.aggregate({ _max: { date: true } });
    const leagueStandings = latestStandingsDate._max.date
      ? await prisma.standingsSnapshot.findMany({
          where: { date: latestStandingsDate._max.date, team: { league: team.league } },
          orderBy: { winPct: "desc" },
        })
      : [];
    const isLeader = leagueStandings[0]?.teamId === team.id;
    if (isLeader && leagueStandings[1]) {
      magicNumber = calcMagicNumber(standing.wins, leagueStandings[1].losses);
    }
  }

  const whatIf = championship ? await computeWhatIf(team.id, championship.probability) : null;
  const teamLeaders = await getTeamLeaders(team.id);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "プロ野球LAB", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "球団", item: `${siteUrl}/teams` },
      { "@type": "ListItem", position: 3, name: team.name },
    ],
  };

  const teamSocialLinks = getTeamSocialLinks(team.slug);
  const teamGoods = getTeamGoods(team.slug);
  const teamSameAs = [
    teamSocialLinks?.x?.url,
    teamSocialLinks?.instagram?.url,
    teamSocialLinks?.youtube?.url,
  ].filter((url): url is string => Boolean(url));

  const teamJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    url: `${siteUrl}/teams/${team.slug}`,
    sport: "Baseball",
    ...(teamSameAs.length > 0 ? { sameAs: teamSameAs } : {}),
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(teamJsonLd) }} />

      <nav className="mb-8 text-xs" style={{ color: "var(--ink-muted)" }} aria-label="パンくずリスト">
        <Link href="/" className="hover:underline">
          プロ野球LAB
        </Link>
        <span className="mx-1.5">›</span>
        <Link href="/teams" className="hover:underline">
          球団
        </Link>
      </nav>

      <div
        className="rounded-none p-5 mb-6"
        style={{
          background: `linear-gradient(120deg, color-mix(in srgb, ${teamAccent} 14%, var(--surface)) 0%, var(--surface) 75%)`,
          border: "1px solid var(--border)",
          borderLeft: `5px solid ${teamAccent}`,
        }}
      >
        <h1 className="text-2xl font-black">{team.name}</h1>
        <TeamSocialLinksRow links={getTeamSocialLinks(team.slug)} accentColor={teamAccent} />
        <TeamReporterBadge reporter={getTeamReporter(team.slug)} />
      </div>

      {trendData.length >= 2 && (
        <div
          className="rounded-none p-5 mb-8"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderLeft: `5px solid ${teamAccent}`,
          }}
        >
          <h2
            className="text-lg font-bold mb-4"
            style={{ fontFamily: "var(--font-heading)", color: "var(--ink)" }}
          >
            優勝確率の推移
          </h2>
          <ChampionshipTrendChart data={trendData} accentColor={teamAccent} />
        </div>
      )}

      {!standing ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          データがありません。<code>npm run scrape</code> と <code>npm run simulate</code> を実行してください。
        </p>
      ) : (
        <>
          {insight && (
            <div
              className="rounded-none p-5 mb-8"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="text-sm mb-2" style={{ color: "var(--ink-muted)" }}>
                スカウティングレポート
              </div>
              <p className="leading-relaxed">
                {insight.summary}
                {leagueRank && `${team.name}は現在、${team.league === "CENTRAL" ? "セ" : "パ"}・リーグ${leagueRank.rank}位につけている。`}
                {championship &&
                  `${team.name}の現在の優勝確率は当サイトの独自シミュレーションで${(championship.probability * 100).toFixed(1)}%と試算されている。`}
              </p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            {leagueRank && (
              <StatTile
                label={`${team.league === "CENTRAL" ? "セ" : "パ"}・リーグ順位`}
                value={`${leagueRank.rank}位`}
              />
            )}
            <StatTile
              label="成績"
              value={
                <>
                  {standing.wins}勝{standing.losses}敗{standing.draws}分 (
                  <GamesAboveBelow500 wins={standing.wins} losses={standing.losses} />)
                </>
              }
            />
            <StatTile label="勝率" value={formatAvg(standing.winPct)} />
            <StatTile label="差" value={standing.gamesBehind === 0 ? "--" : String(standing.gamesBehind)} />
            <StatTile label="残り試合" value={`${remainingGames}試合`} />
            {magicNumber !== null && <StatTile label="マジックナンバー" value={String(magicNumber)} />}
            {insight && (
              <>
                <StatTile
                  label="パワーランキング"
                  value={eloRank ? `リーグ${eloRank}位 (${insight.eloRating.toFixed(0)})` : insight.eloRating.toFixed(0)}
                />
                <StatTile
                  label="直近10試合"
                  value={`${insight.last10Wins}勝${insight.last10Losses}敗${insight.last10Draws}分`}
                />
                <StatTile label="ピタゴラス勝率" value={formatAvg(insight.pythagoreanWinPct)} />
              </>
            )}
          </dl>

          <div className="grid gap-6 sm:grid-cols-2 mb-8">
            <div>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-muted)" }}>
                チーム内成績トップ（打者）
              </h2>
              <Table>
                <tbody>
                  {teamLeaders.avg && (
                    <tr className="hover:bg-white/[0.05]">
                      <Td muted>打率</Td>
                      <Td>
                        <Link href={`/players/${teamLeaders.avg.playerId}`} className="hover:underline">
                          {teamLeaders.avg.playerName}
                        </Link>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{formatAvg(teamLeaders.avg.avg)}</span>
                      </Td>
                    </tr>
                  )}
                  {teamLeaders.homeRuns && (
                    <tr className="hover:bg-white/[0.05]">
                      <Td muted>本塁打</Td>
                      <Td>
                        <Link href={`/players/${teamLeaders.homeRuns.playerId}`} className="hover:underline">
                          {teamLeaders.homeRuns.playerName}
                        </Link>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{teamLeaders.homeRuns.homeRuns}本</span>
                      </Td>
                    </tr>
                  )}
                  {teamLeaders.rbi && (
                    <tr className="hover:bg-white/[0.05]">
                      <Td muted>打点</Td>
                      <Td>
                        <Link href={`/players/${teamLeaders.rbi.playerId}`} className="hover:underline">
                          {teamLeaders.rbi.playerName}
                        </Link>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{teamLeaders.rbi.rbi}打点</span>
                      </Td>
                    </tr>
                  )}
                  {teamLeaders.stolenBases && (
                    <tr className="hover:bg-white/[0.05]">
                      <Td muted>盗塁</Td>
                      <Td>
                        <Link href={`/players/${teamLeaders.stolenBases.playerId}`} className="hover:underline">
                          {teamLeaders.stolenBases.playerName}
                        </Link>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{teamLeaders.stolenBases.stolenBases}盗塁</span>
                      </Td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            <div>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-muted)" }}>
                チーム内成績トップ（投手）
              </h2>
              <Table>
                <tbody>
                  {teamLeaders.era && (
                    <tr className="hover:bg-white/[0.05]">
                      <Td muted>防御率</Td>
                      <Td>
                        <Link href={`/players/${teamLeaders.era.playerId}`} className="hover:underline">
                          {teamLeaders.era.playerName}
                        </Link>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{teamLeaders.era.era.toFixed(2)}</span>
                      </Td>
                    </tr>
                  )}
                  {teamLeaders.wins && (
                    <tr className="hover:bg-white/[0.05]">
                      <Td muted>勝利</Td>
                      <Td>
                        <Link href={`/players/${teamLeaders.wins.playerId}`} className="hover:underline">
                          {teamLeaders.wins.playerName}
                        </Link>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{teamLeaders.wins.wins}勝</span>
                      </Td>
                    </tr>
                  )}
                  {teamLeaders.strikeouts && (
                    <tr className="hover:bg-white/[0.05]">
                      <Td muted>奪三振</Td>
                      <Td>
                        <Link href={`/players/${teamLeaders.strikeouts.playerId}`} className="hover:underline">
                          {teamLeaders.strikeouts.playerName}
                        </Link>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{teamLeaders.strikeouts.strikeouts}奪三振</span>
                      </Td>
                    </tr>
                  )}
                  {teamLeaders.saves && (
                    <tr className="hover:bg-white/[0.05]">
                      <Td muted>セーブ</Td>
                      <Td>
                        <Link href={`/players/${teamLeaders.saves.playerId}`} className="hover:underline">
                          {teamLeaders.saves.playerName}
                        </Link>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{teamLeaders.saves.saves}セーブ</span>
                      </Td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>

          <p className="text-xs mb-8" style={{ color: "var(--ink-muted)" }}>
            <Link href={`/teams/${team.slug}/roster`} className="hover:underline" style={{ color: "var(--accent)" }}>
              全選手の成績を見る →
            </Link>
          </p>

          {championship && (
            <div
              className="rounded-none p-5 mb-8"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="text-sm mb-2" style={{ color: "var(--ink-muted)" }}>
                優勝確率
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Meter
                    value={championship.probability}
                    label={<CountUpNumber value={championship.probability * 100} decimals={1} suffix="%" />}
                  />
                </div>
                {probabilityDelta !== null && Math.abs(probabilityDelta) >= 0.001 && (
                  <span
                    className="text-xs font-medium tabular-nums whitespace-nowrap"
                    style={{ color: probabilityDelta > 0 ? "var(--good)" : "var(--critical)" }}
                  >
                    {probabilityDelta > 0 ? "▲" : "▼"}
                    {Math.abs(probabilityDelta * 100).toFixed(1)}pt
                  </span>
                )}
              </div>
              <div className="text-sm mt-3" style={{ color: "var(--ink-secondary)" }}>
                このペースが続いた場合の最終予測: {championship.projectedWins.toFixed(1)}勝
                {championship.projectedLosses.toFixed(1)}敗
              </div>
            </div>
          )}

          {whatIf && championship && (
            <div
              className="rounded-none p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="text-sm mb-1" style={{ color: "var(--ink-muted)" }}>
                補強シミュレーション（簡易試算）
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--ink-muted)" }}>
                得失点をもとにした試算です。特定の選手を想定したものではありません
              </p>

              <div className="mb-4">
                <div className="text-sm mb-1">打線が1試合あたり+0.5点強化されたら</div>
                <Meter value={whatIf.offenseUpProbability} />
                <div className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                  現在 {(championship.probability * 100).toFixed(1)}% →{" "}
                  {(whatIf.offenseUpProbability * 100).toFixed(1)}%
                </div>
              </div>

              <div>
                <div className="text-sm mb-1">失点を1試合あたり0.5点抑えられたら</div>
                <Meter value={whatIf.defenseUpProbability} />
                <div className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                  現在 {(championship.probability * 100).toFixed(1)}% →{" "}
                  {(whatIf.defenseUpProbability * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {yearlyStandings.length > 1 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-muted)" }}>
                歴代成績
              </h2>
              <Table>
                <thead>
                  <tr>
                    <Th>年度</Th>
                    <Th align="right">成績</Th>
                    <Th align="right">勝率</Th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyStandings.map((s) => (
                    <tr key={s.date.getFullYear()} className="hover:bg-white/[0.05]">
                      <Td>{s.date.getFullYear()}年</Td>
                      <Td align="right" muted>
                        {s.wins}勝{s.losses}敗{s.draws}分
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{formatAvg(s.winPct)}</span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </>
      )}

      {teamGoods && (
        <div className="mt-8 flex justify-center">
          <RakutenProductCard product={teamGoods} articleSlug={`team-${team.slug}`} />
        </div>
      )}

      <A8Banner />

      {relatedColumns.length > 0 && (
        <section className="mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: "var(--ink)" }}>
            <span
              aria-hidden
              style={{ width: 9, height: 9, background: TEAM_THEME[team.slug]?.accent ?? "var(--accent)", flex: "none", transform: "rotate(45deg)" }}
            />
            {team.name}に関連するコラム
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {relatedColumns.map((c) => (
              <Link
                key={c.id}
                href={`/columns/${c.slug}`}
                className="hover-lift group rounded-none overflow-hidden"
                style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
              >
                <div className="aspect-video">
                  <ArticleCoverImage slug={c.slug} text={`${c.title} ${c.body.replace(/<[^>]+>/g, "")}`} category={c.category} tags={c.tags} showCategoryBadge />
                </div>
                <div className="p-4">
                  <p className="text-xs mb-1.5" style={{ color: "var(--ink-muted)" }}>
                    {formatDateJa(new Date(c.publishedAt))}
                  </p>
                  <h3
                    className="mb-1 leading-snug group-hover:underline"
                    style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}
                  >
                    {c.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
