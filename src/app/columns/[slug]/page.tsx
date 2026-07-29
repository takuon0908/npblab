import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getColumnBySlug, getColumns, getAllColumns, parseTags } from "@/lib/microcms";
import { formatDateJa } from "@/lib/date";
import { ArticleCoverImage } from "@/components/ArticleCoverImage";
import { GoodButton } from "@/components/GoodButton";
import { ShareButton } from "@/components/ShareButton";
import { getLikeCount } from "@/lib/columnLikes";
import { ViewTracker } from "@/components/ViewTracker";
import { RakutenWidget } from "@/components/RakutenWidget";
import { AmazonProductCard } from "@/components/AmazonProductCard";
import { getAffiliateProduct } from "@/lib/affiliateProducts";
import { getViewCount } from "@/lib/columnViews";
import { siteUrl } from "@/lib/siteUrl";
import { prisma } from "@/lib/prisma";
import { detectColumnTeamSlug, TEAM_THEME } from "@/lib/teamTheme";
import { categoryToSlug } from "@/lib/categorySlug";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const contents = await getAllColumns();
    return contents.map((column) => ({ slug: column.slug }));
  } catch {
    // microCMS未設定のビルド環境でも失敗させない
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const column = await getColumnBySlug(slug);
    if (!column) return {};
    return {
      title: column.title,
      description: column.body.replace(/<[^>]+>/g, "").slice(0, 120),
      alternates: { canonical: `/columns/${slug}` },
    };
  } catch {
    return {};
  }
}

