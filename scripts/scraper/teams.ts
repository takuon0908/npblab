// NPB12球団のマスタデータ。npb.jpのページ間で表記が異なる（正式名称／1文字略称／URLコード）ため
// スクレイパー側で吸収する

export interface TeamMaster {
  slug: string;
  name: string; // npb.jpの正式名称（順位表・試合日程ページのimg altと一致）
  league: "central" | "pacific";
  kanjiAbbr: string; // リーダーズページの選手名末尾 "(神)" 等に使われる1文字略称
  urlCode: string; // 個人成績ページのURL（idb1_g.html等）に使われるチームコード
}

export const TEAMS: TeamMaster[] = [
  { slug: "tigers", name: "阪神タイガース", league: "central", kanjiAbbr: "神", urlCode: "t" },
  { slug: "giants", name: "読売ジャイアンツ", league: "central", kanjiAbbr: "巨", urlCode: "g" },
  { slug: "baystars", name: "横浜DeNAベイスターズ", league: "central", kanjiAbbr: "デ", urlCode: "db" },
  { slug: "dragons", name: "中日ドラゴンズ", league: "central", kanjiAbbr: "中", urlCode: "d" },
  { slug: "carp", name: "広島東洋カープ", league: "central", kanjiAbbr: "広", urlCode: "c" },
  { slug: "swallows", name: "東京ヤクルトスワローズ", league: "central", kanjiAbbr: "ヤ", urlCode: "s" },
  { slug: "hawks", name: "福岡ソフトバンクホークス", league: "pacific", kanjiAbbr: "ソ", urlCode: "h" },
  { slug: "fighters", name: "北海道日本ハムファイターズ", league: "pacific", kanjiAbbr: "日", urlCode: "f" },
  { slug: "buffaloes", name: "オリックス・バファローズ", league: "pacific", kanjiAbbr: "オ", urlCode: "b" },
  { slug: "eagles", name: "東北楽天ゴールデンイーグルス", league: "pacific", kanjiAbbr: "楽", urlCode: "e" },
  { slug: "lions", name: "埼玉西武ライオンズ", league: "pacific", kanjiAbbr: "西", urlCode: "l" },
  { slug: "marines", name: "千葉ロッテマリーンズ", league: "pacific", kanjiAbbr: "ロ", urlCode: "m" },
];

export function findTeamByName(name: string): TeamMaster | undefined {
  return TEAMS.find((t) => t.name === name);
}

export function findTeamByKanjiAbbr(abbr: string): TeamMaster | undefined {
  return TEAMS.find((t) => t.kanjiAbbr === abbr);
}
