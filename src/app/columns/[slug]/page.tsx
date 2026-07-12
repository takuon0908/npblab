import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getColumnBySlug } from "@/lib/microcms";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: column.title,
    datePublished: column.publishedAt,
    author: { "@type": "Organization", name: "プロ野球LAB" },
    publisher: { "@type": "Organization", name: "プロ野球LAB" },
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-2xl font-bold mb-6">{column.title}</h1>
      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: column.body }}
      />
    </main>
  );
}
