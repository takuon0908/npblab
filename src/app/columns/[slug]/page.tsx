import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getColumnBySlug, getColumns, getAllColumns, parseTags, excerptForMeta, withHeadingAnchors, splitBodyIntoSections } from "@/lib/microcms";
import { getArticleDiagrams } from "@/lib/articleDiagrams";
import { formatDateJa } from "@/lib/date";
import { ArticleCoverImage } from "@/components/ArticleCoverImage";
import { GoodButton } from "@/components/GoodButton";
import { ShareButton } from "@/components/ShareButton";
import { getLikeCount } from "@/lib/columnLikes";
import { ViewTracker } from "@/components/ViewTracker";
import { RakutenWidget } from "@/components/RakutenWidget";
import { AmazonProductCard } from "@/components/AmazonProductCard";
import { getAffiliateProduct } from "@/lib/affiliateProducts";
import { RakutenProductCard } from "@/components/RakutenProductCard";
import { getRakutenProduct } from "@/lib/rakutenProducts";
import { getViewCount, getPopularColumns } from "@/lib/columnViews";
import { siteUrl } from "@/lib/siteUrl";
import { prisma } from "@/lib/prisma";
import { detectColumnTeamSlug, TEAM_THEME } from "@/lib/teamTheme";
import { categoryToSlug } from "@/lib/categorySlug";
import { SITE_AUTHOR } from "@/lib/author";
import { getActivePlayerNames, linkPlayerNames } from "@/lib/playerLinks";
import Image from "next/image";

