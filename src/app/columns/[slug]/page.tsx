import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getColumnBySlug, getColumns, parseTags } from "@/lib/microcms";
import { formatDateJa } from "@/lib/date";
import { ArticleCoverImage } from "@/components/ArticleCoverImage";
import { GoodButton } from "@/components/GoodButton";
import { getLikeCount } from "@/lib/columnLikes";
import { ViewTracker } from "@/components/ViewTracker";
import { getViewCount } from "@/lib/columnViews";
import { siteUrl } from "@/lib/siteUrl";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const { contents } = await getColumns(100);
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
        <div className="aspect-[16/7] rounded-lg overflow-hidden mb-8">
          <ArticleCoverImage
            slug={column.slug}
            text={`${column.title} ${column.body.replace(/<[^>]+>/g, "")}`}
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
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            {formatDateJa(publishedDate)}
            {viewCount > 0 && ` ・ ${viewCount}回閲覧`}
          </p>
          {column.category && column.category.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {column.category.map((c) => (
                <Link
                  key={c}
                  href={`/columns?category=${encodeURIComponent(c)}`}
                  className="rounded-full px-2.5 py-0.5 text-xs hover:underline"
                  style={{ background: "var(--accent-track)", color: "var(--accent)" }}
                >
                  {c}
                </Link>
              ))}
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

        <div className="mt-10 flex justify-center">
          <GoodButton slug={column.slug} initialCount={likeCount} />
        </div>
      </article>

      <div className="mt-14 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
        <Link href="/columns" className="text-sm hover:underline" style={{ color: "var(--accent)" }}>
          ← コラム一覧へ戻る
        </Link>
      </div>
    </main>
  );
}
