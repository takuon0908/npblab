import { getSearchQueries, getSearchPages } from "@/lib/gscReport";

async function main() {
  const days = 28;

  const pages = await getSearchPages(days, 30);
  console.log(`=== 直近${days}日 ページ別サーチコンソール実績 トップ${pages.length} ===`);
  for (const p of pages) {
    console.log(
      `${String(p.impressions).padStart(6)}表示 | ${String(p.clicks).padStart(4)}クリック | CTR${(p.ctr * 100).toFixed(2)}% | 平均掲載順位${p.position.toFixed(1)} | ${p.query}`
    );
  }

  const queries = await getSearchQueries(days, 300);
  console.log(`\n=== 直近${days}日 クエリ別サーチコンソール実績(表示回数順) ===`);
  const sorted = [...queries].sort((a, b) => b.impressions - a.impressions);
  console.log("表示回数が多いのにCTRが低いクエリ(表示50回以上、CTR3%未満)を抽出:\n");
  const lowCtrHighImpression = sorted.filter((q) => q.impressions >= 50 && q.ctr < 0.03);
  for (const q of lowCtrHighImpression) {
    console.log(
      `${String(q.impressions).padStart(6)}表示 | ${String(q.clicks).padStart(4)}クリック | CTR${(q.ctr * 100).toFixed(2)}% | 順位${q.position.toFixed(1)} | 「${q.query}」`
    );
  }

  console.log(`\n上記以外の表示回数トップ20:\n`);
  for (const q of sorted.slice(0, 20)) {
    console.log(
      `${String(q.impressions).padStart(6)}表示 | ${String(q.clicks).padStart(4)}クリック | CTR${(q.ctr * 100).toFixed(2)}% | 順位${q.position.toFixed(1)} | 「${q.query}」`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
