import Link from "next/link";
import { teamAbbr } from "@/lib/teamAbbr";
import { TEAM_THEME } from "@/lib/teamTheme";

interface TeamRef {
  slug: string;
  name?: string;
}

interface GameScoreProps {
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  homeScore: number | null;
  awayScore: number | null;
  winningPitcher?: string | null;
  losingPitcher?: string | null;
  savePitcher?: string | null;
  homeInnings?: number[];
  awayInnings?: number[];
  homeHits?: number | null;
  homeErrors?: number | null;
  awayHits?: number | null;
  awayErrors?: number | null;
  // "compact"は一覧の小さいカード(TOPページ等)向け、"scoreboard"は/gamesの1試合1行の
  // 球場スコアボード風表示向け。データ構造は同じで見せ方だけ変える
  variant?: "compact" | "scoreboard";
}

// 完封・サヨナラは既存のスコア・回別データから機械的に判定できるため、
// (選手個人の識別を伴わず誤りのリスクが低いため)自動でバッジ表示する
function detectBadges({
  homeScore,
  awayScore,
  homeInnings,
  awayInnings,
}: Pick<GameScoreProps, "homeScore" | "awayScore" | "homeInnings" | "awayInnings">): string[] {
  const badges: string[] = [];
  if (homeScore === null || awayScore === null) return badges;

  const homeWin = homeScore > awayScore;
  const awayWin = awayScore > homeScore;

  if ((homeWin && awayScore === 0) || (awayWin && homeScore === 0)) {
    badges.push("完封");
  }
  // ホームチームは、表の攻撃終了時点で既にリードしていれば裏の攻撃を行わずに試合が終わる
  // (だからhomeInningsの方が1回少なくなるのが「普通の」ホーム勝利)。
  // 逆に言うと、最終回の裏を実際に戦った(=表の回数と同じ)上でホームが勝った試合は、
  // その裏の攻撃で同点or逆転が決まった=サヨナラ勝ちだと判定できる
  if (homeWin && homeInnings && awayInnings && homeInnings.length > 0 && homeInnings.length === awayInnings.length) {
    badges.push("サヨナラ");
  }
  return badges;
}

export function GameScore(props: GameScoreProps) {
  const { variant = "compact" } = props;
  return variant === "scoreboard" ? <ScoreboardGameScore {...props} /> : <CompactGameScore {...props} />;
}

