"use client";

import { useEffect, useRef, useState } from "react";

interface SearchResult {
  playerId: string;
  playerName: string;
  teamName: string;
  type: "batting" | "pitching";
}

// 選手比較ページの選手検索UI。入力ごとに/api/players/searchへデバウンス付きで
// 問い合わせ、候補から選ぶとonSelectでplayerIdを渡す(URL遷移は呼び出し側に任せる)
export function PlayerPicker({
  label,
  placeholder = "選手名で検索",
  onSelect,
}: {
  label: string;
  placeholder?: string;
  onSelect: (result: SearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) return;
      const data = (await res.json()) as { results: SearchResult[] };
      setResults(data.results);
      setOpen(true);
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  return (
    <div className="relative">
      <label className="block text-xs mb-1.5" style={{ color: "var(--ink-muted)" }}>
        {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2.5 text-sm"
        style={{ border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--ink)" }}
      />
      {open && results.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg"
          style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-md)" }}
        >
          {results.map((r) => (
            <button
              key={`${r.playerId}-${r.type}`}
              type="button"
              onClick={() => {
                onSelect(r);
                setQuery(r.playerName);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--page)]"
            >
              <span>{r.playerName}</span>
              <span className="text-xs whitespace-nowrap" style={{ color: "var(--ink-muted)" }}>
                {r.teamName} ・ {r.type === "batting" ? "打者" : "投手"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
