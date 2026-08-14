import { getSearchPages, getSearchQueries } from "@/lib/gscReport";

async function main() {
  const days = 28;
  const pages = await getSearchPages(days, 100);

  console.log(`=== 「圏外ギリギリ」ページ(順位11〜20、表示20回以上) ― 伸びしろ候補 ===`);
  const striking = pages
    .filter((p) => p.position >= 10 && p.position <= 20 && p.impressions >= 20)
    .sort((a, b) => b.impressions - a.impressions);
  for (const p of striking) {
    console.log(`${String(p.impressions).padStart(5)}表示 | 順位${p.position.toFixed(1)} | CTR${(p.ctr * 100).toFixed(2)}% | ${p.query}`);
  }

  console.log(`\n=== 全ページ(表示回数順、上位40) ===`);
  for (const p of pages.slice(0, 40)) {
    console.log(`${String(p.impressions).padStart(5)}表示 | ${String(p.clicks).padStart(3)}クリック | 順位${p.position.toFixed(1)} | ${p.query}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
