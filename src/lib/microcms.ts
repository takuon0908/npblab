import { createClient } from "microcms-js-sdk";

// microCMSサービス作成前でもビルドが通るよう、チェックは呼び出し時に行う
function getClient() {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;
  if (!serviceDomain || !apiKey) {
    throw new Error("MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY が設定されていません（.env.localを確認）");
  }
  return createClient({ serviceDomain, apiKey });
}

// コラム/分析記事のコンテンツ型（microCMS側のスキーマと対応させる）
export interface Column {
  id: string;
  title: string;
  slug: string;
  body: string; // リッチエディタのHTML
  publishedAt: string;
  updatedAt: string;
  category?: string[]; // 複数選択フィールド。未設定記事は空配列
  tags?: string; // テキストフィールド（カンマ区切りで複数タグを表現）。未入力の記事はキー自体が無い
}

// カテゴリの固定リスト（microCMS側のセレクト肢と合わせる）
export const CATEGORIES = [
  "NPBデータ分析",
  "選手フィーチャー",
  "ペナントレース速報",
  "野球理論（科学的検証）",
  "ルール・基礎知識",
  "体づくり・怪我予防",
  "用具選び",
] as const;

// tagsフィールド(カンマ区切りの文字列)をトリム済みの配列に変換する
export function parseTags(tags?: string): string[] {
  if (!tags) return [];
  return tags
    .split(/[,、]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function getColumns(limit = 20, category?: string, tag?: string) {
  const filters = [
    category ? `category[contains]${category}` : null,
    tag ? `tags[contains]${tag}` : null,
  ]
    .filter(Boolean)
    .join("[and]");

  return getClient().getList<Column>({
    endpoint: "columns",
    queries: {
      limit,
      orders: "-publishedAt",
      ...(filters ? { filters } : {}),
    },
  });
}

export async function getColumnBySlug(slug: string) {
  const res = await getClient().getList<Column>({
    endpoint: "columns",
    queries: { filters: `slug[equals]${slug}`, limit: 1 },
  });
  return res.contents[0] ?? null;
}
