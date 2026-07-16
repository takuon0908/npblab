// npb.jp・スポーツ紙で使われる標準の1文字球団略称（scripts/scraper/teams.tsのkanjiAbbrと同じ値）
export const TEAM_ABBR: Record<string, string> = {
  tigers: "神",
  giants: "巨",
  baystars: "デ",
  dragons: "中",
  carp: "広",
  swallows: "ヤ",
  hawks: "ソ",
  fighters: "日",
  buffaloes: "オ",
  eagles: "楽",
  lions: "西",
  marines: "ロ",
};

export function teamAbbr(slug: string): string {
  return TEAM_ABBR[slug] ?? slug.slice(0, 1);
}
