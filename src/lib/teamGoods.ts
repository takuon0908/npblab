import type { RakutenProduct } from "./rakutenProducts";

// 球団ページに表示する「応援グッズ」の楽天商品。球団ごとに手動で選定している
// (楽天のキーワード検索を球団名でそのまま自動化すると、特定選手の背番号入りグッズ
// ばかりヒットしたり[トレード・引退で陳腐化するリスク]、ふるさと納税の返礼品が
// 混ざったり[商品ではなく寄付なので性質が違う]するため、公式・公認ライセンス品で
// 選手名に依存しないアイテムのみを1球団ずつ確認して採用した。2026年8月選定)
export const TEAM_GOODS: Partial<Record<string, RakutenProduct>> = {
  baystars: {
    title: "横浜DeNAベイスターズ 公式ライセンス 本革レザーベルト",
    price: "2,189円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/rankutsudou/cabinet/a/520-irs-dba.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00qrx5n.zuxm7539.g00qrx5n.zuxm83c4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Frankutsudou%2F520-irsn3%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Frankutsudou%2Fi%2F10009748%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  buffaloes: {
    title: "オリックス・バファローズ 公式公認 ラウンド長財布",
    price: "4,180円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/felishshop/cabinet/07267511/10783643/imgrc0097536342.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00tq24n.zuxm7c92.g00tq24n.zuxm837a/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Ffelishshop%2Fob16-11%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Ffelishshop%2Fi%2F10000495%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  carp: {
    title: "広島東洋カープ オフィシャル承認 のびのびマフラータオル",
    price: "1,800円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/urakami-futon/cabinet/biiino/item/main-image-2/20230608181104_1.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00s1bsn.zuxm7d10.g00s1bsn.zuxm846b/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Furakami-futon%2Fcarp-nobi-tk%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Furakami-futon%2Fi%2F10001350%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  dragons: {
    title: "中日ドラゴンズ公式 あしもとネット付き観戦クッション",
    price: "2,420円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/skp-shop/cabinet/ashimoto_bag/chunichi/imgrc0116996637.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00ul56n.zuxm7e47.g00ul56n.zuxm80fc/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fskp-shop%2Fashimoto_chunichi%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fskp-shop%2Fi%2F10000064%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  eagles: {
    title: "楽天イーグルス承認 アイブラック(6枚入・転写式)",
    price: "1,100円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/printac7115/cabinet/13152390/13152394/ree1-1.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00t5ttn.zuxm75b4.g00t5ttn.zuxm814a/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fprintac7115%2Free1%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fprintac7115%2Fi%2F10002136%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  fighters: {
    title: "北海道日本ハムファイターズ公式 チームロゴ スマホケース",
    price: "4,980円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/caseplay-r/cabinet/bc/thumb2/cl11c0001d000161-11.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00uokjn.zuxm79a4.g00uokjn.zuxm8229/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fcaseplay-r%2Fcl11c0001d000161-11%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fcaseplay-r%2Fi%2F10000562%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  giants: {
    title: "読売ジャイアンツ公式公認 リール付きパスケース",
    price: "2,750円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/felishshop/cabinet/07267511/07527105/07527110/imgrc0071401727.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00tq24n.zuxm7c92.g00tq24n.zuxm837a/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Ffelishshop%2Fyg3-10bc%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Ffelishshop%2Fi%2F10000186%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  hawks: {
    title: "福岡ソフトバンクホークス公式公認 コインケース(マルチケース)",
    price: "1,200円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/felishshop/cabinet/07267511/08960735/imgrc0078297665.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00tq24n.zuxm7c92.g00tq24n.zuxm837a/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Ffelishshop%2Fsh1%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Ffelishshop%2Fi%2F10000322%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  lions: {
    title: "埼玉西武ライオンズ公式グッズ 軟式野球用グローブ(12インチ)",
    price: "3,630円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/niku-niku/cabinet/05620890/5862001.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00rw0rn.zuxm70b2.g00rw0rn.zuxm8a91/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fniku-niku%2F58620%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fniku-niku%2Fi%2F10025388%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  marines: {
    title: "千葉ロッテマリーンズ グッズ 冷感ハット(熱中症対策)",
    price: "4,620円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/appbankstore/cabinet/06043552/10847943/13232196/imgrc0115951578.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00t4dsn.zuxm74a2.g00t4dsn.zuxm88bd/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fappbankstore%2F4573101108976%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fappbankstore%2Fi%2F10012322%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  swallows: {
    title: "東京ヤクルトスワローズ ニューエラ 59FIFTY キャップ",
    price: "7,150円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/auc-elehelm-hatstore/cabinet/item/107/12746961.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00rc5hn.zuxm7bdb.g00rc5hn.zuxm852a/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fauc-elehelm-hatstore%2F12746961%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Fauc-elehelm-hatstore%2Fi%2F10023634%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
  tigers: {
    title: "阪神タイガース公式公認 リール付きキー＆パスケース",
    price: "3,190円（税込）",
    imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/felishshop/cabinet/07267511/10006585/imgrc0094700451.jpg?_ex=400x400",
    affiliateUrl:
      "https://hb.afl.rakuten.co.jp/hgc/g00tq24n.zuxm7c92.g00tq24n.zuxm837a/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Ffelishshop%2Fht22-10%2F&m=http%3A%2F%2Fm.rakuten.co.jp%2Ffelishshop%2Fi%2F10000435%2F&rafcid=wsc_i_is_aae3259c-1d0c-4997-b2e4-5d50511c7c9d",
  },
};

export function getTeamGoods(teamSlug: string): RakutenProduct | null {
  return TEAM_GOODS[teamSlug] ?? null;
}
