import type { Metadata } from "next";
import Link from "next/link";
import { getColumns } from "@/lib/microcms";

// microCMSサービスが未作成の段階でもビルドを通すため、ビルド時の静的生成を無効化
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "コラム",
  description: "NPBのデータ分析コラム。独自指標や優勝確率・タイトルレースの考察記事一覧。",
  alternates: { canonical: "/columns" },
};

export default async function ColumnsPage() {
  const { contents } = await getColumns();
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">コラム</h1>
      <ul className="space-y-3">
        {contents.map((c) => (
          <li key={c.id}>
            <Link
              href={`/columns/${c.slug}`}
              className="block rounded-lg p-4 font-medium transition-colors hover:opacity-80"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {c.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
