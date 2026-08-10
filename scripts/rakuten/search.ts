// 楽天市場の商品検索(記事に貼る商品を探すための一時利用CLI)
// 使い方: npx tsx --env-file=.env.local scripts/rakuten/search.ts "検索キーワード" [件数]
import { searchRakutenProducts } from "../../src/lib/rakutenSearch";

async function main() {
  const keyword = process.argv[2];
  const hits = Number(process.argv[3] ?? 5);
  if (!keyword) {
    console.error('使い方: npx tsx --env-file=.env.local scripts/rakuten/search.ts "検索キーワード" [件数]');
    process.exit(1);
  }

  const results = await searchRakutenProducts(keyword, hits);
  for (const item of results) {
    console.log("----------------------------------------");
    console.log("商品名:", item.title);
    console.log("価格:", item.price, "円");
    console.log("レビュー:", item.reviewAverage, `(${item.reviewCount}件)`, "ショップ:", item.shopName);
    console.log("画像:", item.imageUrl);
    console.log("アフィリエイトURL:", item.affiliateUrl);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
