import type { Metadata } from "next";
import Link from "next/link";
import { getColumns } from "@/lib/microcms";
import { getViewCounts } from "@/lib/columnViews";
import { Table, Th, Td } from "@/components/Table";
import { formatDateJa } from "@/lib/date";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "人気記事ランキング",
  description: "プロ野球LABのコラム記事を閲覧数の多い順に並べたランキング。",
  alternates: { canonical: "/columns/ranking" },
};

async function getRanking() {
  const { contents } = await getColumns(100);
  const viewCounts = await getViewCounts(contents.map((c) => c.slug));

  return contents
    .map((c) => ({ ...c, views: viewCounts[c.slug] ?? 0 }))
    .sort((a, b) => b.views - a.views);
}

export default async function ColumnsRankingPage() {
  const ranked = await getRanking();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
        <Link href="/columns" className="hover:underline" style={{ color: "var(--accent)" }}>
          コラム
        </Link>
      </p>
      <h1
        className="text-2xl font-bold mb-2 sm:text-3xl"
        style={{ fontFamily: "var(--font-shippori-mincho)" }}
      >
        人気記事ランキング
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-secondary)" }}>
        コラム記事を閲覧数の多い順に並べています。
      </p>

      {ranked.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          まだ記事がありません。
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th align="right">順位</Th>
              <Th>記事</Th>
              <Th align="right">閲覧数</Th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((c, i) => (
              <tr key={c.id} className="hover:bg-black/[0.03]">
                <Td align="right" muted>
                  {i + 1}
                </Td>
                <Td>
                  <Link href={`/columns/${c.slug}`} className="hover:underline">
                    {c.title}
                  </Link>
                  <div className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
                    {formatDateJa(new Date(c.publishedAt))}
                  </div>
                </Td>
                <Td align="right">
                  <span className="font-semibold">{c.views}</span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </main>
  );
}
