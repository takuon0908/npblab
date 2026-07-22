import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Level } from "@prisma/client";
import { Table, Th, Td } from "@/components/Table";
import { latestPerPlayer } from "@/lib/latestPerPlayer";

export const revalidate = 3600;

export async function generateStaticParams() {
  const teams = await prisma.team.findMany({ select: { slug: true } });
  return teams.map((team) => ({ teamSlug: team.slug }));
}

const LEVEL_LABEL: Record<Level, string> = {
  [Level.ICHIGUN]: "1軍",
  [Level.NIGUN]: "2軍",
};

async function getRoster(teamId: string) {
  const season = new Date().getFullYear();
  const [battingRows, pitchingRows] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { teamId, season } }),
    prisma.playerPitchingStat.findMany({ where: { teamId, season } }),
  ]);

  const batters = latestPerPlayer(battingRows).filter((b) => b.plateAppearances > 0);
  const pitchers = latestPerPlayer(pitchingRows).filter((p) => p.inningsPitched > 0 || p.appearances > 0);

  return {
    ichigunBatters: batters.filter((b) => b.level === Level.ICHIGUN).sort((a, b) => b.plateAppearances - a.plateAppearances),
    nigunBatters: batters.filter((b) => b.level === Level.NIGUN).sort((a, b) => b.plateAppearances - a.plateAppearances),
    ichigunPitchers: pitchers.filter((p) => p.level === Level.ICHIGUN).sort((a, b) => b.inningsPitched - a.inningsPitched),
    nigunPitchers: pitchers.filter((p) => p.level === Level.NIGUN).sort((a, b) => b.inningsPitched - a.inningsPitched),
  };
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
    title: `${team.name} 全選手成績`,
    description: `${team.name}の今シーズン1軍・2軍全選手の打撃・投手成績一覧。選手ごとの詳細ページへのリンク付き。`,
    alternates: { canonical: `/teams/${teamSlug}/roster` },
  };
}

function BattingTable({ rows, level }: { rows: Awaited<ReturnType<typeof getRoster>>["ichigunBatters"]; level: Level }) {
  if (rows.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-secondary)" }}>
        打者（{LEVEL_LABEL[level]}）
      </h3>
      <Table>
        <thead>
          <tr>
            <Th>選手</Th>
            <Th align="right">試合</Th>
            <Th align="right">打率</Th>
            <Th align="right">本塁打</Th>
            <Th align="right">打点</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.playerId} className="hover:bg-black/[0.03]">
              <Td>
                <Link href={`/players/${b.playerId}`} className="hover:underline">
                  {b.playerName}
                </Link>
              </Td>
              <Td align="right" muted>
                {b.games}
              </Td>
              <Td align="right">
                <span className="font-semibold">{b.avg.toFixed(3)}</span>
              </Td>
              <Td align="right" muted>
                {b.homeRuns}
              </Td>
              <Td align="right" muted>
                {b.rbi}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function PitchingTable({ rows, level }: { rows: Awaited<ReturnType<typeof getRoster>>["ichigunPitchers"]; level: Level }) {
  if (rows.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-secondary)" }}>
        投手（{LEVEL_LABEL[level]}）
      </h3>
      <Table>
        <thead>
          <tr>
            <Th>選手</Th>
            <Th align="right">登板</Th>
            <Th align="right">防御率</Th>
            <Th align="right">勝敗</Th>
            <Th align="right">奪三振</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.playerId} className="hover:bg-black/[0.03]">
              <Td>
                <Link href={`/players/${p.playerId}`} className="hover:underline">
                  {p.playerName}
                </Link>
              </Td>
              <Td align="right" muted>
                {p.appearances}
              </Td>
              <Td align="right">
                <span className="font-semibold">{p.era.toFixed(2)}</span>
              </Td>
              <Td align="right" muted>
                {p.wins}勝{p.losses}敗
              </Td>
              <Td align="right" muted>
                {p.strikeouts}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default async function TeamRosterPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const team = await prisma.team.findUnique({ where: { slug: teamSlug } });
  if (!team) notFound();

  const roster = await getRoster(team.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
        <Link href={`/teams/${team.slug}`} className="hover:underline" style={{ color: "var(--accent)" }}>
          {team.name}
        </Link>
      </p>
      <h1 className="text-2xl font-bold mb-2">{team.name} 全選手成績</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-secondary)" }}>
        今シーズン出場のあった全選手（1軍・2軍）の成績一覧です。選手名から個人ページに移動できます。
      </p>

      <div className="grid gap-x-8 sm:grid-cols-2 min-w-0">
        <div>
          <BattingTable rows={roster.ichigunBatters} level={Level.ICHIGUN} />
          <BattingTable rows={roster.nigunBatters} level={Level.NIGUN} />
        </div>
        <div>
          <PitchingTable rows={roster.ichigunPitchers} level={Level.ICHIGUN} />
          <PitchingTable rows={roster.nigunPitchers} level={Level.NIGUN} />
        </div>
      </div>
    </main>
  );
}
