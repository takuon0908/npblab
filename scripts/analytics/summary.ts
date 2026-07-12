// 攻撃力/投手力のリーグ内順位・運の良し悪し・直近の調子から特徴の要約文をルールベースで生成する

export interface TeamSummaryInput {
  offenseRank: number; // リーグ内順位（1が最多得点）
  defenseRank: number; // リーグ内順位（1が最少失点）
  leagueSize: number;
  luckGap: number; // 実際の勝率 - ピタゴラス勝率
  last10Wins: number;
  last10Losses: number;
  last10Draws: number;
}

type Tier = "good" | "mid" | "bad";

function bucket(rank: number, leagueSize: number): Tier {
  if (rank <= 2) return "good";
  if (rank >= leagueSize - 1) return "bad";
  return "mid";
}

const OFFENSE_DEFENSE_TEMPLATES: Record<`${Tier}-${Tier}`, string> = {
  "good-good": "投打がかみ合っており、リーグでも隙のない戦力",
  "good-mid": "打線は好調だが、投手陣は平均的",
  "good-bad": "打線はリーグ屈指だが、投手陣が足を引っ張っている",
  "mid-good": "投手陣は安定しているが、打線は平均的",
  "mid-mid": "投打とも目立った長所・短所のない平均的なチーム",
  "mid-bad": "打線は平均的だが、投手陣に課題を抱えている",
  "bad-good": "投手陣は踏ん張っているが、打線の援護が乏しい",
  "bad-mid": "打線が振るわず、得点力に苦しんでいる",
  "bad-bad": "投打ともに苦戦が続いている",
};

export function generateTeamSummary(input: TeamSummaryInput): string {
  const offense = bucket(input.offenseRank, input.leagueSize);
  const defense = bucket(input.defenseRank, input.leagueSize);

  const parts: string[] = [OFFENSE_DEFENSE_TEMPLATES[`${offense}-${defense}`]];

  if (input.luckGap > 0.07) {
    parts.push("接戦をものにできており、勝率は実力以上に出ている");
  } else if (input.luckGap < -0.07) {
    parts.push("接戦を落とす試合が多く、勝率は実力を下回っている");
  }

  const last10Decided = input.last10Wins + input.last10Losses;
  if (last10Decided >= 5) {
    const last10Pct = input.last10Wins / last10Decided;
    if (last10Pct >= 0.7) {
      parts.push(`直近10試合は${input.last10Wins}勝${input.last10Losses}敗${input.last10Draws}分と好調`);
    } else if (last10Pct <= 0.3) {
      parts.push(`直近10試合は${input.last10Wins}勝${input.last10Losses}敗${input.last10Draws}分と苦しい状況`);
    }
  }

  return parts.join("。") + "。";
}
