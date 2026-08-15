"use client";

import { useEffect, useState } from "react";
import { getFavoriteTeam, setFavoriteTeam } from "@/lib/favoriteTeam";

export function FavoriteTeamPicker({ teams }: { teams: { slug: string; name: string }[] }) {
  const [selected, setSelected] = useState("");

  useEffect(() => {
    setSelected(getFavoriteTeam() ?? "");
  }, []);

  return (
    <div className="relative inline-block">
      <select
        value={selected}
        onChange={(e) => {
          const value = e.target.value;
          setSelected(value);
          setFavoriteTeam(value || null);
        }}
        className="appearance-none cursor-pointer truncate max-w-[92px] sm:max-w-none text-xs rounded-none pl-2 pr-6 py-1 bg-transparent border-[1px] border-solid border-[color:var(--border-strong)] hover:border-[color:var(--accent)] focus:border-[color:var(--accent)] transition-colors"
        style={{ color: "var(--ink-secondary)" }}
        aria-label="お気に入り球団"
      >
        <option value="">お気に入り球団</option>
        {teams.map((t) => (
          <option key={t.slug} value={t.slug}>
            {t.name}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2"
        width="9"
        height="9"
        viewBox="0 0 10 10"
      >
        <path
          d="M1 3 L5 7 L9 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--ink-secondary)" }}
        />
      </svg>
    </div>
  );
}
