import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateJa } from "@/lib/date";
import { GameScore } from "@/components/GameScore";
import { teamAbbr } from "@/lib/teamAbbr";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "試合結果",
  description: "NPB(プロ野球)の直近の試合結果を日別に一覧表示します。",
  alternates: { canonical: "/games" },
};

const DAYS_TO_SHOW = 14;

async function getRecentGames() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const recentDates = await prisma.game.findMany({
    where: { date: { lte: today }, isFinished: true },
    distinct: ["date"],
    orderBy: { date: "desc" },
    take: DAYS_TO_SHOW,
    select: { date: true },
  });
  if (recentDates.length === 0) return [];

  const oldestDate = recentDates[recentDates.length - 1].date;
  const games = await prisma.game.findMany({
    where: { date: { gte: oldestDate, lte: today }, isFinished: true },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ date: "desc" }, { homeTeamId: "asc" }],
  });

  const byDate = new Map<string, typeof games>();
  for (const g of games) {
    const key = g.date.toISOString().slice(0, 10);
    const list = byDate.get(key) ?? [];
    list.push(g);
    byDate.set(key, list);
  }
  return [...byDate.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
}

async function getProbableStarters() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.game.findMany({
    where: { date: { gte: today }, isFinished: false, probableHomePitcher: { not: null } },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { date: "asc" },
  });
}

export default async function GamesPage() {
  const [gamesByDate, probableStarters] = await Promise.all([getRecentGames(), getProbableStarters()]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">試合結果</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-secondary)" }}>
        直近{DAYS_TO_SHOW}試合日分の結果です。
      </p>

      {probableStarters.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-muted)" }}>
            予告先発
          </h2>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {probableStarters.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-2 rounded px-3 py-2 text-sm"
                style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
              >
                <span style={{ color: "var(--ink-muted)" }} className="text-xs whitespace-nowrap">
                  {formatDateJa(g.date).replace(/^\d+年/, "")}
                </span>
                <Link href={`/teams/${g.awayTeam.slug}`} className="hover:underline whitespace-nowrap">
                  {teamAbbr(g.awayTeam.slug)} {g.probableAwayPitcher}
                </Link>
                <span style={{ color: "var(--ink-muted)" }}>vs</span>
                <Link href={`/teams/${g.homeTeam.slug}`} className="hover:underline whitespace-nowrap">
                  {teamAbbr(g.homeTeam.slug)} {g.probableHomePitcher}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {gamesByDate.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          データがありません。<code>npm run scrape</code> を実行してください。
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {gamesByDate.map(([dateKey, games]) => (
            <section key={dateKey} className="flex items-baseline gap-4">
              <h2
                className="text-xs whitespace-nowrap w-16 shrink-0 pt-2"
                style={{ color: "var(--ink-muted)" }}
              >
                {formatDateJa(new Date(dateKey)).replace(/^\d+年/, "")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 flex-1 min-w-0">
                {games.map((g) => (
                  <GameScore
                    key={g.id}
                    homeTeam={g.homeTeam}
                    awayTeam={g.awayTeam}
                    homeScore={g.homeScore}
                    awayScore={g.awayScore}
                    winningPitcher={g.winningPitcher}
                    savePitcher={g.savePitcher}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
