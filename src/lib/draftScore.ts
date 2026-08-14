// ドラフト指名選手の評価スコアを算出する。
// シーズン別の詳細成績は持たない前提(通算成績はリサーチベースの軽量サマリー)なので、
// 「一軍に定着できたか」「主力になれたシーズンが何回あったか」「タイトルを獲れたか」という
// 3つの粗い軸だけで加点する、あえてシンプルな設計。指名順位による重み付け(下位指名の
// 当たりをより高く評価する等)はここでは行わない — 読者が指名順位と見比べて
// 自分で「掘り出し物」を判断できるよう、素点と指名順位は別々に表示する
const DEBUT_POINTS = 10;
const QUALIFIED_SEASON_POINTS = 20;
const TITLE_POINTS = 30;

export interface DraftPickScoreInput {
  npbDebutMade: boolean;
  qualifiedSeasons: number;
  titles?: string | null;
}

export function calcDraftPickScore(pick: DraftPickScoreInput): number {
  let score = 0;
  if (pick.npbDebutMade) score += DEBUT_POINTS;
  score += pick.qualifiedSeasons * QUALIFIED_SEASON_POINTS;
  if (pick.titles && pick.titles.trim() !== "" && pick.titles.trim() !== "なし") {
    // タイトルは読点区切りの自由記述。件数分だけ加点する
    const count = pick.titles.split(/[、,]/).filter((s) => s.trim() !== "").length;
    score += TITLE_POINTS * Math.max(count, 1);
  }
  return score;
}
