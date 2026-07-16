import type { Metadata } from "next";
import Link from "next/link";
import { getColumns } from "@/lib/microcms";
import { formatDateJa } from "@/lib/date";

// microCMSサービスが未作成の段階でもビルドを通すよう、ビルド時の静的生成を無効化
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "コラム",
  description: "NPBのデータ分析コラム。独自指標や優勝確率・タイトルレースの考察記事一覧。",
  alternates: { canonical: "/columns" },
};

function excerpt(html: string, length = 88): string {
  const text = html.replace(/<[^>]+>/g, "").trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

export default async function ColumnsPage() {
  const { contents } = await getColumns();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--accent)" }}>
        Column
      </p>
      <h1
        className="text-2xl font-bold mb-3 sm:text-3xl"
        style={{ fontFamily: "var(--font-shippori-mincho)" }}
      >
        コラム
      </h1>
      <p className="text-sm mb-10" style={{ color: "var(--ink-secondary)" }}>
        優勝確率シミュレーションやタイトルレースの数字から、当サイトのライター陣が読み解く考察記事です。
      </p>

      {contents.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          まだ記事がありません。
        </p>
      ) : (
        <ul className="flex flex-col">
          {contents.map((c) => (
            <li key={c.id} style={{ borderTop: "1px solid var(--border)" }}>
              <Link href={`/columns/${c.slug}`} className="group block py-6">
                <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
                  {formatDateJa(new Date(c.publishedAt))}
                </p>
                <h2
                  className="text-lg font-bold mb-1.5 group-hover:underline sm:text-xl"
                  style={{ fontFamily: "var(--font-shippori-mincho)" }}
                >
                  {c.title}
                </h2>
                <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                  {excerpt(c.body)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
