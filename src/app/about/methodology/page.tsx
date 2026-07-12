import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "算出方法について",
  description: "優勝確率・タイトル獲得確率・パワーランキングなど、当サイトの各種指標の算出方法を解説します。",
  alternates: { canonical: "/about/methodology" },
};

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-4">算出方法について</h1>
      <p style={{ color: "var(--ink-secondary)" }}>
        優勝確率・タイトル獲得確率は、公開されている試合結果・成績データをもとに独自にシミュレーションした結果であり、
        NPB公式の見解や予測ではありません。
      </p>
      {/* TODO: シミュレーション手法（モンテカルロ法の試行回数、チーム強さの推定方法など）を具体的に記載 */}
    </main>
  );
}
