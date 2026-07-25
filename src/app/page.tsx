import type { Metadata } from "next";
import Link from "next/link";
import { formatDateJa } from "@/lib/date";
import { getLatestDayGames } from "@/lib/games";
import { FavoriteAwareGameGrid } from "@/components/FavoriteAwareGameGrid";
import { getColumns } from "@/lib/microcms";
import { ArticleCoverImage } from "@/components/ArticleCoverImage";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

export const revalidate = 300;

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

async function getLatestColumnsSafely() {
  try {
    const { contents } = await getColumns(4);
    return contents;
  } catch {
    // microCMS未設定のビルド環境でも失敗させない([slug]/page.tsxのgenerateStaticParamsと同じ考え方)
    return [];
  }
}

export default async function Home() {
  const [latestGames, latestColumns] = await Promise.all([getLatestDayGames(), getLatestColumnsSafely()]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1
        className="text-4xl mb-2"
        style={{ fontFamily: "var(--font-shippori-mincho)", fontWeight: 700, letterSpacing: "0.01em" }}
      >
        プロ野球LAB
      </h1>
      <p className="text-sm mb-10" style={{ color: "var(--ink-secondary)" }}>
        野球を科学する。NPBのデータを独自に分析し、優勝確率・タイトル獲得確率を毎日更新します。
      </p>

      {latestGames && latestGames.games.length > 0 && (
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="flex items-center gap-2 font-semibold text-sm" style={{ color: "var(--ink)" }}>
              <span aria-hidden style={{ width: 9, height: 9, background: "var(--accent)", flex: "none" }} />
              {formatDateJa(latestGames.date)}の試合結果
            </h2>
            <Link href="/games" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
              もっと見る →
            </Link>
          </div>
          <FavoriteAwareGameGrid games={latestGames.games} />
        </section>
      )}

      {latestColumns.length > 0 && (
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="flex items-center gap-2 font-semibold text-sm" style={{ color: "var(--ink)" }}>
              <span aria-hidden style={{ width: 9, height: 9, background: "var(--accent)", flex: "none" }} />
              最新コラム
            </h2>
            <Link href="/columns" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
              もっと見る →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {latestColumns.map((c) => (
              <Link
                key={c.id}
                href={`/columns/${c.slug}`}
                className="group flex gap-3 rounded-none overflow-hidden p-3"
                style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}
              >
                <div className="w-20 aspect-square flex-none">
                  <ArticleCoverImage slug={c.slug} text={`${c.title} ${stripHtml(c.body)}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs mb-1" style={{ color: "var(--ink-muted)" }}>
                    {formatDateJa(new Date(c.publishedAt))}
                    {c.category && c.category.length > 0 && ` ・ ${c.category[0]}`}
                  </p>
                  <p
                    className="text-sm leading-snug group-hover:underline"
                    style={{ fontWeight: 700, textWrap: "balance" }}
                  >
                    {c.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group block rounded-none p-5 transition-colors"
            style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}
          >
            <div className="flex items-center gap-2 font-semibold">
              <span aria-hidden style={{ width: 9, height: 9, background: "var(--accent)", flex: "none" }} />
              <span className="group-hover:underline">{s.label}</span>
            </div>
            <div className="text-sm mt-1.5" style={{ color: "var(--ink-secondary)" }}>
              {s.desc}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
