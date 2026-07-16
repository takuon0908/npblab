import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "独自指標",
  description: "パークファクター調整成績、クラッチ成績、連戦負荷指標などNPBの独自分析指標。",
  alternates: { canonical: "/analysis" },
  // 中身が未実装のプレースホルダーのため、実装完了までは検索エンジンにインデックスさせない
  robots: { index: false, follow: true },
};

export default function AnalysisPage() {
  // TODO: パークファクター調整成績、クラッチ成績、連戦負荷指標など独自指標の一覧・詳細
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">独自指標</h1>
      <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
        準備中
      </p>
    </main>
  );
}