// 記事の即時反映は公開時のオンデマンドrevalidation(/api/revalidate)で行うため、これはあくまでフォールバック値(Vercel ISR Writes枠対策)
export const revalidate = 86400;

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
      description: excerptForMeta(column.body),
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
  const [column, likeCount, viewCount, activePlayers] = await Promise.all([
    getColumnBySlug(slug),
    getLikeCount(slug),
    getViewCount(slug),
    getActivePlayerNames(),
  ]);
  if (!column) notFound();

  const publishedDate = new Date(column.publishedAt);
  const bodyWithPlayerLinks = linkPlayerNames(column.body, activePlayers);
  const { html: bodyWithAnchors, headings } = withHeadingAnchors(bodyWithPlayerLinks);
  const pointSummary = excerptForMeta(column.body);
  const diagrams = getArticleDiagrams(column.slug);
  const bodySections = diagrams.length > 0 ? splitBodyIntoSections(bodyWithAnchors) : null;

  // 関連記事は「同じカテゴリ」を優先し、枠が余ればタグが一致する記事で埋める。
  // カテゴリだけだと同カテゴリ内に記事が少ない場合に関連記事自体が出なくなるため
  const affiliateProduct = getAffiliateProduct(column.slug, column.category?.[0]);
  const rakutenProduct = getRakutenProduct(column.slug);

  const relatedCategory = column.category?.[0];
  const relatedTag = parseTags(column.tags)[0];
  const seenSlugs = new Set([column.slug]);
  const relatedColumns = relatedCategory
    ? (await getColumns(6, relatedCategory)).contents.filter((c) => {
        if (seenSlugs.has(c.slug)) return false;
        seenSlugs.add(c.slug);
        return true;
      })
    : [];
  // カテゴリ一致だけで3本埋まらない場合のみ、タグ一致で不足分を補う(microCMSへの余分な問い合わせを避ける)
  if (relatedColumns.length < 3 && relatedTag) {
    const tagMatches = (await getColumns(6, undefined, relatedTag)).contents.filter((c) => !seenSlugs.has(c.slug));
    relatedColumns.push(...tagMatches);
  }
  relatedColumns.splice(3);

  const popularColumns = (await getPopularColumns(column.slug)).filter(
    (c) => !relatedColumns.some((r) => r.slug === c.slug)
  );

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
    author: { "@type": "Person", name: SITE_AUTHOR.name, url: `${siteUrl}/about#author` },
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
            className="text-[1.75rem] leading-tight font-black mb-4 sm:text-3xl"
            style={{ fontFamily: "var(--font-heading)", textWrap: "balance" }}
          >
            {column.title}
          </h1>
          {(affiliateProduct || rakutenProduct) && (
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
            {" ・ 執筆: "}
            <Link href="/about#author" className="hover:underline" style={{ color: "var(--accent)" }}>
              {SITE_AUTHOR.name}({SITE_AUTHOR.nickname})
            </Link>
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

        <div
          className="mb-8 p-5"
          style={{ background: "var(--surface-2)", borderLeft: "3px solid var(--accent)" }}
        >
          <p className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--accent)" }}>
            <span aria-hidden style={{ width: 7, height: 7, background: "var(--accent)", flex: "none", transform: "rotate(45deg)" }} />
            Point
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>
            {pointSummary}
          </p>
        </div>

        {headings.length >= 3 && (
          <nav className="mb-10 p-5" style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }} aria-label="目次">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--ink-muted)" }}>
              目次
            </p>
            <ol className="space-y-2 text-sm">
              {headings.map((h, i) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className="flex gap-2 hover:underline" style={{ color: "var(--ink-secondary)" }}>
                    <span className="tabular-nums" style={{ color: "var(--accent)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

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
              "--tw-prose-code": "var(--ink)",
              "--tw-prose-kbd": "var(--ink)",
            } as React.CSSProperties
          }
        >
          {bodySections
            ? bodySections.map((section, i) => (
                <div key={i}>
                  <div dangerouslySetInnerHTML={{ __html: section }} />
                  {diagrams
                    .filter((d) => d.afterSection === i)
                    .map((d, di) =>
                      d.component ? (
                        <figure key={`component-${di}`} className="not-prose my-8 p-4" style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}>
                          <d.component />
                        </figure>
                      ) : (
                        <figure key={d.src} className="not-prose my-8">
                          <Image
                            src={d.src!}
                            alt={d.alt!}
                            width={1400}
                            height={764}
                            className="w-full h-auto rounded-none"
                            style={{ border: "1px solid var(--border-strong)" }}
                          />
                        </figure>
                      )
                    )}
                </div>
              ))
            : // eslint-disable-next-line react/no-danger
              <div dangerouslySetInnerHTML={{ __html: bodyWithAnchors }} />}
        </div>

        {affiliateProduct && (
          <div className="mt-8 flex justify-center">
            <AmazonProductCard product={affiliateProduct} articleSlug={column.slug} />
          </div>
        )}

        {rakutenProduct && (
          <div className="mt-8 flex justify-center">
            <RakutenProductCard product={rakutenProduct} articleSlug={column.slug} />
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <RakutenWidget pageUrl={`${siteUrl}/columns/${column.slug}`} />
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <GoodButton slug={column.slug} initialCount={likeCount} />
          <ShareButton title={column.title} url={`${siteUrl}/columns/${column.slug}`} />
        </div>

        <Link
          href="/about#author"
          className="hover-lift mt-10 flex items-center gap-4 p-4"
          style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
        >
          <Image
            src={SITE_AUTHOR.image}
            alt={SITE_AUTHOR.name}
            width={64}
            height={64}
            className="flex-none rounded-full object-cover"
            style={{ width: 64, height: 64 }}
          />
          <div className="min-w-0">
            <p className="text-xs mb-0.5" style={{ color: "var(--ink-muted)" }}>
              この記事を書いた人
            </p>
            <p className="font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              {SITE_AUTHOR.name}({SITE_AUTHOR.nickname}) ・ {SITE_AUTHOR.jobTitle}
            </p>
          </div>
        </Link>
      </article>

      {relatedTeam && relatedTeamTheme && (
        <Link
          href={`/teams/${relatedTeam.slug}`}
          className="group mt-10 flex items-center justify-between gap-3 rounded-none px-4 py-3 transition-colors hover:bg-white/[0.04]"
          style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
        >
          <div className="flex items-center gap-3">
            <span aria-hidden style={{ width: 8, height: 32, background: relatedTeamTheme.accent, flex: "none" }} />
            <div>
              <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                この記事に関連する球団
              </p>
              <p className="font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
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
            <span aria-hidden style={{ width: 9, height: 9, background: "var(--accent)", flex: "none", transform: "rotate(45deg)" }} />
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
                  <ArticleCoverImage slug={c.slug} text={`${c.title} ${c.body.replace(/<[^>]+>/g, "")}`} category={c.category} tags={c.tags} showCategoryBadge />
                </div>
                <div className="p-4">
                  <p className="text-xs mb-1.5" style={{ color: "var(--ink-muted)" }}>
                    {formatDateJa(new Date(c.publishedAt))}
                  </p>
                  <h3
                    className="mb-1 leading-snug group-hover:underline"
                    style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}
                  >
                    {c.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {popularColumns.length >= 2 && (
        <section className="mt-14 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: "var(--ink)" }}>
            <span aria-hidden style={{ width: 9, height: 9, background: "var(--accent)", flex: "none", transform: "rotate(45deg)" }} />
            人気記事
          </h2>
          <ol className="space-y-3">
            {popularColumns.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={`/columns/${c.slug}`}
                  className="hover-lift group flex items-center gap-3 p-3"
                  style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
                >
                  <span
                    className="flex-none text-lg font-black tabular-nums"
                    style={{ color: "var(--accent)", width: 24 }}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium group-hover:underline" style={{ fontFamily: "var(--font-heading)" }}>
                    {c.title}
                  </span>
                  <span className="flex-none text-xs" style={{ color: "var(--ink-muted)" }}>
                    {c.views}回閲覧
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div
        className="mt-14 pt-6"
        style={relatedColumns.length >= 2 || popularColumns.length >= 2 ? undefined : { borderTop: "1px solid var(--border)" }}
      >
        <Link href="/columns" className="text-sm hover:underline" style={{ color: "var(--accent)" }}>
          ← コラム一覧へ戻る
        </Link>
      </div>
    </main>
  );
}
