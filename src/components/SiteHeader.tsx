import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FavoriteTeamPicker } from "@/components/FavoriteTeamPicker";

const NAV = [
  { href: "/games", label: "試合結果" },
  { href: "/teams", label: "球団" },
  { href: "/titles", label: "タイトルレース" },
  { href: "/prospects", label: "2軍注目選手" },
  { href: "/analysis", label: "独自指標" },
  { href: "/columns", label: "コラム" },
];

export async function SiteHeader() {
  const teams = await prisma.team.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } });

  return (
    <header style={{ borderTop: "4px solid var(--ink)", borderBottom: "2px solid var(--ink)" }}>
      <div className="mx-auto max-w-4xl px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="whitespace-nowrap"
            style={{ fontFamily: "var(--font-shippori-mincho)", fontWeight: 700, fontSize: "1.35rem", letterSpacing: "0.01em" }}
          >
            プロ野球LAB
          </Link>
          <FavoriteTeamPicker teams={teams} />
        </div>
        <div className="relative mt-2">
          <nav
            className="flex gap-3 text-xs overflow-x-auto sm:gap-5 sm:text-sm"
            style={{ color: "var(--ink-secondary)" }}
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap hover:opacity-70 transition-opacity pb-0.5"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {/* ナビがスクロール可能なことを示すフェード（右端が見切れて隠れているのに気づけない問題への対処） */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-8"
            style={{ background: "linear-gradient(to right, transparent, var(--page))" }}
          />
        </div>
      </div>
    </header>
  );
}
