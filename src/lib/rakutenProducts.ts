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
      "https://thumbnail.image.rakuten.co.jp/@0_mall/sportsshop-you/cabinet/imgrc0146871109.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/567bbeff.e75f3884.567bbf00.ea618371/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fsportsshop-you%2Feb12%2F&link_type=picttext&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJwaWN0dGV4dCIsInNpemUiOiIyNDB4MjQwIiwibmFtIjoxLCJuYW1wIjoicmlnaHQiLCJjb20iOjEsImNvbXAiOiJkb3duIiwicHJpY2UiOjEsImJvciI6MSwiY29sIjoxLCJiYnRuIjoxLCJwcm9kIjowLCJhbXAiOmZhbHNlfQ%3D%3D",
  },
  "injury-prevention-heatstroke": {
    title: "経口補水パウダー W-AID(ダブルエイド) 5g×10包 五洲薬品 熱中症対策・電解質補給",
    price: "1,000円（税込）",
    imageUrl:
      "https://thumbnail.image.rakuten.co.jp/@0_mall/ettyutoyama-genkidou/cabinet/shohin_01/syouhin202206/waid10_1new.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00srexn.zuxm7654.g00srexn.zuxm8c8e/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fettyutoyama-genkidou%2F10000812%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fettyutoyama-genkidou%2Fi%2F10000812%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  "pitching-velocity-training": {
    title: "マルチウェイトボール9 加重トレーニングボール 約85g〜340g(3oz〜12oz) 球速アップ",
    price: "5,687円（税込）",
    imageUrl:
      "https://thumbnail.image.rakuten.co.jp/@0_mall/bbtown/cabinet/gekiyasu84/imgrc0106119431.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00puy0n.zuxm72dd.g00puy0n.zuxm88fb/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbbtown%2Fbbch-mlwball9%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fbbtown%2Fi%2F10261275%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  "injury-prevention-warmup-cooldown": {
    title: "氷嚢 アイシングバッグ 看護師監修 2個セット クーリング・冷却",
    price: "980円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/beefine/cabinet/01a-2.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00ubnan.zuxm7064.g00ubnan.zuxm80c8/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbeefine%2Fc0166%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fbeefine%2Fi%2F10000173%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
};

export function getRakutenProduct(slug: string): RakutenProduct | null {
  return RAKUTEN_PRODUCTS[slug] ?? null;
}
