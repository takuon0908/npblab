// コラム記事(slug)ごとに紹介しているAmazon商品。
// microCMSのリッチテキストフィールドは<img>タグとclass属性を保存時に取り除いてしまうため、
// 商品画像カードはこのマップを見て記事ページ側(React)で描画する。
export interface AffiliateProduct {
  asin: string;
  title: string;
  imageUrl: string;
}

export const AFFILIATE_PRODUCTS: Record<string, AffiliateProduct> = {
  "gear-guide-glove": {
    asin: "B0CHMMMJFF",
    title: "ゼット(ZETT) キャッチボール用グローブ 初心者用(衝撃吸収パッド付き)",
    imageUrl: "https://m.media-amazon.com/images/I/614KkwORMmL._AC_SX569_.jpg",
  },
  "gear-guide-glove-care": {
    asin: "B0C6QKLNCM",
    title: "ミズノ グラブお手入れセット(レザーローション&ストロングオイル)",
    imageUrl: "https://m.media-amazon.com/images/I/51U6o4BK4LL._AC_SX569_.jpg",
  },
  "gear-guide-bat": {
    asin: "B0DXP4LDL1",
    title: "ゼット(ZETT) 少年軟式用バット スイングマックス",
    imageUrl: "https://m.media-amazon.com/images/I/51+iZW957BL._AC_SX569_.jpg",
  },
  "gear-guide-spikes": {
    asin: "B0F8VKX5D7",
    title: "アシックス ジュニア用ベースボールシューズ STAR SHINE S 3",
    imageUrl: "https://m.media-amazon.com/images/I/61eBPVRspCL._AC_SY695_.jpg",
  },
  "gear-guide-starter-kit": {
    asin: "B09NXBL581",
    title: "ゼット(ZETT) ジュニア用デイパック(約20L)",
    imageUrl: "https://m.media-amazon.com/images/I/51XfYnph4VL._AC_SY695_.jpg",
  },
  "gear-guide-batting-gloves": {
    asin: "B0DPHDFWCL",
    title: "ゼット(ZETT) ジュニア用バッティンググローブ ゼロワンステージ",
    imageUrl: "https://m.media-amazon.com/images/I/71sRLdW+q1L._AC_SX569_.jpg",
  },
  "gear-guide-catcher-gear": {
    asin: "B0DV9C1XZS",
    title: "ゼット(ZETT) 少年用軟式キャッチャー防具4点セット",
    imageUrl: "https://m.media-amazon.com/images/I/51O5OGe77QL._AC_SX569_.jpg",
  },
  "gear-guide-training-equipment": {
    asin: "B0DKF3L7K1",
    title: "フィールドフォース フォースティー",
    imageUrl: "https://m.media-amazon.com/images/I/51Pcce-tZYL._AC_UF480,480_SR480,480_.jpg",
  },
};

// スラッグの完全一致が無い場合に、プレフィックスから当てはめるフォールバック商品
const PREFIX_FALLBACK_PRODUCTS: [RegExp, AffiliateProduct][] = [
  [
    /^rules-basics-/,
    {
      asin: "4583118015",
      title: "公認野球規則2026(日本プロフェッショナル野球組織・全日本野球協会 編)",
      imageUrl: "https://m.media-amazon.com/images/I/717rEWPgggL._AC_SF480,480_.jpg",
    },
  ],
];

// スラッグの完全一致もプレフィックスも無い場合、記事のカテゴリからフォールバックする商品。
// 「体づくり・怪我予防」「野球理論(科学的検証)」はどちらもコンディショニング関連の記事が多いため、
// 実売上位・高評価のフォームローラーを共通の汎用商品として割り当てる
const CATEGORY_FALLBACK_PRODUCTS: Partial<Record<string, AffiliateProduct>> = {
  "体づくり・怪我予防": {
    asin: "B09STY2JDQ",
    title: "Gruper フォームローラー 筋膜リリース グリッドフォームローラー",
    imageUrl: "https://m.media-amazon.com/images/I/51ouuxkhO4L._AC_SX679_.jpg",
  },
  "野球理論（科学的検証）": {
    asin: "B09STY2JDQ",
    title: "Gruper フォームローラー 筋膜リリース グリッドフォームローラー",
    imageUrl: "https://m.media-amazon.com/images/I/51ouuxkhO4L._AC_SX679_.jpg",
  },
};

// 楽天側でその記事にぴったりの商品が別途用意できた場合、テーマの合わないカテゴリ共通の
// フォームローラーが並んで表示されないよう、Amazon側のカテゴリフォールバックだけ無効にする
const SKIP_CATEGORY_FALLBACK = new Set(["injury-prevention-heatstroke"]);

export function getAffiliateProduct(slug: string, category?: string): AffiliateProduct | null {
  if (AFFILIATE_PRODUCTS[slug]) return AFFILIATE_PRODUCTS[slug];
  for (const [pattern, product] of PREFIX_FALLBACK_PRODUCTS) {
    if (pattern.test(slug)) return product;
  }
  if (SKIP_CATEGORY_FALLBACK.has(slug)) return null;
  if (category && CATEGORY_FALLBACK_PRODUCTS[category]) return CATEGORY_FALLBACK_PRODUCTS[category];
  return null;
}
