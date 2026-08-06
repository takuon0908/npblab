// 球団ごとの「担当記者」マスコットキャラクター。CEOが用意したイラストから
// 球団カラー・球団のモチーフ動物(タイガース=トラ、バファローズ=ウシ等)に
// 合わせて割り当てている。実在の人物ではなく、あくまで遊び心のあるマスコット
export interface TeamReporter {
  name: string;
  image: string;
}

export const TEAM_REPORTERS: Record<string, TeamReporter> = {
  tigers: { name: "トラ吉", image: "/mascots/tigers.jpg" },
  giants: { name: "ウサ吉", image: "/mascots/giants.jpg" },
  dragons: { name: "コアラ吉", image: "/mascots/dragons.jpg" },
  carp: { name: "コイ吉", image: "/mascots/carp.jpg" },
  swallows: { name: "ツバ吉", image: "/mascots/swallows.jpg" },
  hawks: { name: "タカ吉", image: "/mascots/hawks.jpg" },
  fighters: { name: "ハム吉", image: "/mascots/fighters.jpg" },
  buffaloes: { name: "ウシ吉", image: "/mascots/buffaloes.jpg" },
  eagles: { name: "ワシ吉", image: "/mascots/eagles.jpg" },
  lions: { name: "シシ吉", image: "/mascots/lions.jpg" },
  marines: { name: "キツ吉", image: "/mascots/marines.jpg" },
};

export function getTeamReporter(slug: string): TeamReporter | null {
  return TEAM_REPORTERS[slug] ?? null;
}
