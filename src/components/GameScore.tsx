import Link from "next/link";
import { teamAbbr } from "@/lib/teamAbbr";

interface TeamRef {
  slug: string;
}

export function GameScore({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
}: {
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  homeScore: number | null;
  awayScore: number | null;
}) {
  const homeWin = (homeScore ?? 0) > (awayScore ?? 0);
  const awayWin = (awayScore ?? 0) > (homeScore ?? 0);

  return (
    <div
      className="flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-sm tabular-nums"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <Link
        href={`/teams/${awayTeam.slug}`}
        className="hover:underline"
        style={{ color: awayWin ? "var(--ink)" : "var(--ink-muted)", fontWeight: awayWin ? 700 : 400 }}
      >
        {teamAbbr(awayTeam.slug)}
      </Link>
      <span className="font-semibold whitespace-nowrap">
        {awayScore}-{homeScore}
      </span>
      <Link
        href={`/teams/${homeTeam.slug}`}
        className="hover:underline"
        style={{ color: homeWin ? "var(--ink)" : "var(--ink-muted)", fontWeight: homeWin ? 700 : 400 }}
      >
        {teamAbbr(homeTeam.slug)}
      </Link>
    </div>
  );
}
