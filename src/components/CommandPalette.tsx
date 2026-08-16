"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchResultItem } from "@/app/api/search/route";
import { trackSearchSelect } from "@/lib/trackEvent";

const TYPE_LABEL: Record<SearchResultItem["type"], string> = {
  player: "選手",
  team: "球団",
  column: "コラム",
};

// サイト全体を横断検索できるコマンドパレット。⌘K/Ctrl-Kで起動、またはヘッダーの
// 検索ボタンからも開ける。選手・球団・コラムをまたいで一発で目的地に飛べるようにする
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) return;
      const data = (await res.json()) as { results: SearchResultItem[] };
      setResults(data.results);
      setActiveIndex(0);
    }, 200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  function go(item: SearchResultItem) {
    trackSearchSelect(item.type, query.trim());
    setOpen(false);
    router.push(item.href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      go(results[activeIndex]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors hover:bg-[var(--page)]"
        style={{ border: "1px solid var(--border-strong)", color: "var(--ink-muted)" }}
        aria-label="サイト内検索を開く"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <span className="hidden md:inline">検索</span>
        <span className="hidden md:inline whitespace-nowrap" style={{ color: "var(--ink-muted)" }}>
          ⌘K
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center px-4 pt-20"
          style={{ background: "rgba(10,10,10,0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg overflow-hidden"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="選手・球団・コラムを検索"
              className="w-full px-4 py-3.5 text-base outline-none"
              style={{ background: "transparent", color: "var(--ink)", borderBottom: "1px solid var(--border)" }}
            />
            {results.length > 0 && (
              <div className="max-h-80 overflow-y-auto py-1.5">
                {results.map((r, i) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    type="button"
                    onClick={() => go(r)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm"
                    style={{ background: i === activeIndex ? "var(--page)" : "transparent" }}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="flex-none rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ background: "var(--accent-track)", color: "var(--accent)" }}
                      >
                        {TYPE_LABEL[r.type]}
                      </span>
                      <span className="truncate" style={{ color: "var(--ink)" }}>
                        {r.title}
                      </span>
                    </span>
                    {r.subtitle && (
                      <span className="flex-none text-xs whitespace-nowrap" style={{ color: "var(--ink-muted)" }}>
                        {r.subtitle}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {query.trim().length > 0 && results.length === 0 && (
              <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
                「{query}」に一致する結果がありません
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
