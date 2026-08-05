"use client";

import { useEffect, useState } from "react";
import { GameScore } from "@/components/GameScore";
import { FAVORITE_TEAM_EVENT, getFavoriteTeam } from "@/lib/favoriteTeam";

interface GameData {
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

export function FavoriteAwareGameGrid({
  games,
  className,
  variant,
}: {
  games: GameData[];
  className?: string;
  variant?: "compact" | "scoreboard";
}) {
  const [favoriteTeam, setFavoriteTeamState] = useState<string | null>(null);

  useEffect(() => {
    setFavoriteTeamState(getFavoriteTeam());
    const onChange = (e: Event) => setFavoriteTeamState((e as CustomEvent<string | null>).detail);
    window.addEventListener(FAVORITE_TEAM_EVENT, onChange);
    return () => window.removeEventListener(FAVORITE_TEAM_EVENT, onChange);
  }, []);

  const isFavorite = (g: GameData) => favoriteTeam !== null && (g.homeTeam.slug === favoriteTeam || g.awayTeam.slug === favoriteTeam);
  const sorted = favoriteTeam ? [...games].sort((a, b) => Number(isFavorite(b)) - Number(isFavorite(a))) : games;

  return (
    <div className={className ?? "grid grid-cols-2 sm:grid-cols-3 gap-1.5"}>
      {sorted.map((g) => (
        <div
          key={g.id}
          style={
            isFavorite(g)
              ? { borderRadius: 4, boxShadow: "0 0 0 1.5px var(--accent)" }
              : undefined
          }
        >
          <GameScore
            homeTeam={g.homeTeam}
            awayTeam={g.awayTeam}
            homeScore={g.homeScore}
            awayScore={g.awayScore}
            winningPitcher={g.winningPitcher}
            losingPitcher={g.losingPitcher}
            savePitcher={g.savePitcher}
            homeInnings={g.homeInnings}
            awayInnings={g.awayInnings}
            homeHits={g.homeHits}
            homeErrors={g.homeErrors}
            awayHits={g.awayHits}
            awayErrors={g.awayErrors}
            variant={variant}
          />
        </div>
      ))}
    </div>
  );
}
