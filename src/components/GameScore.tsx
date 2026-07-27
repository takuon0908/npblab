import Link from "next/link";
import { teamAbbr } from "@/lib/teamAbbr";
import { TEAM_THEME } from "@/lib/teamTheme";

interface TeamRef {
  slug: string;
}

export function GameScore({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  winningPitcher,
  savePitcher,
  homeInnings,
  awayInnings,
  homeHits,
  homeErrors,
  awayHits,
  awayErrors,
}: {
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  homeScore: number | null;
  awayScore: number | null;
  winningPitcher?: string | null;
  savePitcher?: string | null;
  homeInnings?: number[];
  awayInnings?: number[];
  homeHits?: number | null;
  homeErrors?: number | null;
  awayHits?: number | null;
  awayErrors?: number | null;
}) {
  const homeWin = (homeScore ?? 0) > (awayScore ?? 0);
  const awayWin = (awayScore ?? 0) > (homeScore ?? 0);

  return (
    <div
      className="flex flex-col items-center justify-center gap-0.5 rounded-none px-2 py-1.5 text-sm tabular-nums"
      style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
    >
      <div className="flex items-center gap-1.5">
        <Link
          href={`/teams/${awayTeam.slug}`}
          className="hover:underline inline-flex items-center gap-1"
          style={{ color: awayWin ? "var(--ink)" : "var(--ink-muted)", fontWeight: awayWin ? 700 : 400 }}
        >
          <span
            aria-hidden
            className="rounded-full"
            style={{ width: 6, height: 6, flex: "none", background: TEAM_THEME[awayTeam.slug]?.accent ?? "var(--ink-muted)" }}
          />
          {teamAbbr(awayTeam.slug)}
        </Link>
        <span className="font-bold whitespace-nowrap" style={{ color: "var(--accent)" }}>
          {awayScore}-{homeScore}
        </span>
        <Link
          href={`/teams/${homeTeam.slug}`}
          className="hover:underline inline-flex items-center gap-1"
          style={{ color: homeWin ? "var(--ink)" : "var(--ink-muted)", fontWeight: homeWin ? 700 : 400 }}
        >
          {teamAbbr(homeTeam.slug)}
          <span
            aria-hidden
            className="rounded-full"
            style={{ width: 6, height: 6, flex: "none", background: TEAM_THEME[homeTeam.slug]?.accent ?? "var(--ink-muted)" }}
          />
        </Link>
      </div>
      {winningPitcher && (
        <div className="text-[11px] leading-none whitespace-nowrap" style={{ color: "var(--ink-muted)" }}>
          (勝){winningPitcher}
          {savePitcher && <>　(Ｓ){savePitcher}</>}
        </div>
      )}
      {homeInnings && homeInnings.length > 0 && awayInnings && awayInnings.length > 0 && (
        <details className="mt-1 w-full">
          <summary
            className="text-[11px] text-center cursor-pointer select-none"
            style={{ color: "var(--accent)" }}
          >
            回ごとのスコア
          </summary>
          <table className="mt-1 w-full text-[10px] tabular-nums" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th />
                {Array.from({ length: Math.max(homeInnings.length, awayInnings.length) }).map((_, i) => (
                  <th key={i} className="px-1 font-normal" style={{ color: "var(--ink-muted)" }}>
                    {i + 1}
                  </th>
                ))}
                <th className="px-1 font-semibold">計</th>
                <th className="px-1 font-normal" style={{ color: "var(--ink-muted)" }}>
                  H
                </th>
                <th className="px-1 font-normal" style={{ color: "var(--ink-muted)" }}>
                  E
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th className="text-left pr-1 font-normal">{teamAbbr(awayTeam.slug)}</th>
                {Array.from({ length: Math.max(homeInnings.length, awayInnings.length) }).map((_, i) => (
                  <td key={i} className="px-1 text-center">
                    {awayInnings[i] ?? "x"}
                  </td>
                ))}
                <td className="px-1 text-center font-semibold">{awayScore}</td>
                <td className="px-1 text-center" style={{ color: "var(--ink-muted)" }}>
                  {awayHits ?? "-"}
                </td>
                <td className="px-1 text-center" style={{ color: "var(--ink-muted)" }}>
                  {awayErrors ?? "-"}
                </td>
              </tr>
              <tr>
                <th className="text-left pr-1 font-normal">{teamAbbr(homeTeam.slug)}</th>
                {Array.from({ length: Math.max(homeInnings.length, awayInnings.length) }).map((_, i) => (
                  <td key={i} className="px-1 text-center">
                    {homeInnings[i] ?? "x"}
                  </td>
                ))}
                <td className="px-1 text-center font-semibold">{homeScore}</td>
                <td className="px-1 text-center" style={{ color: "var(--ink-muted)" }}>
                  {homeHits ?? "-"}
                </td>
                <td className="px-1 text-center" style={{ color: "var(--ink-muted)" }}>
                  {homeErrors ?? "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
