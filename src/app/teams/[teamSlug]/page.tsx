import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatTile } from "@/components/StatTile";
import { Meter } from "@/components/Meter";
import { GamesAboveBelow500 } from "@/components/GamesAboveBelow500";
import { computeWhatIf } from "@/lib/whatif";
import { calcMagicNumber } from "@/lib/baseball";

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

  const [standing, championshipHistory, remainingGames, insight, leagueInsights] = await Promise.all([
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
  ]);

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
        </>
      )}
    </main>
  );
}