export default async function ColumnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [column, likeCount, viewCount] = await Promise.all([
    getColumnBySlug(slug),
    getLikeCount(slug),
    getViewCount(slug),
  ]);
  if (!column) notFound();

  const publishedDate = new Date(column.publishedAt);

  // 同じカテゴリ(先頭の1件)の記事を関連記事として表示する。2本未満ならセクション自体を出さない
  const affiliateProduct = getAffiliateProduct(column.slug);

  const relatedCategory = column.category?.[0];
  const relatedColumns = relatedCategory
    ? (await getColumns(4, relatedCategory)).contents
        .filter((c) => c.slug !== column.slug)
        .slice(0, 3)
    : [];

  const relatedTeamSlug = detectColumnTeamSlug(column);
  const relatedTeam = relatedTeamSlug
    ? await prisma.team.findUnique({ where: { slug: relatedTeamSlug } })
    : null;
  const relatedTeamTheme = relatedTeamSlug ? TEAM_THEME[relatedTeamSlug] : null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: column.title,
    datePublished: column.publishedAt,
    dateModified: column.updatedAt || column.publishedAt,
    image: [`${siteUrl}/columns/${column.slug}/opengraph-image`],
    author: { "@type": "Organization", name: "プロ野球LAB" },
    publisher: { "@type": "Organization", name: "プロ野球LAB" },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}/columns/${column.slug}` },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "プロ野球LAB", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "コラム", item: `${siteUrl}/columns` },
      { "@type": "ListItem", position: 3, name: column.title },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ViewTracker slug={column.slug} />

      <nav className="mb-8 text-xs" style={{ color: "var(--ink-muted)" }} aria-label="パンくずリスト">
        <Link href="/" className="hover:underline">
          プロ野球LAB
        </Link>
        <span className="mx-1.5">›</span>
        <Link href="/columns" className="hover:underline">
          コラム
        </Link>
      </nav>

      <article>
        <div className="aspect-[16/7] rounded-none overflow-hidden mb-8">
          <ArticleCoverImage
            slug={column.slug}
            text={`${column.title} ${column.body.replace(/<[^>]+>/g, "")}`}
            title={column.title}
            category={column.category}
            tags={column.tags}
            priority
          />
        </div>

        <header className="mb-10">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--accent)" }}
          >
            Column
          </p>
          <h1
            className="text-[1.75rem] leading-tight font-bold mb-4 sm:text-3xl"
            style={{ fontFamily: "var(--font-shippori-mincho)", textWrap: "balance" }}
          >
            {column.title}
          </h1>
          {affiliateProduct && (
            <p
              className="inline-block text-xs px-2.5 py-1 mb-3"
              style={{ color: "var(--ink-muted)", background: "var(--surface)", border: "1px solid var(--border-strong)" }}
            >
              PR：本記事はアフィリエイト広告を含みます
            </p>
          )}
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            {formatDateJa(publishedDate)}
            {viewCount > 0 && ` ・ ${viewCount}回閲覧`}
          </p>
          {column.category && column.category.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {column.category.map((c) => {
                const slug = categoryToSlug(c);
                return (
                  <Link
                    key={c}
                    href={slug ? `/columns/category/${slug}` : "/columns"}
                    className="rounded-full px-2.5 py-0.5 text-xs hover:underline"
                    style={{ background: "var(--accent-track)", color: "var(--accent)" }}
                  >
                    {c}
                  </Link>
                );
              })}
            </div>
          )}
          {parseTags(column.tags).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {parseTags(column.tags).map((t) => (
                <Link
                  key={t}
                  href={`/columns?tag=${encodeURIComponent(t)}`}
                  className="rounded-full px-2.5 py-0.5 text-xs hover:underline"
                  style={{ border: "1px solid var(--border)", color: "var(--ink-muted)" }}
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </header>

        <div style={{ borderTop: "1px solid var(--border)" }} className="mb-10" />

        <div
          className="prose max-w-none prose-p:leading-[1.9] prose-headings:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-xl prose-h2:border-l-4 prose-h2:pl-3 prose-h2:[border-color:var(--accent-track)]"
          style={
            {
              "--tw-prose-body": "var(--ink-secondary)",
              "--tw-prose-headings": "var(--ink)",
              "--tw-prose-bold": "var(--ink)",
              "--tw-prose-links": "var(--accent)",
              "--tw-prose-quotes": "var(--ink-secondary)",
              "--tw-prose-quote-borders": "var(--border)",
              "--tw-prose-hr": "var(--border)",
            } as React.CSSProperties
          }
          dangerouslySetInnerHTML={{ __html: column.body }}
        />

        {affiliateProduct && (
          <div className="mt-8 flex justify-center">
            <AmazonProductCard product={affiliateProduct} />
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <RakutenWidget pageUrl={`${siteUrl}/columns/${column.slug}`} />
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <GoodButton slug={column.slug} initialCount={likeCount} />
          <ShareButton title={column.title} url={`${siteUrl}/columns/${column.slug}`} />
        </div>
      </article>

      {relatedTeam && relatedTeamTheme && (
        <Link
          href={`/teams/${relatedTeam.slug}`}
          className="group mt-10 flex items-center justify-between gap-3 rounded-none px-4 py-3 transition-colors hover:bg-black/[0.02]"
          style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
        >
          <div className="flex items-center gap-3">
            <span aria-hidden style={{ width: 8, height: 32, background: relatedTeamTheme.accent, flex: "none" }} />
            <div>
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                この記事に関連する球団
              </p>
              <p className="font-semibold" style={{ fontFamily: "var(--font-shippori-mincho)" }}>
                {relatedTeam.name}
              </p>
            </div>
          </div>
          <span
            className="whitespace-nowrap text-sm font-medium group-hover:underline"
            style={{ color: "var(--accent)" }}
          >
            球団ページを見る →
          </span>
        </Link>
      )}

      {relatedColumns.length >= 2 && (
        <section className="mt-14 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: "var(--ink)" }}>
            <span aria-hidden style={{ width: 9, height: 9, background: "var(--accent)", flex: "none" }} />
            関連記事
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {relatedColumns.map((c) => (
              <Link
                key={c.id}
                href={`/columns/${c.slug}`}
                className="hover-lift group rounded-none overflow-hidden"
                style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
              >
                <div className="aspect-video">
                  <ArticleCoverImage slug={c.slug} text={`${c.title} ${c.body.replace(/<[^>]+>/g, "")}`} category={c.category} tags={c.tags} />
                </div>
                <div className="p-4">
                  <p className="text-xs mb-1.5" style={{ color: "var(--ink-muted)" }}>
                    {formatDateJa(new Date(c.publishedAt))}
                  </p>
                  <h3
                    className="mb-1 leading-snug group-hover:underline"
                    style={{ fontFamily: "var(--font-shippori-mincho)", fontWeight: 700 }}
                  >
                    {c.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div
        className="mt-14 pt-6"
        style={relatedColumns.length >= 2 ? undefined : { borderTop: "1px solid var(--border)" }}
      >
        <Link href="/columns" className="text-sm hover:underline" style={{ color: "var(--accent)" }}>
          ← コラム一覧へ戻る
        </Link>
      </div>
    </main>
  );
}
