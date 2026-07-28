import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getColumns, parseTags } from "@/lib/microcms";
import { slugToCategory, categoryToSlug } from "@/lib/categorySlug";
import { CATEGORIES } from "@/lib/microcms";
import { formatDateJa } from "@/lib/date";
import { ArticleCoverImage } from "@/components/ArticleCoverImage";
import { getLikeCounts } from "@/lib/columnLikes";

export const revalidate = 60;

const PAGE_SIZE = 20;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function excerpt(html: string, length = 88): string {
  const text = stripHtml(html);
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function buildPageHref(categorySlug: string, page: number): string {
  return page > 1 ? `/columns/category/${categorySlug}?page=${page}` : `/columns/category/${categorySlug}`;
}

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ categorySlug: categoryToSlug(c)! }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = slugToCategory(categorySlug);
  if (!category) return {};
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  // ページネーションは自身を正規URLとして宣言する(常に1ページ目へ丸め込むと、
  // 2ページ目以降にしか出てこない記事一覧がインデックスされなくなるため)
  const canonical =
    page > 1 ? `/columns/category/${categorySlug}?page=${page}` : `/columns/category/${categorySlug}`;
  return {
    title: page > 1 ? `${category}のコラム(${page}ページ目)` : `${category}のコラム`,
    description: `NPBのコラムから「${category}」カテゴリの記事一覧。独自指標や優勝確率・タイトルレースの考察記事。`,
    alternates: { canonical },
  };
}

export default async function ColumnsCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { categorySlug } = await params;
  const category = slugToCategory(categorySlug);
  if (!category) notFound();

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const { contents, totalCount } = await getColumns(PAGE_SIZE, category, undefined, offset);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  // 2ページ目以降は「新着1本を大きく見せる」ヒーロー表示をせず、フラットなグリッドにする
  const showHero = page === 1;
  const hero = showHero ? contents[0] : undefined;
  const rest = showHero ? contents.slice(1) : contents;
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
        {category}
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
          style={{ border: "1px solid var(--border)", color: "var(--ink-secondary)" }}
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
                ? { background: "var(--accent)", color: "#fff" }
                : { border: "1px solid var(--border)", color: "var(--ink-secondary)" }
            }
          >
            {c}
          </Link>
        ))}
      </div>

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
                <ArticleCoverImage slug={hero.slug} text={`${hero.title} ${stripHtml(hero.body)}`} category={hero.category} tags={hero.tags} priority />
              </div>
              <div className="p-6 flex flex-col justify-center">
                <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
                  {formatDateJa(new Date(hero.publishedAt))} ・ 新着
                  {likeCounts[hero.slug] > 0 && ` ・ 👍 ${likeCounts[hero.slug]}`}
                </p>
                <h2
                  className="text-xl mb-2 leading-snug group-hover:underline sm:text-2xl"
                  style={{ fontFamily: "var(--font-shippori-mincho)", fontWeight: 700, textWrap: "balance" }}
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
                <span aria-hidden style={{ width: 9, height: 9, background: "var(--accent)", flex: "none" }} />
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
                      <ArticleCoverImage slug={c.slug} text={`${c.title} ${stripHtml(c.body)}`} category={c.category} tags={c.tags} />
                    </div>
                    <div className="p-4">
                      <p className="text-xs mb-1.5" style={{ color: "var(--ink-muted)" }}>
                        {formatDateJa(new Date(c.publishedAt))}
                        {likeCounts[c.slug] > 0 && ` ・ 👍 ${likeCounts[c.slug]}`}
                      </p>
                      <h3
                        className="mb-1 leading-snug group-hover:underline"
                        style={{ fontFamily: "var(--font-shippori-mincho)", fontWeight: 700 }}
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
            <Link href={buildPageHref(categorySlug, page - 1)} className="hover:underline" style={{ color: "var(--accent)" }}>
              ← 前へ
            </Link>
          ) : (
            <span style={{ color: "var(--ink-muted)" }}>← 前へ</span>
          )}
          <span style={{ color: "var(--ink-secondary)" }}>
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={buildPageHref(categorySlug, page + 1)} className="hover:underline" style={{ color: "var(--accent)" }}>
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
