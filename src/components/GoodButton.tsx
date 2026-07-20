"use client";

import { useState } from "react";
import { hasLiked, toggleLiked } from "@/lib/likedColumns";

export function GoodButton({ slug, initialCount }: { slug: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  const isLiked = liked ?? (typeof window !== "undefined" ? hasLiked(slug) : false);

  async function handleClick() {
    if (pending) return;
    setPending(true);

    const next = toggleLiked(slug);
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));

    try {
      await fetch("/api/columns/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: next ? "like" : "unlike" }),
      });
    } catch {
      // ネットワークエラー時はローカルの見た目だけ反映し、次回アクセス時にサーバー値で上書きされる
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isLiked}
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
      style={{
        border: `1px solid ${isLiked ? "var(--good)" : "var(--border)"}`,
        background: isLiked ? "var(--good-soft)" : "var(--surface)",
        color: isLiked ? "var(--good)" : "var(--ink-secondary)",
      }}
    >
      <span aria-hidden="true">👍</span>
      <span>Good</span>
      <span className="tabular-nums" style={{ color: isLiked ? "var(--good)" : "var(--ink-muted)" }}>
        {count}
      </span>
    </button>
  );
}
