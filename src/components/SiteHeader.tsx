import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FavoriteTeamPicker } from "@/components/FavoriteTeamPicker";
import { SiteNav } from "@/components/SiteNav";

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
          <SiteNav />
          {/* ナビがスクロール可能なことを示すフェード（右端が見切れて隠れているのに気づけない問題への対処） */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-12"
            style={{ background: "linear-gradient(to right, transparent, var(--page))" }}
          />
        </div>
      </div>
    </header>
  );
}
