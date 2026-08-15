// 選手個別ページ向けに、その選手自身の実成績からルールベースで特徴の要約文を生成する。
// 球団ページのTeamInsight(scripts/analytics/summary.ts)と同じ考え方: Wikipedia等からの転載ではなく、
// 当サイトが保有する実データから独自に組み立てた文章にすることで、選手ページの薄さを解消する

import { formatAvg } from "./format";

export interface BatterSummaryInput {
  avg: number;
  homeRuns: number;
  stolenBases: number;
  kPercent: number;
  bbPercent: number;
  atBats: number;
  avgRank?: number | null;
  hrRank?: number | null;
  totalQualified?: number | null;
}

export function generateBatterSummary(input: BatterSummaryInput): string {
  const parts: string[] = [];

  if (input.homeRuns >= 30) {
    parts.push("圧倒的な長打力を誇るスラッガー");
  } else if (input.homeRuns >= 20) {
    parts.push("リーグ上位クラスの長打力を持つ");
  } else if (input.homeRuns >= 10) {
    parts.push("一定の長打力を備えた");
  } else if (input.avg >= 0.28) {
    parts.push("長打よりもコンタクト重視のアベレージヒッター");
  }

  if (input.avg >= 0.3) {
    parts.push(`打率${formatAvg(input.avg)}はリーグでも屈指の高水準`);
  } else if (input.avg >= 0.27) {
    parts.push(`打率${formatAvg(input.avg)}は平均を上回る水準`);
  } else if (input.avg >= 0.23) {
    parts.push(`打率${formatAvg(input.avg)}は平均的な水準`);
  } else if (input.atBats >= 50) {
    parts.push(`打率${formatAvg(input.avg)}にとどまり打撃面では苦しんでいる`);
  }

  if (input.avgRank && input.totalQualified && input.avgRank <= input.totalQualified) {
    parts.push(`今季打数のある1軍打者${input.totalQualified}人中${input.avgRank}位の打率`);
  }

  if (input.bbPercent > input.kPercent) {
    parts.push("四球が三振を上回る非常に高い選球眼が持ち味");
  } else if (input.kPercent <= 0.15) {
    parts.push("三振が少なく選球眼に優れる");
  } else if (input.kPercent >= 0.25) {
    parts.push("三振の多さがやや目立つ");
  }

  if (input.stolenBases >= 20) {
    parts.push("俊足を活かした走塁も武器");
  } else if (input.stolenBases >= 10) {
    parts.push("一定の走力も持ち合わせる");
  }

  if (parts.length === 0) return "";
  return parts.join("。") + "。";
}

export interface PitcherSummaryInput {
  era: number;
  saves: number;
  holds: number;
  appearances: number;
  inningsPitched: number;
  strikeouts: number;
  walks: number;
  eraRank?: number | null;
  totalQualified?: number | null;
}

export function generatePitcherSummary(input: PitcherSummaryInput): string {
  const parts: string[] = [];

  const ipPerAppearance = input.appearances > 0 ? input.inningsPitched / input.appearances : 0;
  if (input.saves >= 10) {
    parts.push("守護神としてチームの勝ちパターンを締める");
  } else if (input.holds >= 10) {
    parts.push("勝ちパターンを支えるセットアッパー");
  } else if (ipPerAppearance >= 3) {
    parts.push("先発の一角を担う");
  } else if (input.appearances >= 10) {
    parts.push("中継ぎとして数多くの試合に登板する");
  }

  if (input.era <= 2.5) {
    parts.push(`防御率${input.era.toFixed(2)}はリーグトップクラスの安定感`);
  } else if (input.era <= 3.5) {
    parts.push(`防御率${input.era.toFixed(2)}と安定した投球を見せる`);
  } else if (input.era <= 4.5) {
    parts.push(`防御率${input.era.toFixed(2)}は平均的な水準`);
  } else if (input.inningsPitched >= 10) {
    parts.push(`防御率${input.era.toFixed(2)}と苦しい投球が続いている`);
  }

  if (input.eraRank && input.totalQualified && input.eraRank <= input.totalQualified) {
    parts.push(`今季投球回のある1軍投手${input.totalQualified}人中${input.eraRank}位の防御率`);
  }

  if (input.inningsPitched >= 10) {
    const k9 = (input.strikeouts * 9) / input.inningsPitched;
    const bb9 = (input.walks * 9) / input.inningsPitched;
    if (k9 >= 9) {
      parts.push("奪三振能力が高く空振りを取れる");
    } else if (k9 >= 7) {
      parts.push("平均以上の奪三振能力を持つ");
    }
    if (bb9 <= 2.0) {
      parts.push("制球力にも優れる");
    } else if (bb9 >= 4.0) {
      parts.push("制球面で苦しむ場面も見られる");
    }
  }

  if (parts.length === 0) return "";
  return parts.join("。") + "。";
}
