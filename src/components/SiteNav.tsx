"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/games", label: "試合結果" },
  { href: "/teams", label: "球団" },
  { href: "/draft", label: "ドラフト" },
  { href: "/titles", label: "タイトルレース" },
  { href: "/prospects", label: "2軍注目選手" },
  { href: "/analysis", label: "LABバリュー" },
  { href: "/compare", label: "選手比較" },
  { href: "/columns", label: "コラム" },
];

const NAV_GROUPS = [
  {
    title: "成績",
    items: [
      { href: "/games", label: "試合結果" },
      { href: "/titles", label: "タイトルレース" },
      { href: "/analysis", label: "LABバリュー" },
    ],
  },
  {
    title: "球団・選手",
    items: [
      { href: "/teams", label: "球団一覧" },
      { href: "/draft", label: "ドラフト" },
      { href: "/prospects", label: "2軍注目選手" },
      { href: "/compare", label: "選手比較" },
    ],
  },
  {
    title: "読み物",
    items: [{ href: "/columns", label: "コラム" }],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [panelTop, setPanelTop] = useState(64);

  // ページ遷移したらメニューを自動で閉じる
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ヘッダーの実高さ(ロゴ/paddingの微調整で変わりうる)を開いた瞬間に測って
  // パネルの位置に反映する(マジックナンバーで固定すると崩れやすいため)
  useEffect(() => {
    if (!open) return;
    const header = document.querySelector("header");
    if (header) setPanelTop(header.getBoundingClientRect().bottom);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* デスクトップ: 横並びナビ */}
      <nav
        className="hidden sm:flex gap-5 text-sm overflow-x-auto"
        style={{ color: "var(--ink-secondary)" }}
      >
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap pb-0.5 transition-colors"
              style={
                active
                  ? { color: "var(--ink)", fontWeight: 700, borderBottom: "2px solid var(--accent)" }
                  : { borderBottom: "2px solid transparent" }
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* モバイル: ハンバーガーメニュー */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          className="flex items-center justify-center rounded"
          style={{ width: 36, height: 36, border: "1px solid var(--border-strong)" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            {open ? (
              <path d="M3 3 L15 15 M15 3 L3 15" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <>
                <path d="M2 4.5 H16" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M2 9 H16" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M2 13.5 H16" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>

        {open && (
          <div
            className="fixed inset-x-0 z-30 overflow-y-auto px-4 py-4"
            style={{
              top: panelTop,
              maxHeight: `calc(100vh - ${panelTop}px)`,
              background: "var(--page)",
              borderBottom: "2px solid var(--ink)",
            }}
          >
            <div className="mx-auto max-w-4xl flex flex-col gap-5">
              {NAV_GROUPS.map((group) => (
                <div key={group.title}>
                  <div
                    className="mb-2 text-xs font-semibold"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {group.title}
                  </div>
                  <div className="flex flex-col">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="py-2.5 text-base"
                          style={{
                            color: active ? "var(--ink)" : "var(--ink-secondary)",
                            fontWeight: active ? 700 : 400,
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
