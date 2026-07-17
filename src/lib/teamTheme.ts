// 記事本文から言及されている球団を検出し、その球団色をカバーイラストに反映するための定義

export const TEAM_ALIASES: Record<string, string[]> = {
  tigers: ["阪神タイガース", "阪神"],
  giants: ["読売ジャイアンツ", "巨人"],
  baystars: ["横浜DeNAベイスターズ", "DeNA", "横浜"],
  dragons: ["中日ドラゴンズ", "中日"],
  carp: ["広島東洋カープ", "広島"],
  swallows: ["東京ヤクルトスワローズ", "ヤクルト"],
  hawks: ["福岡ソフトバンクホークス", "ソフトバンク"],
  fighters: ["北海道日本ハムファイターズ", "日本ハム", "ファイターズ"],
  buffaloes: ["オリックス・バファローズ", "オリックス"],
  eagles: ["東北楽天ゴールデンイーグルス", "楽天"],
  lions: ["埼玉西武ライオンズ", "西武"],
  marines: ["千葉ロッテマリーンズ", "ロッテ"],
};

// 各球団のチームカラーに寄せた配色（背景は濃色、accentはチームカラー）
export const TEAM_THEME: Record<string, { bg: string; accent: string }> = {
  tigers: { bg: "#1a1608", accent: "#ffd400" },
  giants: { bg: "#1a1206", accent: "#f5811f" },
  baystars: { bg: "#0a1420", accent: "#0072ce" },
  dragons: { bg: "#0a1020", accent: "#1a4fb4" },
  carp: { bg: "#1a0608", accent: "#ff0025" },
  swallows: { bg: "#05140c", accent: "#00a651" },
  hawks: { bg: "#14120a", accent: "#f6c000" },
  fighters: { bg: "#0a1220", accent: "#2a63c4" },
  buffaloes: { bg: "#0a1120", accent: "#d4af37" },
  eagles: { bg: "#1a0508", accent: "#a4001e" },
  lions: { bg: "#050a16", accent: "#0068b7" },
  marines: { bg: "#06121a", accent: "#3f8fae" },
};

// slugにない汎用パターン（複数球団にまたがる記事等）用のフォールバック配色
const FALLBACK_THEME = [
  { bg: "#12181f", accent: "#22c55e" },
  { bg: "#1a1210", accent: "#f97316" },
  { bg: "#0f1729", accent: "#3b82f6" },
  { bg: "#1a0f14", accent: "#ef4444" },
  { bg: "#160f1a", accent: "#a855f7" },
  { bg: "#141a12", accent: "#eab308" },
];

// タイトル・本文のプレーンテキストから、最初に言及されている球団を検出する。
// 「比較として一言だけ出てくる球団」より「本題として最初に登場する球団」を優先するため、
// 各球団のエイリアスが文中に現れる最小indexを比べ、一番早く登場したものを採用する
export function detectTeamSlug(text: string): string | null {
  let bestSlug: string | null = null;
  let bestIndex = Infinity;

  for (const [slug, aliases] of Object.entries(TEAM_ALIASES)) {
    for (const alias of aliases) {
      const index = text.indexOf(alias);
      if (index !== -1 && index < bestIndex) {
        bestIndex = index;
        bestSlug = slug;
      }
    }
  }
  return bestSlug;
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// 記事内容(タイトル+本文)から、言及されている球団のチームカラー、無ければハッシュベースの配色を返す
export function themeForArticle(slug: string, text: string): { bg: string; accent: string } {
  const teamSlug = detectTeamSlug(text);
  if (teamSlug) return TEAM_THEME[teamSlug];
  return FALLBACK_THEME[hashString(slug) % FALLBACK_THEME.length];
}
