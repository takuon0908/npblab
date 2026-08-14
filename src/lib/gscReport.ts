import { GoogleAuth } from "google-auth-library";

const SITE_URL = "sc-domain:npblab.com";

function getAuth() {
  return new GoogleAuth({
    keyFile: process.env.GA4_SERVICE_ACCOUNT_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
}

export interface SearchQueryRow {
  query: string;
  page?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

// 直近days日分の検索クエリ別パフォーマンスを取得する。rowLimitで件数を絞れる
export async function getSearchQueries(days = 28, rowLimit = 200, page?: string): Promise<SearchQueryRow[]> {
  const auth = getAuth();
  const client = await auth.getClient();
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const res = await client.request<{
    rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  }>({
    url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
    method: "POST",
    data: {
      startDate: fmt(start),
      endDate: fmt(end),
      dimensions: page ? ["query", "page"] : ["query"],
      dimensionFilterGroups: page
        ? [{ filters: [{ dimension: "page", operator: "equals", expression: page }] }]
        : undefined,
      rowLimit,
    },
  });

  return (res.data.rows ?? []).map((r) => ({
    query: r.keys[0],
    page: page ? r.keys[1] : undefined,
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

// 直近days日分のページ別パフォーマンスを取得する
export async function getSearchPages(days = 28, rowLimit = 50): Promise<SearchQueryRow[]> {
  const auth = getAuth();
  const client = await auth.getClient();
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const res = await client.request<{
    rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  }>({
    url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
    method: "POST",
    data: {
      startDate: fmt(start),
      endDate: fmt(end),
      dimensions: ["page"],
      rowLimit,
    },
  });

  return (res.data.rows ?? []).map((r) => ({
    query: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}
