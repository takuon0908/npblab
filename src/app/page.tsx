import type { Metadata } from "next";
import Link from "next/link";
import { formatDateJa } from "@/lib/date";
import { getLatestDayGames } from "@/lib/games";
import { GameScore } from "@/components/GameScore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const sections = [
  { href: "/teams", label: "球団別 優勝確率", desc: "残り試合シミュレーションによる優勝確率の推移" },
  { href: "/titles", label: "タイトルレース", desc: "打者・投手タイトルの獲得確率を日次更新" },
  { href: "/prospects", label: "2軍注目選手", desc: "2軍成績を1軍換算した昇格候補ランキング" },
  { href: "/analysis", label: "独自指標", desc: "LABバリューMVPランキングなど" },
  { href: "/columns", label: "コラム", desc: "分析記事・考察" },
];

export default async function Home() {
  const latestGames = await getLatestDayGames();

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">プロ野球LAB</h1>
      <p className="text-sm mb-10" style={{ color: "var(--ink-secondary)" }}>
        野球を科学する。NPBのデータを独自に分析し、優勝確率・タイトル獲得確率を毎日更新します。
      </p>

      {latestGames && latestGames.games.length > 0 && (
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-semibold text-sm" style={{ color: "var(--ink-muted)" }}>
              {formatDateJa(latestGames.date)}の試合結果
            </h2>
            <Link href="/games" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
              もっと見る →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {latestGames.games.map((g) => (
              <GameScore
                key={g.id}
                homeTeam={g.homeTeam}
                awayTeam={g.awayTeam}
                homeScore={g.homeScore}
                awayScore={g.awayScore}
                winningPitcher={g.winningPitcher}
                savePitcher={g.savePitcher}
              />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block rounded-lg p-5 transition-colors hover:opacity-80"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="font-semibold">{s.label}</div>
            <div className="text-sm mt-1" style={{ color: "var(--ink-secondary)" }}>
              {s.desc}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
