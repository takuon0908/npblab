import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Level } from "@prisma/client";
import { StatTile } from "@/components/StatTile";
import { Meter } from "@/components/Meter";
import { GamesAboveBelow500 } from "@/components/GamesAboveBelow500";
import { Table, Th, Td } from "@/components/Table";
import { computeWhatIf } from "@/lib/whatif";
import { calcMagicNumber } from "@/lib/baseball";
import { latestPerPlayer } from "@/lib/latestPerPlayer";

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

// 年ごとに最新のスナップショット（完結済みシーズンはseason-end代表日、当年は最新日）を1件ずつ拾う
function summarizeByYear<T extends { date: Date }>(rows: T[]): T[] {
  const byYear = new Map<number, T>();
  for (const row of rows) {
    const year = row.date.getFullYear();
    if (!byYear.has(year)) byYear.set(year, row);
  }
  return [...byYear.values()].sort((a, b) => b.date.getFullYear() - a.date.getFullYear());
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}): Promise<Metadata> {
  const { teamSlug } = await params;
  const team = await prisma.team.findUnique({ where: { slug: teamSlug } });
  if (!team) return {};

  return {
    title: `${team.name} 優勝確率・戦力分析`,
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

  const [standing, championshipHistory, remainingGames, insight, leagueInsights, allStandings] = await Promise.all([
    prisma.standingsSnapshot.findFirst({ where: { teamId: team.id }, orderBy: { date: "desc" } }),
    prisma.championshipProbability.findMany({
      where: { teamId: team.id },
      orderBy: { date: "desc" },
      take: 2,
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
  ]);

  const yearlyStandings = summarizeByYear(allStandings);

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

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">{team.name}</h1>

      {!standing ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          データがありません。<code>npm run scrape</code> と <code>npm run simulate</code> を実行してください。
        </p>
      ) : (
        <>
          {insight && (
            <div
              className="rounded-lg p-5 mb-8"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="text-sm mb-2" style={{ color: "var(--ink-muted)" }}>
                スカウティングレポート
              </div>
              <p className="leading-relaxed">{insight.summary}</p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            <StatTile
              label="成績"
              value={
                <>
                  {standing.wins}勝{standing.losses}敗{standing.draws}分 (
                  <GamesAboveBelow500 wins={standing.wins} losses={standing.losses} />)
                </>
              }
            />
            <StatTile label="勝率" value={standing.winPct.toFixed(3)} />
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
                <StatTile label="ピタゴラス勝率" value={insight.pythagoreanWinPct.toFixed(3)} />
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
                    <tr className="hover:bg-black/[0.03]">
                      <Td muted>打率</Td>
                      <Td>
                        <Link href={`/players/${teamLeaders.avg.playerId}`} className="hover:underline">
                          {teamLeaders.avg.playerName}
                        </Link>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{teamLeaders.avg.avg.toFixed(3)}</span>
                      </Td>
                    </tr>
                  )}
                  {teamLeaders.homeRuns && (
                    <tr className="hover:bg-black/[0.03]">
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
                    <tr className="hover:bg-black/[0.03]">
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
                    <tr className="hover:bg-black/[0.03]">
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
                    <tr className="hover:bg-black/[0.03]">
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
                    <tr className="hover:bg-black/[0.03]">
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
                    <tr className="hover:bg-black/[0.03]">
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
                    <tr className="hover:bg-black/[0.03]">
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

          {championship && (
            <div
              className="rounded-lg p-5 mb-8"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="text-sm mb-2" style={{ color: "var(--ink-muted)" }}>
                優勝確率
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Meter value={championship.probability} />
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
              className="rounded-lg p-5"
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
                    <tr key={s.date.getFullYear()} className="hover:bg-black/[0.03]">
                      <Td>{s.date.getFullYear()}年</Td>
                      <Td align="right" muted>
                        {s.wins}勝{s.losses}敗{s.draws}分
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{s.winPct.toFixed(3)}</span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
