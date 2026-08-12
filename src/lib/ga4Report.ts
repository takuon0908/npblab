import { BetaAnalyticsDataClient } from "@google-analytics/data";

// GA4 Data APIの実績レポート取得。手動実行のCLIツール専用で、本番サイトのレンダリングパスからは
// 呼ばない(無料枠内でも余計なAPI呼び出しを増やさないため)
function getClient() {
  const keyFilename = process.env.GA4_SERVICE_ACCOUNT_KEY_PATH;
  if (!keyFilename) {
    throw new Error("GA4_SERVICE_ACCOUNT_KEY_PATH が設定されていません(.env.localを確認)");
  }
  return new BetaAnalyticsDataClient({ keyFilename });
}

function getPropertyId(): string {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    throw new Error("GA4_PROPERTY_ID が設定されていません(.env.localを確認)");
  }
  return propertyId;
}

export interface PagePerformance {
  path: string;
  title: string;
  pageviews: number;
  avgEngagementSeconds: number;
  bounceRate: number;
}

export async function getTopPages(days = 28, limit = 20): Promise<PagePerformance[]> {
  const client = getClient();
  const [response] = await client.runReport({
    property: `properties/${getPropertyId()}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    metrics: [
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "bounceRate" },
    ],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit,
  });

  return (response.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? "",
    title: row.dimensionValues?.[1]?.value ?? "",
    pageviews: Number(row.metricValues?.[0]?.value ?? 0),
    avgEngagementSeconds: Number(row.metricValues?.[1]?.value ?? 0),
    bounceRate: Number(row.metricValues?.[2]?.value ?? 0),
  }));
}

export interface AffiliateClickSummary {
  articleSlug: string;
  platform: string;
  itemName: string;
  clicks: number;
}

// affiliate_clickイベント(platform/item_name/article_slugパラメータ)の集計。
// GA4管理画面でカスタムディメンションとして登録していないとparam単位のブレークダウンは
// 取得できないため、未登録の場合はイベント合計件数のみのシンプルな形にフォールバックする
export async function getAffiliateClickTotal(days = 28): Promise<number> {
  const client = getClient();
  const [response] = await client.runReport({
    property: `properties/${getPropertyId()}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: { fieldName: "eventName", stringFilter: { value: "affiliate_click" } },
    },
  });

  const row = response.rows?.[0];
  return Number(row?.metricValues?.[0]?.value ?? 0);
}
