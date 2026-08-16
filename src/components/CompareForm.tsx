"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlayerPicker } from "@/components/PlayerPicker";
import { trackCompareSubmit } from "@/lib/trackEvent";

interface Selected {
  playerId: string;
  playerName: string;
  type: "batting" | "pitching";
}

export function CompareForm({
  initialP1Name,
  initialP2Name,
}: {
  initialP1Name?: string;
  initialP2Name?: string;
}) {
  const router = useRouter();
  const [p1, setP1] = useState<Selected | null>(null);
  const [p2, setP2] = useState<Selected | null>(null);

  return (
    <div
      className="rounded-lg p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <PlayerPicker label="選手1" placeholder={initialP1Name ?? "選手名で検索"} onSelect={(r) => setP1(r)} />
        <PlayerPicker label="選手2" placeholder={initialP2Name ?? "選手名で検索"} onSelect={(r) => setP2(r)} />
      </div>
      <button
        type="button"
        disabled={!p1 || !p2}
        onClick={() => {
          if (!p1 || !p2) return;
          trackCompareSubmit(p1.type, p1.playerName, p2.playerName);
          router.push(`/compare?p1=${encodeURIComponent(p1.playerId)}&p2=${encodeURIComponent(p2.playerId)}`);
        }}
        className="mt-4 w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-40"
        style={{ background: "var(--accent)", color: "#ffffff" }}
      >
        比較する
      </button>
    </div>
  );
}
