import { getSearchQueries } from "@/lib/gscReport";

const teamSlugs = [
  "tigers",
  "hawks",
  "dragons",
  "baystars",
  "giants",
  "carp",
  "swallows",
  "buffaloes",
  "fighters",
  "marines",
  "lions",
  "eagles",
];

async function main() {
  for (const slug of teamSlugs) {
    const page = `https://www.npblab.com/teams/${slug}`;
    const rows = await getSearchQueries(28, 15, page);
    if (rows.length === 0) continue;
    console.log(`\n=== /teams/${slug} ===`);
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