function CompactGameScore({
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
}: GameScoreProps) {
  const homeWin = (homeScore ?? 0) > (awayScore ?? 0);
  const awayWin = (awayScore ?? 0) > (homeScore ?? 0);
  const badges = detectBadges({ homeScore, awayScore, homeInnings, awayInnings });

  // 点差の強弱を視覚化する: 僅差(1点差)はアクセントカラー寄りのボーダーで目立たせる
  const margin = homeScore !== null && awayScore !== null ? Math.abs(homeScore - awayScore) : null;
  const isClose = margin !== null && margin <= 1;

  return (
    <div
      className="hover-lift rounded-2xl p-4"
      style={{
        background: "var(--surface)",
        border: isClose ? "1.5px solid color-mix(in srgb, var(--accent) 45%, var(--border))" : "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {badges.length > 0 && (
        <div className="flex gap-1.5 mb-2">
          {badges.map((b) => (
            <span
              key={b}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--accent-track)", color: "var(--accent)" }}
            >
              {b}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-1">
        <Link
          href={`/teams/${awayTeam.slug}`}
          className="hover:underline inline-flex items-center gap-1.5 min-w-0 flex-1"
          style={{ color: awayWin ? "var(--ink)" : "var(--ink-muted)", fontWeight: awayWin ? 700 : 400 }}
        >
          <span
            aria-hidden
            className="rounded-full flex-none"
            style={{ width: 7, height: 7, background: TEAM_THEME[awayTeam.slug]?.accent ?? "var(--ink-muted)" }}
          />
          <span className="text-sm truncate">{teamAbbr(awayTeam.slug)}</span>
        </Link>
        <span
          className="tabular-nums whitespace-nowrap px-2"
          style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.375rem", color: "var(--ink)" }}
        >
          {awayScore}-{homeScore}
        </span>
        <Link
          href={`/teams/${homeTeam.slug}`}
          className="hover:underline inline-flex items-center justify-end gap-1.5 min-w-0 flex-1"
          style={{ color: homeWin ? "var(--ink)" : "var(--ink-muted)", fontWeight: homeWin ? 700 : 400 }}
        >
          <span className="text-sm truncate">{teamAbbr(homeTeam.slug)}</span>
          <span
            aria-hidden
            className="rounded-full flex-none"
            style={{ width: 7, height: 7, background: TEAM_THEME[homeTeam.slug]?.accent ?? "var(--ink-muted)" }}
          />
        </Link>
      </div>
      {winningPitcher && (
        <div className="text-[11px] text-center mt-1.5" style={{ color: "var(--ink-muted)" }}>
          (勝){winningPitcher}
          {savePitcher && <>　(Ｓ){savePitcher}</>}
        </div>
      )}
      {homeInnings && homeInnings.length > 0 && awayInnings && awayInnings.length > 0 && (
        <details className="group mt-2 pt-2 w-full" style={{ borderTop: "1px dashed var(--border)" }}>
          <summary
            className="flex items-center justify-between text-[11px] font-medium cursor-pointer select-none list-none"
            style={{ color: "var(--ink-muted)" }}
          >
            <span>回ごとのスコア</span>
            <span className="transition-transform group-open:rotate-180" aria-hidden>
              ▼
            </span>
          </summary>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-[10px] tabular-nums" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--page)" }}>
                  <th className="rounded-l" />
                  {Array.from({ length: Math.max(homeInnings.length, awayInnings.length) }).map((_, i) => (
                    <th key={i} className="px-1 py-1 font-normal" style={{ color: "var(--ink-muted)" }}>
                      {i + 1}
                    </th>
                  ))}
                  <th className="px-1 py-1 font-semibold">計</th>
                  <th className="px-1 py-1 font-normal rounded-r" style={{ color: "var(--ink-muted)" }}>
                    H
                  </th>
                  <th className="px-1 py-1 font-normal" style={{ color: "var(--ink-muted)" }}>
                    E
                  </th>
                </tr>
              </thead>
              <tbody style={{ borderTop: "1px solid var(--border)" }}>
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
                <tr style={{ borderTop: "1px solid var(--border)" }}>
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
          </div>
        </details>
      )}
    </div>
  );
}

function ScoreboardRow({
  team,
  score,
  hits,
  errors,
  innings,
  inningCount,
  isWinner,
}: {
  team: TeamRef;
  score: number | null;
  hits?: number | null;
  errors?: number | null;
  innings?: number[];
  inningCount: number;
  isWinner: boolean;
}) {
  return (
    <tr>
      <th
        className="sticky left-0 py-1 pr-3 text-left text-xs font-normal whitespace-nowrap"
        style={{
          background: "inherit",
          color: isWinner ? "var(--ink)" : "var(--ink-muted)",
          fontWeight: isWinner ? 700 : 400,
        }}
      >
        {teamAbbr(team.slug)}
      </th>
      {Array.from({ length: inningCount }).map((_, i) => (
        <td key={i} className="px-1.5 py-1 text-center" style={{ color: "var(--ink-secondary)" }}>
          {innings?.[i] ?? (innings ? "x" : "-")}
        </td>
      ))}
      <td
        className="px-2 py-1 text-center font-bold border-l"
        style={{ borderColor: "var(--border)", color: isWinner ? "var(--accent)" : "var(--ink-secondary)" }}
      >
        {score}
      </td>
      <td className="px-1.5 py-1 text-center" style={{ color: "var(--ink-muted)" }}>
        {hits ?? "-"}
      </td>
      <td className="px-1.5 py-1 text-center" style={{ color: "var(--ink-muted)" }}>
        {errors ?? "-"}
      </td>
    </tr>
  );
}

function ScoreboardGameScore({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  winningPitcher,
  losingPitcher,
  savePitcher,
  homeInnings,
  awayInnings,
  homeHits,
  homeErrors,
  awayHits,
  awayErrors,
}: GameScoreProps) {
  const homeWin = (homeScore ?? 0) > (awayScore ?? 0);
  const margin = homeScore !== null && awayScore !== null ? Math.abs(homeScore - awayScore) : null;
  const isClose = margin !== null && margin <= 1;
  const badges = detectBadges({ homeScore, awayScore, homeInnings, awayInnings });
  const inningCount = Math.max(homeInnings?.length ?? 0, awayInnings?.length ?? 0, 9);
  const homeAccent = TEAM_THEME[homeTeam.slug]?.accent ?? "var(--accent)";
  const awayAccent = TEAM_THEME[awayTeam.slug]?.accent ?? "var(--accent)";

  return (
    <div
      className="hover-lift relative rounded-none py-3 pl-5 pr-4 tabular-nums overflow-hidden"
      style={{
        border: isClose ? "1.5px solid color-mix(in srgb, var(--accent) 55%, var(--border-strong))" : "1px solid var(--border-strong)",
        background: "var(--surface)",
      }}
    >
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0"
        style={{ width: 4, background: `linear-gradient(to bottom, ${awayAccent} 50%, ${homeAccent} 50%)` }}
      />
      {badges.length > 0 && (
        <div className="flex gap-1.5 mb-2">
          {badges.map((b) => (
            <span
              key={b}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--accent-track)", color: "var(--accent)" }}
            >
              {b}
            </span>
          ))}
        </div>
      )}
      {/* 最終スコア: イニング表が横スクロールで見切れても、最終結果だけは必ず見える位置に出す */}
      <div className="flex flex-col gap-1 mb-3">
        <FinalScoreRow team={awayTeam} score={awayScore} accent={awayAccent} isWinner={!homeWin} />
        <FinalScoreRow team={homeTeam} score={homeScore} accent={homeAccent} isWinner={homeWin} />
      </div>
      <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th />
              {Array.from({ length: inningCount }).map((_, i) => (
                <th key={i} className="px-1.5 font-normal text-xs" style={{ color: "var(--ink-muted)" }}>
                  {i + 1}
                </th>
              ))}
              <th className="px-2 font-semibold text-xs border-l" style={{ borderColor: "var(--border)", color: "var(--ink-muted)" }}>
                R
              </th>
              <th className="px-1.5 font-normal text-xs" style={{ color: "var(--ink-muted)" }}>
                H
              </th>
              <th className="px-1.5 font-normal text-xs" style={{ color: "var(--ink-muted)" }}>
                E
              </th>
            </tr>
          </thead>
          <tbody>
            <ScoreboardRow
              team={awayTeam}
              score={awayScore}
              hits={awayHits}
              errors={awayErrors}
              innings={awayInnings}
              inningCount={inningCount}
              isWinner={!homeWin}
            />
            <ScoreboardRow
              team={homeTeam}
              score={homeScore}
              hits={homeHits}
              errors={homeErrors}
              innings={homeInnings}
              inningCount={inningCount}
              isWinner={homeWin}
            />
          </tbody>
        </table>
      </div>
        {/* イニング表が横に見切れているのに気づけない問題への対処(モバイルのみ) */}
        <div
          aria-hidden
          className="sm:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-6"
          style={{ background: "linear-gradient(to right, transparent, var(--surface))" }}
        />
      </div>
      {(winningPitcher || savePitcher) && (
        <div className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
          {winningPitcher && <>(勝){winningPitcher} </>}
          {losingPitcher && <>(敗){losingPitcher} </>}
          {savePitcher && <>(Ｓ){savePitcher}</>}
        </div>
      )}
    </div>
  );
}

function FinalScoreRow({
  team,
  score,
  accent,
  isWinner,
}: {
  team: TeamRef;
  score: number | null;
  accent: string;
  isWinner: boolean;
}) {
  return (
    <Link href={`/teams/${team.slug}`} className="flex items-center justify-between gap-3 hover:underline">
      <span
        className="inline-flex items-center gap-2 text-[15px]"
        style={{ color: isWinner ? "var(--ink)" : "var(--ink-muted)", fontWeight: isWinner ? 700 : 400 }}
      >
        <span aria-hidden className="rounded-full" style={{ width: 8, height: 8, flex: "none", background: accent }} />
        {team.name ?? teamAbbr(team.slug)}
      </span>
      <span className="text-xl font-black" style={{ color: isWinner ? "var(--accent)" : "var(--ink-secondary)" }}>
        {score ?? "-"}
      </span>
    </Link>
  );
}
