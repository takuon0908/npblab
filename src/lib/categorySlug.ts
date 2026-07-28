import { CATEGORIES } from "@/lib/microcms";

// カテゴリ名(microCMS表記)とURLスラッグの対応。既存の記事slugプレフィックスと合わせた命名
const CATEGORY_SLUG_MAP: Record<(typeof CATEGORIES)[number], string> = {
  "NPBデータ分析": "npb-analysis",
  "選手フィーチャー": "player-feature",
  "ペナントレース速報": "pennant-race",
  "野球理論（科学的検証）": "baseball-theory",
  "ルール・基礎知識": "rules-basics",
  "体づくり・怪我予防": "injury-prevention",
  "用具選び": "gear-guide",
};

export function categoryToSlug(category: string): string | null {
  return (CATEGORY_SLUG_MAP as Record<string, string>)[category] ?? null;
}

export function slugToCategory(slug: string): string | null {
  const entry = Object.entries(CATEGORY_SLUG_MAP).find(([, s]) => s === slug);
  return entry ? entry[0] : null;
}
