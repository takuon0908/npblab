"use client";

import { useEffect, useState } from "react";
import { getFavoriteTeam, setFavoriteTeam } from "@/lib/favoriteTeam";

export function FavoriteTeamPicker({ teams }: { teams: { slug: string; name: string }[] }) {
  const [selected, setSelected] = useState("");

  useEffect(() => {
    setSelected(getFavoriteTeam() ?? "");
  }, []);

  return (
    <select
      value={selected}
      onChange={(e) => {
        const value = e.target.value;
        setSelected(value);
        setFavoriteTeam(value || null);
      }}
      className="text-xs rounded px-1.5 py-1 bg-transparent"
      style={{ border: "1px solid var(--border)", color: "var(--ink-secondary)" }}
      aria-label="お気に入り球団"
    >
      <option value="">お気に入り球団</option>
      {teams.map((t) => (
        <option key={t.slug} value={t.slug}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
