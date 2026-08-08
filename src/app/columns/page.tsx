import type { Metadata } from "next";
import Link from "next/link";
import { getColumns, parseTags, CATEGORIES } from "@/lib/microcms";
import { categoryToSlug } from "@/lib/categorySlug";
import { formatDateJa } from "@/lib/date";
import { ArticleCoverImage } from "@/components/ArticleCoverImage";
import { getLikeCounts } from "@/lib/columnLikes";
import { siteUrl } from "@/lib/siteUrl";

// 記事の即時反映は公開時のオンデマンドrevalidation(/api/revalidate)で行うため、これはあくまでフォールバック値(Vercel ISR Writes枠対策)
export const revalidate = 86400;

const PAGE_SIZE = 20;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  // ページネーションは自身を正規URLとして宣言する(常にpage1へ丸め込むとGoogleが2ページ目以降を
  // 正規ページと認識できず、そこにしか出てこない記事一覧がインデックスされなくなるため)
  const canonical = page > 1 ? `/columns?page=${page}` : "/columns";
  return {
    title: page > 1 ? `コラム(${page}ページ目)` : "コラム",
    description: "NPBのデータ分析コラム。独自指標や優勝確率・タイトルレースの考察記事一覧。",
    alternates: { canonical },
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function excerpt(html: string, length = 88): string {
  const text = stripHtml(html);
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function buildPageHref(page: number, category?: string, tag?: string): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (tag) params.set("tag", tag);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/columns?${qs}` : "/columns";
}

export default async function ColumnsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; page?: string }>;
}) {
  const { category, tag, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const { contents, totalCount } = await getColumns(PAGE_SIZE, category, tag, offset);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  // 2ページ目以降は「新着1本を大きく見せる」ヒーロー表示をせず、フラットなグリッドにする
  const showHero = page === 1;
  const hero = showHero ? contents[0] : undefined;
  const rest = showHero ? contents.slice(1) : contents;
  const likeCounts = await getLikeCounts(contents.map((c) => c.slug));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "プロ野球LAB", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "コラム" },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <nav className="mb-8 text-xs" style={{ color: "var(--ink-muted)" }} aria-label="パンくずリスト">
        <Link href="/" className="hover:underline">
          プロ野球LAB
        </Link>
      </nav>

      <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--accent)" }}>
        Column
      </p>
      <h1
        className="text-2xl font-black mb-3 sm:text-3xl"
        style={{ fontFamily: "var(--font-heading)" }}
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
              ? { background: "var(--accent)", color: "#1a1208" }
              : { border: "1px solid var(--border)", color: "var(--ink-secondary)" }
          }
        >
          すべて
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/columns/category/${categoryToSlug(c)}`}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={
              category === c
                ? { background: "var(--accent)", color: "#1a1208" }
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
          <Link href="/columns" className="hover:underline" style={{ color: "var(--accent)" }}>
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
          {hero && (
            <Link
              href={`/columns/${hero.slug}`}
              className="hover-lift group grid gap-0 sm:grid-cols-2 mb-12 rounded-none overflow-hidden"
              style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
            >
              <div className="aspect-video sm:aspect-auto sm:h-full">
                <ArticleCoverImage slug={hero.slug} text={`${hero.title} ${stripHtml(hero.body)}`} category={hero.category} tags={hero.tags} showCategoryBadge priority />
              </div>
              <div className="p-6 flex flex-col justify-center">
                <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
                  {formatDateJa(new Date(hero.publishedAt))} ・ 新着
                  {likeCounts[hero.slug] > 0 && ` ・ 👍 ${likeCounts[hero.slug]}`}
                </p>
                <h2
                  className="text-xl mb-2 leading-snug group-hover:underline sm:text-2xl"
                  style={{ fontFamily: "var(--font-heading)", fontWeight: 700, textWrap: "balance" }}
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
          )}

          {rest.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: "var(--ink)" }}>
                <span aria-hidden style={{ width: 9, height: 9, background: "var(--accent)", flex: "none", transform: "rotate(45deg)" }} />
                {showHero ? "新着記事" : "記事一覧"}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {rest.map((c) => (
                  <Link
                    key={c.id}
                    href={`/columns/${c.slug}`}
                    className="hover-lift group rounded-none overflow-hidden"
                    style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
                  >
                    <div className="aspect-video">
                      <ArticleCoverImage slug={c.slug} text={`${c.title} ${stripHtml(c.body)}`} category={c.category} tags={c.tags} showCategoryBadge />
                    </div>
                    <div className="p-4">
                      <p className="text-xs mb-1.5" style={{ color: "var(--ink-muted)" }}>
                        {formatDateJa(new Date(c.publishedAt))}
                        {likeCounts[c.slug] > 0 && ` ・ 👍 ${likeCounts[c.slug]}`}
                      </p>
                      <h3
                        className="mb-1 leading-snug group-hover:underline"
                        style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}
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

      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-4 text-sm" aria-label="ページネーション">
          {page > 1 ? (
            <Link href={buildPageHref(page - 1, category, tag)} className="hover:underline" style={{ color: "var(--accent)" }}>
              ← 前へ
            </Link>
          ) : (
            <span style={{ color: "var(--ink-muted)" }}>← 前へ</span>
          )}
          <span style={{ color: "var(--ink-secondary)" }}>
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={buildPageHref(page + 1, category, tag)} className="hover:underline" style={{ color: "var(--accent)" }}>
              次へ →
            </Link>
          ) : (
            <span style={{ color: "var(--ink-muted)" }}>次へ →</span>
          )}
        </nav>
      )}
    </main>
  );
}
