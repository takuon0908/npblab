"use client";

import { useState } from "react";
import Link from "next/link";
import { FavoriteAwareGameGrid } from "@/components/FavoriteAwareGameGrid";
import { teamAbbr } from "@/lib/teamAbbr";

interface ResultGame {
  id: string;
  homeTeam: { slug: string; name?: string };
  awayTeam: { slug: string; name?: string };
  homeScore: number | null;
  awayScore: number | null;
  winningPitcher?: string | null;
  losingPitcher?: string | null;
  savePitcher?: string | null;
  homeInnings?: number[];
  awayInnings?: number[];
  homeHits?: number | null;
  homeErrors?: number | null;
  awayHits?: number | null;
  awayErrors?: number | null;
}

interface ScheduledGame {
  id: string;
  date: string;
  homeTeam: { slug: string; name: string };
  awayTeam: { slug: string; name: string };
  probableHomePitcher: string | null;
  probableAwayPitcher: string | null;
}

// 「昨日の結果」で唐突に始まるのではなく、「今日の予定」も切り替えて見せることで
// このサイトが日々更新され続けているスケジュール性を感じさせる
export function GamesTabSwitcher({
  resultsDateLabel,
  resultsGames,
  scheduleGames,
}: {
  resultsDateLabel: string;
  resultsGames: ResultGame[];
  scheduleGames: ScheduledGame[];
}) {
  const [tab, setTab] = useState<"results" | "schedule">("results");

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <button
          type="button"
          onClick={() => setTab("results")}
          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
          style={
            tab === "results"
              ? { background: "var(--accent-track)", color: "var(--accent)" }
              : { color: "var(--ink-muted)" }
          }
        >
          {resultsDateLabel}の結果
        </button>
        {scheduleGames.length > 0 && (
          <button
            type="button"
            onClick={() => setTab("schedule")}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            style={
              tab === "schedule"
                ? { background: "var(--accent-track)", color: "var(--accent)" }
                : { color: "var(--ink-muted)" }
            }
          >
            今日の予定
          </button>
        )}
      </div>

      {tab === "results" ? (
        <FavoriteAwareGameGrid games={resultsGames} />
      ) : (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {scheduleGames.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between gap-2 rounded px-3 py-2 text-sm"
              style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
            >
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
      )}
    </div>
  );
}
