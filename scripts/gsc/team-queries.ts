import { getSearchQueries } from "@/lib/gscReport";

async function main() {
  const rows = await getSearchQueries(28, 500);
  const teamRelated = rows.filter((r) => r.query.includes("優勝確率") || r.query.includes("優勝 確率"));
  console.log(`=== 「優勝確率」系クエリ(直近28日、全ページ横断) 表示回数順 ===\n`);
  for (const r of teamRelated.sort((a, b) => b.impressions - a.impressions)) {
    console.log(
      `${String(r.impressions).padStart(5)}表示 | ${String(r.clicks).padStart(3)}クリック | CTR${(r.ctr * 100).toFixed(2)}% | 順位${r.position.toFixed(1)} | 「${r.query}」`
    );
  }
  const totalImpr = teamRelated.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = teamRelated.reduce((s, r) => s + r.clicks, 0);
  console.log(`\n合計: ${totalImpr}表示 / ${totalClicks}クリック`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
