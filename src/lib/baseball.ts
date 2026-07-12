// 日本のプロ野球ファンに馴染みのある表記（マジックナンバー）を算出するユーティリティ。
// 貯金/借金の表示はsrc/components/GamesAboveBelow500.tsxを参照

// NPBのレギュラーシーズンは143試合制（引き分けを考慮しない簡易計算）。
// 2位チームとのマジックナンバーのみ算出する一般的な簡易版（他球団すべてに対する優勝消滅判定はしていない）
const NPB_SEASON_GAMES = 143;

export function calcMagicNumber(leaderWins: number, secondPlaceLosses: number): number | null {
  const magic = NPB_SEASON_GAMES - leaderWins - secondPlaceLosses + 1;
  return magic > 0 ? magic : null;
}
