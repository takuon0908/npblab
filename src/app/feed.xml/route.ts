import { getColumns, excerptForMeta } from "@/lib/microcms";
import { siteUrl } from "@/lib/siteUrl";

// RSSリーダー・ニュースアグリゲーター経由の副次的な流入導線として、最新コラムのフィードを配信する。
// データは1日1回しか更新されないため、他ページと同じ間隔で十分(公開時のオンデマンドrevalidationで即時反映)
export const revalidate = 86400;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let items = "";
  try {
    const { contents } = await getColumns(30);
    items = contents
      .map((c) => {
        const url = `${siteUrl}/columns/${c.slug}`;
        const description = excerptForMeta(c.body, 200);
        return `
    <item>
      <title>${escapeXml(c.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(c.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
      ${c.category?.[0] ? `<category>${escapeXml(c.category[0])}</category>` : ""}
    </item>`;
      })
      .join("");
  } catch {
    // microCMS未設定のビルド環境でも失敗させない
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>プロ野球LAB</title>
    <link>${siteUrl}</link>
    <description>NPBのデータを独自に分析。優勝確率・タイトル獲得確率・独自指標をもとにした考察コラムをお届けします。</description>
    <language>ja</language>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
