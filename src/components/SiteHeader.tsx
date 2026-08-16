import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { FavoriteTeamPicker } from "@/components/FavoriteTeamPicker";
import { SiteNav } from "@/components/SiteNav";
import { CommandPalette } from "@/components/CommandPalette";

export async function SiteHeader() {
  const teams = await prisma.team.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } });

  return (
    <header style={{ borderTop: "4px solid var(--ink)", borderBottom: "2px solid var(--ink)" }}>
      <div className="mx-auto max-w-4xl px-4 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="whitespace-nowrap flex-none">
            <Image src="/logo.png" alt="プロ野球LAB" width={500} height={174} style={{ height: 36, width: "auto" }} priority />
          </Link>
          <div className="min-w-0 flex-1">
            <SiteNav />
          </div>
          <CommandPalette />
          <FavoriteTeamPicker teams={teams} />
        </div>
      </div>
    </header>
  );
}
