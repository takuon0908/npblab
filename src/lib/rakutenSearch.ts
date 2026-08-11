// 楽天市場商品検索API。このAPIは呼び出し元のOrigin/Refererを許可リストと照合するため、
// サーバーサイドから呼ぶ場合も本番サイトのURLをOrigin/Refererとして明示的に送る必要がある
// (npblab.comを楽天アフィリエイト側に登録済み)
const ENDPOINT = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";

export interface RakutenSearchResult {
  title: string;
  price: number;
  imageUrl: string;
  affiliateUrl: string;
  reviewCount: number;
  reviewAverage: number;
  shopName: string;
}

interface RakutenApiItem {
  itemName: string;
  itemPrice: number;
  mediumImageUrls: { imageUrl: string }[];
  affiliateUrl?: string;
  itemUrl: string;
  reviewCount: number;
  reviewAverage: number;
  shopName: string;
}

export async function searchRakutenProducts(keyword: string, hits = 5): Promise<RakutenSearchResult[]> {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
  if (!applicationId || !accessKey) {
    throw new Error("RAKUTEN_APPLICATION_ID / RAKUTEN_ACCESS_KEY が設定されていません(.env.localを確認)");
  }

  const params = new URLSearchParams({
    format: "json",
    keyword,
    genreId: "0",
    applicationId,
    accessKey,
    hits: String(hits),
    sort: "-reviewCount", // レビュー数が多い(=実売実績のある)商品を優先
    ...(affiliateId ? { affiliateId } : {}),
  });

  const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
    headers: {
      Origin: "https://www.npblab.com",
      Referer: "https://www.npblab.com/",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`楽天API呼び出しに失敗しました: HTTP ${res.status} ${body}`);
  }

  const data = (await res.json()) as { Items?: { Item: RakutenApiItem }[] };
  return (data.Items ?? []).map(({ Item }) => ({
    title: Item.itemName,
    price: Item.itemPrice,
    // mediumImageUrlsは既定で128x128しかなく商品カードで表示するには小さいため、
    // 同じサムネイルプロキシのサイズ指定(_ex)を400x400に上書きして解像度を上げる
    imageUrl: (Item.mediumImageUrls[0]?.imageUrl ?? "").replace(/_ex=\d+x\d+/, "_ex=400x400"),
    affiliateUrl: Item.affiliateUrl ?? Item.itemUrl,
    reviewCount: Item.reviewCount,
    reviewAverage: Item.reviewAverage,
    shopName: Item.shopName,
  }));
}
