"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/games", label: "試合結果" },
  { href: "/teams", label: "球団" },
  { href: "/titles", label: "タイトルレース" },
  { href: "/prospects", label: "2軍注目選手" },
  { href: "/analysis", label: "独自指標" },
  { href: "/columns", label: "コラム" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-3 text-xs overflow-x-auto sm:gap-5 sm:text-sm" style={{ color: "var(--ink-secondary)" }}>
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
  );
}
