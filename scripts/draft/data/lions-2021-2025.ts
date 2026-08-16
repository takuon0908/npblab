import type { DraftPickInput } from "../seed";

// 埼玉西武ライオンズ 2021〜2025年ドラフト指名選手(支配下・育成)。
// NPB公式サイト(ドラフト結果・個人年度別成績)を一次情報とし、退団・移籍・トレード・戦力外等の経緯は
// 報道で補強してリサーチ(2026年8月16日時点のスナップショット)。
export const picks: DraftPickInput[] = [
  { year: 2021, round: 1, playerName: "隅田知一郎", position: "投手", previousAffiliation: "西日本工業大学", npbDebutMade: true, careerGames: 105, qualifiedSeasons: 2, titles: "2025年マイナビオールスターゲーム(監督選抜)選出、2025年3・4月度月間MVP、侍ジャパン代表選出(2023年APBC優勝、2024年プレミア12準優勝、2026年WBC)", isActive: true, note: "2024・2025年に規定投球回到達。エース左腕として日本代表にも複数回選出されている。通算105登板、36勝46敗。" },
  { year: 2021, round: 2, playerName: "佐藤隼輔", position: "投手", previousAffiliation: "筑波大学", npbDebutMade: true, careerGames: 147, qualifiedSeasons: 0, titles: "", isActive: true, note: "左腕リリーバーとして通算147登板だが規定投球回には未到達。通算9勝10敗1セーブ。" },
  { year: 2021, round: 3, playerName: "古賀悠斗", position: "捕手", previousAffiliation: "中央大学", npbDebutMade: true, careerGames: 423, qualifiedSeasons: 0, titles: "", isActive: true, note: "2023年以降は正捕手格として出場を重ねるが、規定打席(最多で328打席)には未到達。2026年は打率.280まで打撃成績が向上。" },
  { year: 2021, round: 4, playerName: "羽田慎之介", position: "投手", previousAffiliation: "八王子学園八王子高", npbDebutMade: true, careerGames: 41, qualifiedSeasons: 0, titles: "", isActive: true, note: "高卒左腕。2024年に一軍デビューし、通算41登板・3勝5敗。" },
  { year: 2021, round: 5, playerName: "黒田将矢", position: "投手", previousAffiliation: "八戸工業大学第一高", npbDebutMade: true, careerGames: 37, qualifiedSeasons: 0, titles: "", isActive: true, note: "2025年に一軍デビュー。2026年は登板数が増え、通算2勝0敗。" },
  { year: 2021, round: 6, playerName: "中山誠吾", position: "内野手", previousAffiliation: "白鴎大学", npbDebutMade: true, careerGames: 1, qualifiedSeasons: 0, titles: "", isActive: false, note: "2022年に一軍1試合(3打数無安打)に出場したのみ。その後戦力外通告を受けて現役を引退し、球団職員に転身した。" },

  { year: 2021, round: 1, isDevelopmental: true, playerName: "古市尊", position: "捕手", previousAffiliation: "徳島インディゴソックス", npbDebutMade: true, careerGames: 53, qualifiedSeasons: 0, titles: "", isActive: true, note: "2023年に支配下登録。2026年1月、桑原将志のFA移籍に伴う人的補償で横浜DeNAへ移籍した。通算53試合(西武45、DeNA8)。" },
  { year: 2021, round: 2, isDevelopmental: true, playerName: "滝澤夏央", position: "内野手", previousAffiliation: "関根学園高", npbDebutMade: true, careerGames: 356, qualifiedSeasons: 0, titles: "2025年マイナビオールスターゲーム選出(育成ドラフト出身野手として球団史上初)", isActive: true, note: "遊撃・二塁の主力として攻守にフル回転。規定打席は最多438打席(2025年)で未到達だが、二軍出身選手として着実に台頭した。" },
  { year: 2021, round: 3, isDevelopmental: true, playerName: "菅井信也", position: "投手", previousAffiliation: "山本学園高", npbDebutMade: true, careerGames: 26, qualifiedSeasons: 0, titles: "", isActive: true, note: "2025年に開幕先発ローテーション入り。通算26登板、8勝9敗。" },
  { year: 2021, round: 4, isDevelopmental: true, playerName: "川村啓真", position: "外野手", previousAffiliation: "國學院大学", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: false, note: "入団1年目の2022年6月、本人からの申し出により自由契約。一軍出場歴はなく、二軍では31試合に出場した。" },

  { year: 2022, round: 1, playerName: "蛭間拓哉", position: "外野手", previousAffiliation: "早稲田大学", npbDebutMade: true, careerGames: 154, qualifiedSeasons: 0, titles: "", isActive: true, note: "外野手の1位指名は球団史上52年ぶりだった。2023年に56試合出場したが、その後は故障もあり出場機会に苦しんでいる。通算154試合。" },
  { year: 2022, round: 2, playerName: "古川雄大", position: "外野手", previousAffiliation: "佐伯鶴城高", npbDebutMade: true, careerGames: 5, qualifiedSeasons: 0, titles: "", isActive: true, note: "一軍出場は通算5試合に留まる。二軍で経験を積む段階。" },
  { year: 2022, round: 3, playerName: "野田海人", position: "捕手", previousAffiliation: "九州国際大学付属高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2022, round: 4, playerName: "青山美夏人", position: "投手", previousAffiliation: "亜細亜大学", npbDebutMade: true, careerGames: 49, qualifiedSeasons: 0, titles: "", isActive: true, note: "2023年はルーキーながら39試合に登板したが、その後は右肩の不調もあり登板機会が減少。通算49登板、1勝5敗3セーブ。" },
  { year: 2022, round: 5, playerName: "山田陽翔", position: "投手", previousAffiliation: "近江高", npbDebutMade: true, careerGames: 53, qualifiedSeasons: 0, titles: "", isActive: true, note: "2025年に49試合登板・防御率2.08と大きく飛躍。通算53登板。" },
  { year: 2022, round: 6, playerName: "児玉亮涼", position: "内野手", previousAffiliation: "大阪ガス", npbDebutMade: true, careerGames: 155, qualifiedSeasons: 0, titles: "", isActive: true, note: "2023年から出場機会を積み重ね、通算155試合に出場。内野の控えとして起用される。" },

  { year: 2022, round: 1, isDevelopmental: true, playerName: "野村和輝", position: "内野手", previousAffiliation: "石川ミリオンスターズ", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: false, note: "一軍出場歴なし。二軍でも出場機会は限定的で、2025年10月に戦力外通告を受け、同年12月に現役引退を表明した。" },
  { year: 2022, round: 2, isDevelopmental: true, playerName: "日隈モンテル", position: "外野手", previousAffiliation: "徳島インディゴソックス", npbDebutMade: true, careerGames: 55, qualifiedSeasons: 0, titles: "", isActive: true, note: "2025年に西武で一軍デビューしたが結果を残せず、2026年は育成選手として東京ヤクルトへ移籍。同年に支配下復帰し出場機会を増やしている。通算55試合(西武12、ヤクルト43)。" },
  { year: 2022, round: 3, isDevelopmental: true, playerName: "三浦大輝", position: "投手", previousAffiliation: "中京大学", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2022, round: 4, isDevelopmental: true, playerName: "是澤涼輔", position: "捕手", previousAffiliation: "法政大学", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "長く育成選手として二軍で経験を積み、2026年7月31日に支配下選手契約を締結。2026年8月時点で一軍出場歴はまだない。" },

  { year: 2023, round: 1, playerName: "武内夏暉", position: "投手", previousAffiliation: "國學院大學", npbDebutMade: true, careerGames: 50, qualifiedSeasons: 1, titles: "2024年パ・リーグ新人王", isActive: true, note: "デビュー年の2024年に規定投球回へ到達し新人王を獲得。2025年は左肘の不調などで登板が減ったが、2026年は先発陣に復帰。通算50登板、22勝17敗。" },
  { year: 2023, round: 2, playerName: "上田大河", position: "投手", previousAffiliation: "大阪商業大学", npbDebutMade: true, careerGames: 35, qualifiedSeasons: 0, titles: "", isActive: true, note: "2024年から一軍で登板を重ね、通算35登板、2勝3敗。" },
  { year: 2023, round: 3, playerName: "杉山遙希", position: "投手", previousAffiliation: "横浜高", npbDebutMade: true, careerGames: 2, qualifiedSeasons: 0, titles: "", isActive: true, note: "2024年、2025年にそれぞれ1試合ずつ登板し、いずれも敗戦投手。通算2登板。" },
  { year: 2023, round: 4, playerName: "成田晴風", position: "投手", previousAffiliation: "弘前工業高", npbDebutMade: true, careerGames: 2, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年に一軍デビュー。通算2登板。" },
  { year: 2023, round: 5, playerName: "宮澤太成", position: "投手", previousAffiliation: "徳島インディゴソックス", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2024年10月に一度戦力外通告を受けたが、育成選手として再契約し在籍を継続。2026年8月時点で一軍出場歴なし。" },
  { year: 2023, round: 6, playerName: "村田怜音", position: "内野手", previousAffiliation: "皇學館大学", npbDebutMade: true, careerGames: 31, qualifiedSeasons: 0, titles: "", isActive: true, note: "2025年に一軍合流し、同年8月にプロ初本塁打。通算31試合。" },
  { year: 2023, round: 7, playerName: "糸川亮太", position: "投手", previousAffiliation: "ENEOS", npbDebutMade: true, careerGames: 26, qualifiedSeasons: 0, titles: "", isActive: true, note: "社会人出身のリリーフ右腕。通算26登板だが、2026年8月時点でまだ未勝利(0勝3敗)。" },

  { year: 2023, round: 1, isDevelopmental: true, playerName: "シンクレア ジョセフ 孝ノ助", position: "投手", previousAffiliation: "徳島インディゴソックス", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "カナダ出身の長身左腕。2026年8月時点で一軍出場歴なし。" },
  { year: 2023, round: 2, isDevelopmental: true, playerName: "谷口朝陽", position: "内野手", previousAffiliation: "徳島インディゴソックス", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2023, round: 3, isDevelopmental: true, playerName: "川下将勲", position: "投手", previousAffiliation: "函館大有斗高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2023, round: 4, isDevelopmental: true, playerName: "金子功児", position: "内野手", previousAffiliation: "埼玉武蔵ヒートベアーズ", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2023, round: 5, isDevelopmental: true, playerName: "木瀬翔太", position: "投手", previousAffiliation: "北嵯峨高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2023, round: 6, isDevelopmental: true, playerName: "奥村光一", position: "外野手", previousAffiliation: "群馬ダイヤモンドペガサス", npbDebutMade: true, careerGames: 45, qualifiedSeasons: 0, titles: "", isActive: true, note: "2024年に一軍45試合に出場したが打率.177と苦戦。2025年終盤に戦力外通告を受けたが、年俸を下げた育成契約で残留した。" },

  { year: 2024, round: 1, playerName: "齋藤大翔", position: "内野手", previousAffiliation: "金沢高", npbDebutMade: true, careerGames: 4, qualifiedSeasons: 0, titles: "", isActive: true, note: "高卒新人。2025年は右肩の違和感で出遅れたが、シーズン終盤に一軍デビューしプロ初安打を記録。通算4試合。" },
  { year: 2024, round: 2, playerName: "渡部聖弥", position: "外野手", previousAffiliation: "大阪商業大学", npbDebutMade: true, careerGames: 211, qualifiedSeasons: 1, titles: "", isActive: true, note: "2025年にルーキーながら規定打席へ到達(球団新人では2017年以来)。同年チーム2位の12本塁打を放った。通算211試合。" },
  { year: 2024, round: 3, playerName: "狩生聖真", position: "投手", previousAffiliation: "佐伯鶴城高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2024, round: 4, playerName: "林冠臣", position: "外野手", previousAffiliation: "日本経済大学", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2024, round: 5, playerName: "篠原響", position: "投手", previousAffiliation: "福井工業大学附属福井高", npbDebutMade: true, careerGames: 35, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年にセットアッパーとして台頭し、33試合登板・23ホールド・初セーブを記録。最速158km/hの直球が武器。通算35登板。" },
  { year: 2024, round: 6, playerName: "龍山暖", position: "捕手", previousAffiliation: "エナジックスポーツ高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2024, round: 7, playerName: "古賀輝希", position: "内野手", previousAffiliation: "千曲川硬式野球クラブ", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "1年目はコンディション不良もあり二軍16試合出場に終わり、オフに育成選手契約へ切り替えた。2026年8月時点で一軍出場歴なし。" },

  { year: 2024, round: 1, isDevelopmental: true, playerName: "冨士大和", position: "投手", previousAffiliation: "大宮東高", npbDebutMade: true, careerGames: 2, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年3月に支配下選手契約を締結。通算2登板。" },
  { year: 2024, round: 2, isDevelopmental: true, playerName: "佐藤太陽", position: "内野手", previousAffiliation: "神奈川大学", npbDebutMade: true, careerGames: 21, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年4月にプロ初本塁打。通算21試合。" },
  { year: 2024, round: 3, isDevelopmental: true, playerName: "ラタナヤケ・ラマル・ギービン", position: "外野手", previousAffiliation: "大阪桐蔭高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2024, round: 4, isDevelopmental: true, playerName: "佐藤爽", position: "投手", previousAffiliation: "星槎道都大学", npbDebutMade: true, careerGames: 6, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年に一軍初勝利を含む6登板(防御率4.18)を記録するも、同年8月に登録抹消された。" },
  { year: 2024, round: 5, isDevelopmental: true, playerName: "澤田遥斗", position: "外野手", previousAffiliation: "京都国際高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2024, round: 6, isDevelopmental: true, playerName: "福尾遥真", position: "内野手", previousAffiliation: "学法石川高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2024, round: 7, isDevelopmental: true, playerName: "ウメビンユオ・オケム明", position: "外野手", previousAffiliation: "旭川志峯高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },

  { year: 2025, round: 1, playerName: "小島大河", position: "捕手", previousAffiliation: "明治大学", npbDebutMade: true, careerGames: 66, qualifiedSeasons: 0, titles: "", isActive: true, note: "ルーキーながら開幕一軍入りを果たし、66試合に出場。東海大相模高でのセンバツ優勝や明大でのベストナイン受賞歴を持つ。" },
  { year: 2025, round: 2, playerName: "岩城颯空", position: "投手", previousAffiliation: "中央大学", npbDebutMade: true, careerGames: 31, qualifiedSeasons: 0, titles: "", isActive: true, note: "新人ながら守護神に定着し、31試合登板・18セーブ(2026年8月時点)。開幕戦では新人史上7人目となるプロ初登板・初セーブを記録した。" },
  { year: 2025, round: 3, playerName: "秋山俊", position: "外野手", previousAffiliation: "中京大学", npbDebutMade: true, careerGames: 5, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年4月に一軍初出場・初安打。通算5試合。" },
  { year: 2025, round: 4, playerName: "堀越啓太", position: "投手", previousAffiliation: "東北福祉大学", npbDebutMade: true, careerGames: 2, qualifiedSeasons: 0, titles: "", isActive: true, note: "力のあるストレートが武器の新人右腕。通算2登板。" },
  { year: 2025, round: 5, playerName: "横田蒼和", position: "内野手", previousAffiliation: "山村学園高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "高卒新人。フレッシュオールスターに選出されたが、2026年8月時点で一軍出場歴なし。" },
  { year: 2025, round: 6, playerName: "川田悠慎", position: "外野手", previousAffiliation: "四国銀行", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "四国銀行からの指名は球団史上54年ぶり。2026年8月時点で一軍出場歴なし。" },

  { year: 2025, round: 1, isDevelopmental: true, playerName: "新井唯斗", position: "内野手", previousAffiliation: "八王子学園八王子高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2025, round: 2, isDevelopmental: true, playerName: "今岡拓夢", position: "内野手", previousAffiliation: "神村学園高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2025, round: 3, isDevelopmental: true, playerName: "斎藤佳紳", position: "投手", previousAffiliation: "徳島インディゴソックス", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "前所属の四国アイランドリーグplusで最優秀防御率・最多勝利を獲得しての入団。2026年8月時点で一軍出場歴なし。" },
  { year: 2025, round: 4, isDevelopmental: true, playerName: "濱岡蒼太", position: "投手", previousAffiliation: "川和高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2025, round: 5, isDevelopmental: true, playerName: "平口寛人", position: "投手", previousAffiliation: "日本経済大学", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2025, round: 6, isDevelopmental: true, playerName: "正木悠馬", position: "投手", previousAffiliation: "上智大学", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2025, round: 7, isDevelopmental: true, playerName: "安藤銀杜", position: "外野手", previousAffiliation: "徳島インディゴソックス", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "独立リーグでは投手だったが野手転向で入団。三軍では長打力を発揮している。2026年8月時点で一軍出場歴なし。" },
];
