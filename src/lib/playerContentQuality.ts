import { Level } from "@prisma/client";

// 2026-08-18: AdSense審査で「有用性の低いコンテンツ／サイト運営者ネットワークの
// ご利用要件を満たしていない」との指摘を受けたための対応。
//
// 調査の結果、サイトマップの構成が選手ページ1017件・記事151件と、選手ページが
// 全体の85%以上を占めていることが分かった(sitemap.xml実測)。選手ページは
// 「今季どれだけ出場したか」で足切りする案も検討したが、NPBは12球団で1シーズンに
// 数百人が実際に出場するため、現実的などんな閾値を設定しても数百件は残ってしまい
// (例: 1軍打数100以上・投球回25以上・2軍出場30試合以上・2軍投球回20以上、という
// かなり厳しい基準でも441件が残存)、記事151本との比率を大きく改善することはできなかった。
//
// そのため、閾値による部分的な間引きではなく、「選手ページは一旦すべて検索エンジンの
// インデックス対象から外す」という決定的な対応を取ることにした。ページ自体は削除せず
// サイト内からは引き続き閲覧・回遊できる(noindexはクロール自体を妨げないため、
// followは維持しユーザー導線は保つ)。サイトの検索エンジン向けの見え方を、
// 記事・分析ページなど明確に独自価値のあるコンテンツ中心に揃え直すことが狙い。
//
// 再開の目安: AdSense審査に通過し、かつ記事本数が十分に増えて選手ページとの
// バランスが改善した段階で、PLAYER_PAGES_INDEXABLEをtrueに戻すか、
// 下記のhasSufficientSeasonSample(閾値ベースの復活時に使う想定で残してある)を
// 使った段階的な再導入を検討する。
const PLAYER_PAGES_INDEXABLE = false;

const ICHIGUN_AB_THRESHOLD = 100;
const ICHIGUN_IP_THRESHOLD = 25;
const NIGUN_GAMES_THRESHOLD = 30;
const NIGUN_IP_THRESHOLD = 20;

interface BattingSample {
  level: Level;
  atBats: number;
  games: number;
}

interface PitchingSample {
  level: Level;
  inningsPitched: number;
}

function meetsThreshold(batting: BattingSample[], pitching: PitchingSample[]): boolean {
  const ichigunBat = batting.find((b) => b.level === Level.ICHIGUN);
  const ichigunPitch = pitching.find((p) => p.level === Level.ICHIGUN);
  const nigunBat = batting.find((b) => b.level === Level.NIGUN);
  const nigunPitch = pitching.find((p) => p.level === Level.NIGUN);

  return Boolean(
    (ichigunBat && ichigunBat.atBats >= ICHIGUN_AB_THRESHOLD) ||
      (ichigunPitch && ichigunPitch.inningsPitched >= ICHIGUN_IP_THRESHOLD) ||
      (nigunBat && nigunBat.games >= NIGUN_GAMES_THRESHOLD) ||
      (nigunPitch && nigunPitch.inningsPitched >= NIGUN_IP_THRESHOLD),
  );
}

export function hasSufficientSeasonSample(batting: BattingSample[], pitching: PitchingSample[]): boolean {
  if (!PLAYER_PAGES_INDEXABLE) return false;
  return meetsThreshold(batting, pitching);
}
