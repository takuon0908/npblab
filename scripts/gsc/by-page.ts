import { getSearchQueries } from "@/lib/gscReport";

async function main() {
  const pages = [
    "https://www.npblab.com/columns/rules-basics-farm-3zone-2026",
    "https://www.npblab.com/columns/rules-basics-registered-vs-development",
    "https://www.npblab.com/columns/rules-basics-suspended-game",
    "https://www.npblab.com/columns/rules-basics-save-vs-hold",
    "https://www.npblab.com/columns/rules-basics-video-review",
    "https://www.npblab.com/columns/rules-basics-danger-pitch-ejection",
  ];
  for (const page of pages) {
    const rows = await getSearchQueries(28, 15, page);
    console.log(`\n=== ${page} ===`);
    for (const r of rows.sort((a, b) => b.impressions - a.impressions)) {
      console.log(
        `${String(r.impressions).padStart(5)}表示 | ${String(r.clicks).padStart(3)}クリック | CTR${(r.ctr * 100).toFixed(2)}% | 順位${r.position.toFixed(1)} | 「${r.query}」`
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
