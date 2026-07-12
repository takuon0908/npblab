import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { League } from "@prisma/client";
import { Meter } from "@/components/Meter";
import { GamesAboveBelow500 } from "@/components/GamesAboveBelow500";
import { Table, Th, Td } from "@/components/Table";
import { calcMagicNumber } from "@/lib/baseball";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "セ・パ12球団 優勝確率一覧",
  description:
    "セントラル・リーグ、パシフィック・リーグ12球団の最新順位・貯金借金・マジックナンバーと、残り試合シミュレーションによる優勝確率を毎日更新。",
  alternates: { canonical: "/teams" },
};

async function getTeamsWithLatestData() {
  const teams = await prisma.team.findMany();

  const [standingsDates, probDates] = await Promise.all([
    prisma.standingsSnapshot.findMany({
      distinct: ["date"],
      select: { date: true },
      orderBy: { date: "desc" },
      take: 2,
    }),
    prisma.championshipProbability.findMany({
      distinct: ["date"],
      select: { date: true },
      orderBy: { date: "desc" },
      take: 2,
    }),
  ]);
  const latestStandingsDate = standingsDates[0]?.date;
  const [latestProbDate, previousProbDate] = [probDates[0]?.date, probDates[1]?.date];

  const [standings, probabilities, previousProbabilities] = await Promise.all([
    latestStandingsDate
      ? prisma.standingsSnapshot.findMany({ where: { date: latestStandingsDate } })
      : [],
    latestProbDate ? prisma.championshipProbability.findMany({ where: { date: latestProbDate } }) : [],
    previousProbDate
      ? prisma.championshipProbability.findMany({ where: { date: previousProbDate } })
      : [],
  ]);

  const standingsByTeam = new Map(standings.map((s) => [s.teamId, s]));
  const probByTeam = new Map(probabilities.map((p) => [p.teamId, p]));
  const previousProbByTeam = new Map(previousProbabilities.map((p) => [p.teamId, p]));

  return teams
    .map((team) => {
      const championship = probByTeam.get(team.id) ?? null;
      const previous = previousProbByTeam.get(team.id) ?? null;
      return {
        team,
        standing: standingsByTeam.get(team.id) ?? null,
        championship,
        probabilityDelta: championship && previous ? championship.probability - previous.probability : null,
      };
    })
    .sort((a, b) => (b.standing?.winPct ?? 0) - (a.standing?.winPct ?? 0));
}

export default async function TeamsPage() {
  const rows = await getTeamsWithLatestData();
  const central = rows.filter((r) => r.team.league === League.CENTRAL);
  const pacific = rows.filter((r) => r.team.league === League.PACIFIC);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">球団別 優勝確率</h1>

      {rows.every((r) => !r.standing) ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          データがありません。<code>npm run scrape</code> と <code>npm run simulate</code> を実行してください。
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 min-w-0">
          <LeagueTable title="セ・リーグ" rows={central} />
          <LeagueTable title="パ・リーグ" rows={pacific} />
        </div>
      )}
    </main>
  );
}

function LeagueTable({
  title,
  rows,
}: {
  title: string;
  rows: Awaited<ReturnType<typeof getTeamsWithLatestData>>;
}) {
  const leader = rows[0]?.standing;
  const second = rows[1]?.standing;
  const magicNumber = leader && second ? calcMagicNumber(leader.wins, second.losses) : null;

  return (
    <div>
      <h2 className="font-semibold mb-3">
        {title}
        {magicNumber !== null && (
          <span className="ml-2 text-sm font-normal" style={{ color: "var(--ink-secondary)" }}>
            {rows[0].team.name} マジック{magicNumber}
          </span>
        )}
      </h2>
      <Table>
        <thead>
          <tr>
            <Th>球団</Th>
            <Th align="right">成績</Th>
            <Th align="right">優勝確率</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ team, standing, championship, probabilityDelta }) => (
            <tr key={team.id} className="hover:bg-black/[0.03]">
              <Td>
                <Link href={`/teams/${team.slug}`} className="hover:underline">
                  {team.name}
                </Link>
              </Td>
              <Td align="right" muted>
                {standing ? (
                  <>
                    {standing.wins}勝{standing.losses}敗{standing.draws}分
                    <div className="text-xs">
                      <GamesAboveBelow500 wins={standing.wins} losses={standing.losses} />
                    </div>
                  </>
                ) : (
                  "-"
                )}
              </Td>
              <Td align="right">
                {championship ? (
                  <div className="flex items-center justify-end gap-2">
                    <ProbabilityDelta delta={probabilityDelta} />
                    <span className="font-semibold">{(championship.probability * 100).toFixed(1)}%</span>
                  </div>
                ) : (
                  "-"
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function ProbabilityDelta({ delta }: { delta: number | null }) {
  if (delta === null || Math.abs(delta) < 0.001) return null;
  const isUp = delta > 0;
  return (
    <span
      className="text-xs font-medium tabular-nums whitespace-nowrap"
      style={{ color: isUp ? "var(--good)" : "var(--critical)" }}
    >
      {isUp ? "▲" : "▼"}
      {Math.abs(delta * 100).toFixed(1)}pt
    </span>
  );
}
