import type { DraftPickInput } from "../seed";

// 阪神タイガース 2021〜2025年ドラフト指名選手(支配下・育成)。
// NPB公式サイト(ドラフト結果・個人年度別成績)を一次情報とし、退団・移籍経緯等は
// 報道で補強してリサーチ(2026年8月13〜15日時点のスナップショット)。
export const picks: DraftPickInput[] = [
  { year: 2021, round: 1, playerName: "森木大智", position: "投手", previousAffiliation: "高知高", npbDebutMade: true, careerGames: 2, qualifiedSeasons: 0, titles: "", isActive: true, note: "2025年10月1日に阪神から戦力外通告。2026年1月23日、MLBパドレスとマイナー契約(現地シングルA球団所属)。" },
  { year: 2021, round: 2, playerName: "鈴木勇斗", position: "投手", previousAffiliation: "創価大学", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: false, note: "一軍出場歴なし。2025年10月1日戦力外通告。トライアウト経て2026年から社会人野球チーム「エコ・プラン」所属。" },
  { year: 2021, round: 3, playerName: "桐敷拓馬", position: "投手", previousAffiliation: "新潟医療福祉大学", npbDebutMade: true, careerGames: 165, qualifiedSeasons: 0, titles: "2024年最優秀中継ぎ投手、2024年オールスターゲーム(セ)選出", isActive: true, note: "通算165登板(2022-2026)。チームの主力左腕リリーバー。" },
  { year: 2021, round: 4, playerName: "前川右京", position: "外野手", previousAffiliation: "智辯学園高", npbDebutMade: true, careerGames: 265, qualifiedSeasons: 0, titles: "", isActive: true, note: "2024年に362打席を記録したが、NPB規定打席(約443打席)には未到達。規定打席到達シーズンはまだない。" },
  { year: 2021, round: 5, playerName: "岡留英貴", position: "投手", previousAffiliation: "亜細亜大学", npbDebutMade: true, careerGames: 53, qualifiedSeasons: 0, titles: "", isActive: true, note: "2024年は35試合登板・防御率2.84。2026年は一軍登板が確認できず。" },
  { year: 2021, round: 6, playerName: "豊田寛", position: "外野手", previousAffiliation: "日立製作所", npbDebutMade: true, careerGames: 49, qualifiedSeasons: 0, titles: "", isActive: true, note: "通算49試合(2022,2024,2025年)。出場機会は限定的。" },
  { year: 2021, round: 7, playerName: "中川勇斗", position: "捕手", previousAffiliation: "京都国際高", npbDebutMade: true, careerGames: 35, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年開幕スタメンを獲得するも10試合・打率.053で4月23日に登録抹消。" },
  { year: 2021, round: 1, isDevelopmental: true, playerName: "伊藤稜", position: "投手", previousAffiliation: "中京大学", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "入団後、左肩痛などで出遅れ。育成5年目(2026年)も一軍未出場が続く。" },

  { year: 2022, round: 1, playerName: "森下翔太", position: "外野手", previousAffiliation: "中央大学", npbDebutMade: true, careerGames: 469, qualifiedSeasons: 2, titles: "2025年ベストナイン、2025年ゴールデングラブ賞、2025年オールスターゲーム選出(ファン投票最多得票)", isActive: true, note: "2023年新人王は同期入団の村上頌樹が受賞(森下は次点)。2024・2025年は規定打席到達。チームの主力打者。" },
  { year: 2022, round: 2, playerName: "門別啓人", position: "投手", previousAffiliation: "東海大学付属札幌高", npbDebutMade: true, careerGames: 29, qualifiedSeasons: 0, titles: "", isActive: true, note: "通算3勝6敗、防御率4.28前後。左腕リリーフ・先発で起用。" },
  { year: 2022, round: 3, playerName: "井坪陽生", position: "外野手", previousAffiliation: "関東第一高", npbDebutMade: true, careerGames: 8, qualifiedSeasons: 0, titles: "", isActive: true, note: "一軍出場は通算8試合に留まる。二軍中心。" },
  { year: 2022, round: 4, playerName: "茨木秀俊", position: "投手", previousAffiliation: "帝京長岡高", npbDebutMade: true, careerGames: 5, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年に一軍初勝利。通算5登板。" },
  { year: 2022, round: 5, playerName: "戸井零士", position: "内野手", previousAffiliation: "天理高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。二軍中心。" },
  { year: 2022, round: 6, playerName: "富田蓮", position: "投手", previousAffiliation: "三菱自動車岡崎", npbDebutMade: true, careerGames: 52, qualifiedSeasons: 0, titles: "", isActive: true, note: "2024年は防御率0.76と好投。通算52登板。" },
  { year: 2022, round: 1, isDevelopmental: true, playerName: "野口恭佑", position: "外野手", previousAffiliation: "九州産業大学", npbDebutMade: true, careerGames: 26, qualifiedSeasons: 0, titles: "", isActive: true, note: "2024年に一軍26試合出場。2025年オフに阪神から戦力外、独立リーグ「くふうハヤテベンチャーズ静岡」へ移籍。" },

  { year: 2023, round: 1, playerName: "下村海翔", position: "投手", previousAffiliation: "青山学院大学", npbDebutMade: true, careerGames: 5, qualifiedSeasons: 0, titles: "", isActive: true, note: "2024年にトミー・ジョン手術。2025年はリハビリで一軍未出場。2026年に登板復帰(通算5登板)。" },
  { year: 2023, round: 2, playerName: "椎葉剛", position: "投手", previousAffiliation: "徳島インディゴソックス", npbDebutMade: true, careerGames: 7, qualifiedSeasons: 0, titles: "", isActive: true, note: "通算7登板。独立リーグ出身。" },
  { year: 2023, round: 3, playerName: "山田脩也", position: "内野手", previousAffiliation: "仙台育英学園高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。二軍では内野守備固め中心。" },
  { year: 2023, round: 4, playerName: "百﨑蒼生", position: "内野手", previousAffiliation: "東海大学付属熊本星翔高", npbDebutMade: true, careerGames: 2, qualifiedSeasons: 0, titles: "", isActive: true, note: "2025年8月に死球で頬骨骨折・手術。リハビリを経て2026年に一軍昇格(通算2試合)。" },
  { year: 2023, round: 5, playerName: "石黒佑弥", position: "投手", previousAffiliation: "JR西日本", npbDebutMade: true, careerGames: 24, qualifiedSeasons: 0, titles: "", isActive: true, note: "通算24登板、2026年8月時点で未勝利。" },
  { year: 2023, round: 6, playerName: "津田淳哉", position: "投手", previousAffiliation: "大阪経済大学", npbDebutMade: true, careerGames: 7, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年が一軍初年度。通算7登板。" },
  { year: 2023, round: 1, isDevelopmental: true, playerName: "松原快", position: "投手", previousAffiliation: "富山GRNサンダーバーズ", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。独立リーグ出身。" },
  { year: 2023, round: 2, isDevelopmental: true, playerName: "福島圭音", position: "外野手", previousAffiliation: "白鴎大学", npbDebutMade: true, careerGames: 60, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年3月31日に支配下登録。俊足が持ち味で二軍時代は盗塁数リーグトップクラス。" },

  { year: 2024, round: 1, playerName: "伊原陵人", position: "投手", previousAffiliation: "NTT西日本", npbDebutMade: true, careerGames: 35, qualifiedSeasons: 0, titles: "", isActive: true, note: "2025年ルーキーイヤーは28試合(17先発)で防御率2.29。通算8勝9敗、防御率2.55前後。" },
  { year: 2024, round: 2, playerName: "今朝丸裕喜", position: "投手", previousAffiliation: "報徳学園高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "高卒2年目、2026年8月時点で一軍出場歴なし。二軍中心。" },
  { year: 2024, round: 3, playerName: "木下里都", position: "投手", previousAffiliation: "KMGホールディングス", npbDebutMade: true, careerGames: 37, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年は26登板・防御率2.03前後と好投。通算37登板。" },
  { year: 2024, round: 4, playerName: "町田隼乙", position: "捕手", previousAffiliation: "埼玉武蔵ヒートベアーズ", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2025年二軍打率.031と苦戦。2026年8月時点で一軍出場歴なし。" },
  { year: 2024, round: 5, playerName: "佐野大陽", position: "内野手", previousAffiliation: "富山GRNサンダーバーズ", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。二軍で経験を積む段階。" },
  { year: 2024, round: 1, isDevelopmental: true, playerName: "工藤泰成", position: "投手", previousAffiliation: "徳島インディゴソックス", npbDebutMade: true, careerGames: 56, qualifiedSeasons: 0, titles: "", isActive: true, note: "育成出身選手として異例の開幕一軍入り(2026年、球団史上初と報じられた)。2026年8月に初セーブ。通算56登板。" },
  { year: 2024, round: 2, isDevelopmental: true, playerName: "嶋村麟士朗", position: "捕手", previousAffiliation: "高知ファイティングドッグス", npbDebutMade: true, careerGames: 30, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年3月に支配下契約。開幕スタメンで起用。通算30試合。" },
  { year: 2024, round: 3, isDevelopmental: true, playerName: "早川太貴", position: "投手", previousAffiliation: "くふうハヤテベンチャーズ静岡", npbDebutMade: true, careerGames: 12, qualifiedSeasons: 0, titles: "", isActive: true, note: "元市役所職員という異色の経歴。2025年育成入団後すぐ支配下登録され先発で2勝。2026年は苦戦(防御率9点台)。通算12登板。" },
  { year: 2024, round: 4, isDevelopmental: true, playerName: "川﨑俊哲", position: "内野手", previousAffiliation: "石川ミリオンスターズ", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },

  { year: 2025, round: 1, playerName: "立石正広", position: "内野手", previousAffiliation: "創価大学", npbDebutMade: true, careerGames: 32, qualifiedSeasons: 0, titles: "", isActive: true, note: "大学屈指の長距離砲として鳴り物入り。2026年に一軍デビューし通算32試合・打率.198。" },
  { year: 2025, round: 2, playerName: "谷端将伍", position: "内野手", previousAffiliation: "日本大学", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。" },
  { year: 2025, round: 3, playerName: "岡城快生", position: "外野手", previousAffiliation: "筑波大学", npbDebutMade: true, careerGames: 14, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年4月29日に一軍初先発・初安打。通算14試合。" },
  { year: 2025, round: 4, playerName: "早瀬朔", position: "投手", previousAffiliation: "神村学園高", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "2026年8月時点で一軍出場歴なし。制球力が売り。" },
  { year: 2025, round: 5, playerName: "能登嵩都", position: "投手", previousAffiliation: "オイシックス新潟アルビレックス・ベースボール・クラブ", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "独立リーグ(イースタン)で4冠を達成しての入団。2026年8月時点で一軍出場歴なし。" },
  { year: 2025, round: 1, isDevelopmental: true, playerName: "神宮僚介", position: "投手", previousAffiliation: "東京農業大学北海道オホーツク", npbDebutMade: true, careerGames: 1, qualifiedSeasons: 0, titles: "", isActive: true, note: "大学3年時にトミー・ジョン手術を経験。2026年8月5日、対DeNA戦(横浜スタジアム)でプロ初登板・1回無失点。" },
  { year: 2025, round: 2, isDevelopmental: true, playerName: "山﨑照英", position: "外野手", previousAffiliation: "兵庫ブレイバーズ", npbDebutMade: false, careerGames: 0, qualifiedSeasons: 0, titles: "", isActive: true, note: "関西独立リーグで盗塁王2年連続。2026年8月時点で一軍出場歴なし。" },
];
