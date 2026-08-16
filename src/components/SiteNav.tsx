"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    title: "コラム",
    items: [{ href: "/columns", label: "コラム" }],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupIsActive(pathname: string, items: { href: string }[]) {
  return items.some((item) => isActive(pathname, item.href));
}

export function SiteNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [panelTop, setPanelTop] = useState(64);
  const navRef = useRef<HTMLElement>(null);

  // ページ遷移したらメニューを自動で閉じる
  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  // デスクトップのドロップダウンは外側クリックで閉じる
  useEffect(() => {
    if (!openGroup) return;
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenGroup(null);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openGroup]);

  // ヘッダーの実高さ(ロゴ/paddingの微調整で変わりうる)を開いた瞬間に測って
  // モバイルメニューの位置に反映する(マジックナンバーで固定すると崩れやすいため)
  useEffect(() => {
    if (!mobileOpen) return;
    const header = document.querySelector("header");
    if (header) setPanelTop(header.getBoundingClientRect().bottom);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* デスクトップ: グループごとのドロップダウン(項目数が多く横並び1列だとウィンドウが
          狭い時に「コラム」まで画面外へ切れて見えなくなっていたため、3グループに集約した) */}
      <nav ref={navRef} className="hidden sm:flex gap-1 text-sm" style={{ color: "var(--ink-secondary)" }}>
        {NAV_GROUPS.map((group) => {
          const active = groupIsActive(pathname, group.items);
          if (group.items.length === 1) {
            const item = group.items[0];
            return (
              <Link
                key={group.title}
                href={item.href}
                className="whitespace-nowrap rounded px-3 py-1.5 transition-colors hover:bg-[var(--page)]"
                style={active ? { color: "var(--ink)", fontWeight: 700 } : undefined}
              >
                {item.label}
              </Link>
            );
          }
          const isOpen = openGroup === group.title;
          return (
            <div key={group.title} className="relative">
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : group.title)}
                aria-expanded={isOpen}
                className="flex items-center gap-1 whitespace-nowrap rounded px-3 py-1.5 transition-colors hover:bg-[var(--page)]"
                style={active ? { color: "var(--ink)", fontWeight: 700 } : undefined}
              >
                {group.title}
                <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden style={{ transform: isOpen ? "rotate(180deg)" : undefined }}>
                  <path d="M1 3 L5 7 L9 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isOpen && (
                <div
                  className="absolute left-0 top-full z-20 mt-1 min-w-[9rem] rounded-lg py-1"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-md)" }}
                >
                  {group.items.map((item) => {
                    const itemActive = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block whitespace-nowrap px-3 py-2 text-sm hover:bg-[var(--page)]"
                        style={{ color: itemActive ? "var(--accent)" : "var(--ink)", fontWeight: itemActive ? 700 : 400 }}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* モバイル: ハンバーガーメニュー */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "メニューを閉じる" : "メニューを開く"}
          className="flex items-center justify-center rounded"
          style={{ width: 36, height: 36, border: "1px solid var(--border-strong)" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            {mobileOpen ? (
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

        {mobileOpen && (
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
