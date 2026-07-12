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
  tags?: string[];
}

export async function getColumns(limit = 20) {
  return getClient().getList<Column>({
    endpoint: "columns",
    queries: { limit, orders: "-publishedAt" },
  });
}

export async function getColumnBySlug(slug: string) {
  const res = await getClient().getList<Column>({
    endpoint: "columns",
    queries: { filters: `slug[equals]${slug}`, limit: 1 },
  });
  return res.contents[0] ?? null;
}
