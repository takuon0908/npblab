// お気に入り球団はアカウント基盤が無いため、ブラウザのlocalStorageにのみ保存する。
// プッシュ通知は行わない（データ更新が1日1回のバッチのため、試合開始/終了のリアルタイム通知は
// 実現できない。将来リアルタイム性のあるパイプラインに変えた場合の検討事項）
const STORAGE_KEY = "npblab:favoriteTeam";
export const FAVORITE_TEAM_EVENT = "npblab:favoriteTeamChange";

export function getFavoriteTeam(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setFavoriteTeam(slug: string | null): void {
  if (typeof window === "undefined") return;
  if (slug) {
    window.localStorage.setItem(STORAGE_KEY, slug);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent(FAVORITE_TEAM_EVENT, { detail: slug }));
}
