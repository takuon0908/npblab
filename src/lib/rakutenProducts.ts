// コラム記事(slug)ごとに紹介している楽天市場の商品(アフィリエイトリンク付き)。
// CEOが楽天アフィリエイトの「商品リンク作成」で発行したリンクから、サイトのデザインに
// 合わせたカードとして描画するために必要な情報だけを抜き出して保持する
export interface RakutenProduct {
  title: string;
  price: string;
  imageUrl: string;
  affiliateUrl: string;
}

export const RAKUTEN_PRODUCTS: Record<string, RakutenProduct> = {
  "gear-guide-sun-glare": {
    title: "アイブラック 野球 シール ローリングス 日差し・反射対策 12セット(24枚入り) EB-12",
    price: "770円〜（税込、送料無料）",
    imageUrl:
      "https://thumbnail.image.rakuten.co.jp/@0_mall/sportsshop-you/cabinet/imgrc0146871109.jpg?_ex=240x240",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/567bbeff.e75f3884.567bbf00.ea618371/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fsportsshop-you%2Feb12%2F&link_type=picttext&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJwaWN0dGV4dCIsInNpemUiOiIyNDB4MjQwIiwibmFtIjoxLCJuYW1wIjoicmlnaHQiLCJjb20iOjEsImNvbXAiOiJkb3duIiwicHJpY2UiOjEsImJvciI6MSwiY29sIjoxLCJiYnRuIjoxLCJwcm9kIjowLCJhbXAiOmZhbHNlfQ%3D%3D",
  },
};

export function getRakutenProduct(slug: string): RakutenProduct | null {
  return RAKUTEN_PRODUCTS[slug] ?? null;
}
