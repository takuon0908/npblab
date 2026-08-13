// コラム記事(slug)ごとに紹介しているAmazon商品。
// microCMSのリッチテキストフィールドは<img>タグとclass属性を保存時に取り除いてしまうため、
// 商品画像カードはこのマップを見て記事ページ側(React)で描画する。
//
// 2026年8月、商品紹介は楽天市場商品検索API経由(実勢価格を表示できる)に一本化したため、
// このマップは意図的に空にしてある。個別記事の本文に既にAmazonリンクが埋め込まれている
// 記事(gear-guide-*の一部)はそちらが優先されるため影響を受けない。将来Amazon商品を
// 個別に追加したくなった場合はここに追記すればよい(仕組み自体は残してある)。
export interface AffiliateProduct {
  asin: string;
  title: string;
  imageUrl: string;
}

export const AFFILIATE_PRODUCTS: Record<string, AffiliateProduct> = {};

// スラッグの完全一致が無い場合に、プレフィックスから当てはめるフォールバック商品
const PREFIX_FALLBACK_PRODUCTS: [RegExp, AffiliateProduct][] = [];

// スラッグの完全一致もプレフィックスも無い場合、記事のカテゴリからフォールバックする商品
const CATEGORY_FALLBACK_PRODUCTS: Partial<Record<string, AffiliateProduct>> = {};

export function getAffiliateProduct(slug: string, category?: string): AffiliateProduct | null {
  if (AFFILIATE_PRODUCTS[slug]) return AFFILIATE_PRODUCTS[slug];
  for (const [pattern, product] of PREFIX_FALLBACK_PRODUCTS) {
    if (pattern.test(slug)) return product;
  }
  if (category && CATEGORY_FALLBACK_PRODUCTS[category]) return CATEGORY_FALLBACK_PRODUCTS[category];
  return null;
}
