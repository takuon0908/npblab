"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FAVORITE_TEAM_EVENT, getFavoriteTeam } from "@/lib/favoriteTeam";
import { TEAM_THEME } from "@/lib/teamTheme";
import { RankBar } from "@/components/RankBar";
import type { TeamHighlight } from "@/app/page";

// お気に入り球団を選んでいるのに何も変わらないと機能の意味が薄いため、選択直後から
// ホームの一番目立つ位置にその球団の優勝確率・タイトル候補をパーソナライズ表示する
export function FavoriteTeamHighlight({ teams }: { teams: TeamHighlight[] }) {
  const [favoriteSlug, setFavoriteSlug] = useState<string | null>(null);

  useEffect(() => {
    setFavoriteSlug(getFavoriteTeam());
    const onChange = (e: Event) => setFavoriteSlug((e as CustomEvent<string | null>).detail);
    window.addEventListener(FAVORITE_TEAM_EVENT, onChange);
    return () => window.removeEventListener(FAVORITE_TEAM_EVENT, onChange);
  }, []);

  if (!favoriteSlug) return null;
  const team = teams.find((t) => t.slug === favoriteSlug);
  if (!team) return null;

  const accent = TEAM_THEME[team.slug]?.accent ?? "var(--accent)";

  return (
    <Link
      href={`/teams/${team.slug}`}
      className="hover-lift group block p-4 mb-8"
      style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderLeft: `4px solid ${accent}` }}
    >
      <p className="text-xs font-semibold mb-1.5" style={{ color: accent }}>
        あなたの球団
      </p>
      <p className="text-base font-bold group-hover:underline" style={{ fontFamily: "var(--font-heading)" }}>
        {team.name}　優勝確率{" "}
        <span className="tabular-nums">{(team.probability * 100).toFixed(1)}%</span>
        {team.probabilityDelta !== null && Math.abs(team.probabilityDelta) >= 0.001 && (
          <span
            className="text-xs font-semibold tabular-nums ml-1.5"
            style={{ color: team.probabilityDelta > 0 ? "var(--good)" : "var(--critical)" }}
          >
            {team.probabilityDelta > 0 ? "▲" : "▼"}
            {Math.abs(team.probabilityDelta * 100).toFixed(1)}pt
          </span>
        )}
        <span className="text-xs font-normal ml-2" style={{ color: "var(--ink-muted)" }}>
          {team.rank}位 / {team.wins}勝{team.losses}敗（{team.gamesBehind.toFixed(1)}差）
        </span>
      </p>
      <div className="mt-2 mb-1 max-w-[240px]">
        <RankBar ratio={team.probability} widthClassName="w-full" />
      </div>
      {team.topTitleCandidate && (
        <p className="text-xs mt-1.5" style={{ color: "var(--ink-muted)" }}>
          タイトル候補: {team.topTitleCandidate.playerName}（{team.topTitleCandidate.label}{" "}
          獲得確率{(team.topTitleCandidate.probability * 100).toFixed(0)}%）
        </p>
      )}
    </Link>
  );
}
