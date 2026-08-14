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

  // 用具選びシリーズ(元はAmazon商品を紹介していたが、実勢価格が表示できる楽天検索APIに一本化した)
  "gear-guide-glove": {
    title: "久保田スラッガー 少年軟式用グローブ KSN-J7 内野・オールラウンド用",
    price: "15,000円（税込、送料無料）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/yumomi/cabinet/04746979/11739868/ksn-j7.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00s6fjn.zuxm7e0a.g00s6fjn.zuxm85e4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fyumomi%2Fks17-ksnj7%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fyumomi%2Fi%2F10000216%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  "gear-guide-glove-care": {
    title: "ミズノ グラブお手入れセット レザーローション＆ストロングオイル",
    price: "2,130円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/tai-spo/cabinet/2024-7-8-9/1gjyg50300.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00qgz5n.zuxm7529.g00qgz5n.zuxm8a71/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Ftai-spo%2F1gjyg50300%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Ftai-spo%2Fi%2F10063348%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  "gear-guide-bat": {
    title: "ヴィクタス(Victus) VIBE 少年軟式用金属バット ジュニア",
    price: "14,080円（税込、送料無料）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/bbtown/cabinet/gekiyasu80/vjjsbbvibj2.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00puy0n.zuxm72dd.g00puy0n.zuxm88fb/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbbtown%2Fvjjsbbvibj%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fbbtown%2Fi%2F10244876%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  "gear-guide-spikes": {
    title: "ミズノ(MIZUNO) クッションレボダイア Jr. ジュニア用野球スパイク ローカット",
    price: "6,446円（税込、送料無料）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/bbtown/cabinet/gekiyasu85/11gp2527.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00puy0n.zuxm72dd.g00puy0n.zuxm88fb/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbbtown%2F11gp1925%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fbbtown%2Fi%2F10130903%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  "gear-guide-starter-kit": {
    title: "ミズノ(MIZUNO) 野球リュック Jr. 23L バット収納可 ジュニア用デイパック",
    price: "5,456円（税込、送料無料）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/bbtown/cabinet/gekiyasu90/1fjdc050.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00puy0n.zuxm72dd.g00puy0n.zuxm88fb/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbbtown%2F65m1fjd6025%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fbbtown%2Fi%2F10086965%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  "gear-guide-batting-gloves": {
    title: "ミズノ(MIZUNO) WILL DRIVE RED 3D CUT ジュニア用バッティンググローブ 両手用",
    price: "2,618円（税込、送料無料）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/bbtown/cabinet/23ss_t_mizuno/1ejey240.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00puy0n.zuxm72dd.g00puy0n.zuxm88fb/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbbtown%2F1ejey240%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fbbtown%2Fi%2F10226535%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  "gear-guide-catcher-gear": {
    title: "久保田スラッガー 少年軟式用キャッチャー防具4点セット(マスク・プロテクター・レガーツ・スロートガード)",
    price: "33,000円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/standin/cabinet/hpyg41/kbt-jrcatcherset.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00scntn.zuxm7f5a.g00scntn.zuxm81b3/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fstandin%2Fkbt-jrcatcherset%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fstandin%2Fi%2F10044000%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  "gear-guide-training-equipment": {
    title: "フィールドフォース公式 硬式・軟式兼用トスマシン FTM-242",
    price: "24,200円（税込）",
    imageUrl:
      "https://thumbnail.image.rakuten.co.jp/@0_mall/fieldforce/cabinet/10421366/11268158/imgrc0103105035.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00uk9sn.zuxm7568.g00uk9sn.zuxm836b/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Ffieldforce%2F121941%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Ffieldforce%2Fi%2F10000312%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
};

// スラッグの完全一致が無い場合に、プレフィックスから当てはめるフォールバック商品
const PREFIX_FALLBACK_PRODUCTS: [RegExp, RakutenProduct][] = [
  [
    /^rules-basics-/,
    {
      title: "公認野球規則2026(日本プロフェッショナル野球組織 編)",
      price: "1,100円（税込）",
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/8017/9784583118017_1_4.jpg?_ex=400x400",
      affiliateUrl:
        "https://hb.afl.rakuten.co.jp/hgc/g00q072n.zuxm7d57.g00q072n.zuxm8e26/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbook%2F18539524%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fbook%2Fi%2F21878783%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
    },
  ],
];

// スラッグの完全一致もプレフィックスも無い場合、記事のカテゴリからフォールバックする商品
const CATEGORY_FALLBACK_PRODUCTS: Partial<Record<string, RakutenProduct>> = {
  "体づくり・怪我予防": {
    title: "Gruper フォームローラー2in1 筋膜リリース グリッドローラー",
    price: "1,980円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/lively777/cabinet/uyjiazhu/2025/2025top.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00to08n.zuxm7e9b.g00to08n.zuxm813c/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Flively777%2Fformroller%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Flively777%2Fi%2F10000143%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
};

export function getRakutenProduct(slug: string, category?: string): RakutenProduct | null {
  if (RAKUTEN_PRODUCTS[slug]) return RAKUTEN_PRODUCTS[slug];
  for (const [pattern, product] of PREFIX_FALLBACK_PRODUCTS) {
    if (pattern.test(slug)) return product;
  }
  if (category && CATEGORY_FALLBACK_PRODUCTS[category]) return CATEGORY_FALLBACK_PRODUCTS[category];
  return null;
}
