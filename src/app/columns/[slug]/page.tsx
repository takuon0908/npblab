import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getColumnBySlug } from "@/lib/microcms";
import { formatDateJa } from "@/lib/date";
import { ArticleCover } from "@/components/ArticleCover";

// microCMSサービスが未作成の段階でもビルドを通すため、ビルド時の静的生成を無効化
export const dynamic = "force-dynamic";

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
  const column = await getColumnBySlug(slug);
  if (!column) notFound();

  const publishedDate = new Date(column.publishedAt);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: column.title,
    datePublished: column.publishedAt,
    author: { "@type": "Organization", name: "プロ野球LAB" },
    publisher: { "@type": "Organization", name: "プロ野球LAB" },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "プロ野球LAB", item: "/" },
      { "@type": "ListItem", position: 2, name: "コラム", item: "/columns" },
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
          <ArticleCover slug={column.slug} />
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
          </p>
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
      </article>

      <div className="mt-14 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
        <Link href="/columns" className="text-sm hover:underline" style={{ color: "var(--accent)" }}>
          ← コラム一覧へ戻る
        </Link>
      </div>
    </main>
  );
}
