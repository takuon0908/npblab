// GA4の実績データを見るための手動実行CLI(自動実行はしない)
// 使い方: npx tsx --env-file=.env.local scripts/ga4/report.ts [日数(デフォルト28)]
import { getTopPages, getAffiliateClickTotal } from "../../src/lib/ga4Report";

async function main() {
  const days = Number(process.argv[2] ?? 28);

  console.log(`=== 直近${days}日 ページ別パフォーマンス トップ20 ===`);
  const pages = await getTopPages(days, 20);
  for (const p of pages) {
    console.log(
      `${p.pageviews.toString().padStart(6)}PV | 平均滞在${p.avgEngagementSeconds.toFixed(0)}秒 | 直帰率${(p.bounceRate * 100).toFixed(1)}% | ${p.path} (${p.title})`
    );
  }

  console.log(`\n=== 直近${days}日 アフィリエイトリンククリック合計 ===`);
  const clicks = await getAffiliateClickTotal(days);
  console.log(`${clicks}回`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
