import type { Metadata } from "next";
import Link from "next/link";
import { getColumns, parseTags, CATEGORIES } from "@/lib/microcms";
import { formatDateJa } from "@/lib/date";
import { ArticleCoverImage } from "@/components/ArticleCoverImage";
import { getLikeCounts } from "@/lib/columnLikes";

// microCMSサービスが未作成の段階でもビルドを通すよう、ビルド時の静的生成を無効化
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "コラム",
  description: "NPBのデータ分析コラム。独自指標や優勝確率・タイトルレースの考察記事一覧。",
  alternates: { canonical: "/columns" },
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function excerpt(html: string, length = 88): string {
  const text = stripHtml(html);
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

export default async function ColumnsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>;
}) {
  const { category, tag } = await searchParams;
  const { contents } = await getColumns(20, category, tag);
  const [hero, ...rest] = contents;
  const likeCounts = await getLikeCounts(contents.map((c) => c.slug));

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--accent)" }}>
        Column
      </p>
      <h1
        className="text-2xl font-bold mb-3 sm:text-3xl"
        style={{ fontFamily: "var(--font-shippori-mincho)" }}
      >
        コラム
      </h1>
      <p className="text-sm mb-4" style={{ color: "var(--ink-secondary)" }}>
        優勝確率シミュレーションやタイトルレースの数字から、当サイトのライター陣が読み解く考察記事です。
      </p>
      <p className="text-sm mb-6">
        <Link href="/columns/ranking" className="hover:underline" style={{ color: "var(--accent)" }}>
          人気記事ランキングを見る →
        </Link>
      </p>

      <div className="flex flex-wrap gap-2 mb-10">
        <Link
          href="/columns"
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={
            !category
              ? { background: "var(--accent)", color: "#fff" }
              : { border: "1px solid var(--border)", color: "var(--ink-secondary)" }
          }
        >
          すべて
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/columns?category=${encodeURIComponent(c)}`}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={
              category === c
                ? { background: "var(--accent)", color: "#fff" }
                : { border: "1px solid var(--border)", color: "var(--ink-secondary)" }
            }
          >
            {c}
          </Link>
        ))}
      </div>

      {tag && (
        <p className="text-sm mb-8">
          タグ「#{tag}」で絞り込み中 ・{" "}
          <Link
            href={category ? `/columns?category=${encodeURIComponent(category)}` : "/columns"}
            className="hover:underline"
            style={{ color: "var(--accent)" }}
          >
            解除する
          </Link>
        </p>
      )}

      {contents.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          まだ記事がありません。
        </p>
      ) : (
        <>
          <Link
            href={`/columns/${hero.slug}`}
            className="group grid gap-0 sm:grid-cols-2 mb-12 rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
          >
            <div className="aspect-video sm:aspect-auto sm:h-full">
              <ArticleCoverImage slug={hero.slug} text={`${hero.title} ${stripHtml(hero.body)}`} />
            </div>
            <div className="p-6 flex flex-col justify-center">
              <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
                {formatDateJa(new Date(hero.publishedAt))} ・ 新着
                {likeCounts[hero.slug] > 0 && ` ・ 👍 ${likeCounts[hero.slug]}`}
              </p>
              <h2
                className="text-xl font-bold mb-2 leading-snug group-hover:underline sm:text-2xl"
                style={{ fontFamily: "var(--font-shippori-mincho)", textWrap: "balance" }}
              >
                {hero.title}
              </h2>
              <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                {excerpt(hero.body, 110)}
              </p>
              {parseTags(hero.tags).length > 0 && (
                <p className="text-xs mt-2" style={{ color: "var(--ink-muted)" }}>
                  {parseTags(hero.tags).map((t) => `#${t}`).join(" ")}
                </p>
              )}
            </div>
          </Link>

          {rest.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--ink-muted)" }}>
                新着記事
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {rest.map((c) => (
                  <Link
                    key={c.id}
                    href={`/columns/${c.slug}`}
                    className="group rounded-lg overflow-hidden"
                    style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                  >
                    <div className="aspect-video">
                      <ArticleCoverImage slug={c.slug} text={`${c.title} ${stripHtml(c.body)}`} />
                    </div>
                    <div className="p-4">
                      <p className="text-xs mb-1.5" style={{ color: "var(--ink-muted)" }}>
                        {formatDateJa(new Date(c.publishedAt))}
                        {likeCounts[c.slug] > 0 && ` ・ 👍 ${likeCounts[c.slug]}`}
                      </p>
                      <h3
                        className="font-bold mb-1 leading-snug group-hover:underline"
                        style={{ fontFamily: "var(--font-shippori-mincho)" }}
                      >
                        {c.title}
                      </h3>
                      <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                        {excerpt(c.body, 70)}
                      </p>
                      {parseTags(c.tags).length > 0 && (
                        <p className="text-xs mt-1.5" style={{ color: "var(--ink-muted)" }}>
                          {parseTags(c.tags).map((t) => `#${t}`).join(" ")}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
