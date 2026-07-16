import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateJa } from "@/lib/date";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "試合結果",
  description: "NPB(プロ野球)の直近の試合結果を日別に一覧表示します。",
  alternates: { canonical: "/games" },
};

const DAYS_TO_SHOW = 10;

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

export default async function GamesPage() {
  const gamesByDate = await getRecentGames();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">試合結果</h1>
      <p className="text-sm mb-10" style={{ color: "var(--ink-secondary)" }}>
        直近{DAYS_TO_SHOW}試合日分の結果です。
      </p>

      {gamesByDate.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          データがありません。<code>npm run scrape</code> を実行してください。
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {gamesByDate.map(([dateKey, games]) => (
            <section key={dateKey}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-muted)" }}>
                {formatDateJa(new Date(dateKey))}
              </h2>
              <div className="flex flex-col" style={{ border: "1px solid var(--border)", borderRadius: 8 }}>
                {games.map((g, i) => {
                  const homeWin = (g.homeScore ?? 0) > (g.awayScore ?? 0);
                  const awayWin = (g.awayScore ?? 0) > (g.homeScore ?? 0);
                  return (
                    <div
                      key={g.id}
                      className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 text-sm"
                      style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
                    >
                      <Link
                        href={`/teams/${g.awayTeam.slug}`}
                        className="text-right hover:underline"
                        style={{
                          color: awayWin ? "var(--ink)" : "var(--ink-secondary)",
                          fontWeight: awayWin ? 600 : 400,
                        }}
                      >
                        {g.awayTeam.name}
                      </Link>
                      <span className="tabular-nums font-semibold whitespace-nowrap px-2">
                        {g.awayScore} - {g.homeScore}
                      </span>
                      <Link
                        href={`/teams/${g.homeTeam.slug}`}
                        className="hover:underline"
                        style={{
                          color: homeWin ? "var(--ink)" : "var(--ink-secondary)",
                          fontWeight: homeWin ? 600 : 400,
                        }}
                      >
                        {g.homeTeam.name}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
