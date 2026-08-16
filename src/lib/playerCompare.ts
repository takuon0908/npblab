import { prisma } from "@/lib/prisma";
import { Level } from "@prisma/client";
import { latestPerPlayer } from "@/lib/latestPerPlayer";
import { calcFipConstant, calcFip, calcWoba, calcWhip, calcKPercent, calcBBPercent } from "@/lib/sabermetrics";
import { calcPercentile } from "@/lib/percentile";

export interface BattingComparisonStats {
  games: number;
  avg: number;
  iso: number;
  woba: number;
  homeRuns: number;
  kPercent: number;
  bbPercent: number;
}

export interface PitchingComparisonStats {
  games: number;
  era: number;
  fip: number;
  whip: number;
  strikeouts: number;
  kPercent: number;
  bbPercent: number;
}

export interface PlayerComparisonData {
  playerId: string;
  playerName: string;
  teamName: string;
  teamSlug: string;
  type: "batting" | "pitching";
  stats: BattingComparisonStats | PitchingComparisonStats;
  // リーグ内(規定未到達選手も含む今季1軍出場者全体)でのパーセンタイル(0-100)
  percentiles: Record<string, number> | null;
}

// 選手比較ページ用に、今季1軍成績とリーグ内パーセンタイルをまとめて返す。
// 打者ページ/投手ページそれぞれの単独ページ(players/[playerId])と同じ考え方だが、
// 履歴・関連選手など比較に不要な情報は省いた軽量版
export async function getPlayerComparisonData(playerId: string): Promise<PlayerComparisonData | null> {
  const season = new Date().getFullYear();

  const [battingRows, pitchingRows] = await Promise.all([
    prisma.playerBattingStat.findMany({
      where: { playerId, season, level: Level.ICHIGUN },
      include: { team: true },
      orderBy: { date: "desc" },
      take: 1,
    }),
    prisma.playerPitchingStat.findMany({
      where: { playerId, season, level: Level.ICHIGUN },
      include: { team: true },
      orderBy: { date: "desc" },
      take: 1,
    }),
  ]);

  const batting = battingRows[0] ?? null;
  const pitching = pitchingRows[0] ?? null;

  // 打者・投手どちらの今季1軍成績を主として扱うかの判定。
  // セ・リーグは投手も打席に立つため、先発投手には登板数とほぼ同数の
  // 「打者としての出場」行が付随してしまう(送りバント等が中心で打率は参考程度)。
  // 出場数の多寡で単純比較すると先発投手が軒並み「打者」に誤判定されるため、
  // 一定回数以上登板した投手成績があれば投手を優先する(現状のNPBに実質的な二刀流選手はいない前提)
  const isPrimarilyPitcher = pitching !== null && pitching.inningsPitched >= 5;
  if (batting && !isPrimarilyPitcher) {
    const seasonBatters = await prisma.playerBattingStat.findMany({ where: { season, level: Level.ICHIGUN } });
    const qualified = latestPerPlayer(seasonBatters).filter((b) => b.atBats > 0);

    let percentiles: Record<string, number> | null = null;
    if (qualified.length >= 5 && qualified.some((b) => b.playerId === playerId)) {
      const withDerived = qualified.map((b) => ({
        playerId: b.playerId,
        avg: b.avg,
        iso: b.slg - b.avg,
        woba: calcWoba(b),
        homeRuns: b.homeRuns,
        kPercent: calcKPercent(b),
        bbPercent: calcBBPercent(b),
      }));
      const me = withDerived.find((b) => b.playerId === playerId)!;
      percentiles = {
        avg: calcPercentile(me.avg, withDerived.map((b) => b.avg), true),
        iso: calcPercentile(me.iso, withDerived.map((b) => b.iso), true),
        woba: calcPercentile(me.woba, withDerived.map((b) => b.woba), true),
        homeRuns: calcPercentile(me.homeRuns, withDerived.map((b) => b.homeRuns), true),
        kPercent: calcPercentile(me.kPercent, withDerived.map((b) => b.kPercent), false),
        bbPercent: calcPercentile(me.bbPercent, withDerived.map((b) => b.bbPercent), true),
      };
    }

    return {
      playerId,
      playerName: batting.playerName,
      teamName: batting.team.name,
      teamSlug: batting.team.slug,
      type: "batting",
      stats: {
        games: batting.games,
        avg: batting.avg,
        iso: batting.slg - batting.avg,
        woba: calcWoba(batting),
        homeRuns: batting.homeRuns,
        kPercent: calcKPercent(batting),
        bbPercent: calcBBPercent(batting),
      },
      percentiles,
    };
  }

  if (pitching) {
    const seasonPitchers = await prisma.playerPitchingStat.findMany({ where: { season, level: Level.ICHIGUN } });
    const latestSeasonPitchers = latestPerPlayer(seasonPitchers);
    const fipConstant = calcFipConstant(latestSeasonPitchers);
    const qualified = latestSeasonPitchers.filter((p) => p.inningsPitched >= 10);

    let percentiles: Record<string, number> | null = null;
    if (qualified.length >= 5 && qualified.some((p) => p.playerId === playerId)) {
      const withDerived = qualified.map((p) => {
        const estimatedBattersFaced = p.inningsPitched * 4.3;
        return {
          playerId: p.playerId,
          era: p.era,
          fip: calcFip(p, fipConstant),
          whip: calcWhip(p),
          strikeouts: p.strikeouts,
          kPercent: calcKPercent({ strikeouts: p.strikeouts, plateAppearances: estimatedBattersFaced }),
          bbPercent: calcBBPercent({ walks: p.walks + p.hitByPitch, plateAppearances: estimatedBattersFaced }),
        };
      });
      const me = withDerived.find((p) => p.playerId === playerId)!;
      percentiles = {
        era: calcPercentile(me.era, withDerived.map((p) => p.era), false),
        fip: calcPercentile(me.fip, withDerived.map((p) => p.fip), false),
        whip: calcPercentile(me.whip, withDerived.map((p) => p.whip), false),
        strikeouts: calcPercentile(me.strikeouts, withDerived.map((p) => p.strikeouts), true),
        kPercent: calcPercentile(me.kPercent, withDerived.map((p) => p.kPercent), true),
        bbPercent: calcPercentile(me.bbPercent, withDerived.map((p) => p.bbPercent), false),
      };
    }

    return {
      playerId,
      playerName: pitching.playerName,
      teamName: pitching.team.name,
      teamSlug: pitching.team.slug,
      type: "pitching",
      stats: {
        games: pitching.appearances,
        era: pitching.era,
        fip: calcFip(pitching, fipConstant),
        whip: calcWhip(pitching),
        strikeouts: pitching.strikeouts,
        kPercent: calcKPercent({ strikeouts: pitching.strikeouts, plateAppearances: pitching.inningsPitched * 4.3 }),
        bbPercent: calcBBPercent({
          walks: pitching.walks + pitching.hitByPitch,
          plateAppearances: pitching.inningsPitched * 4.3,
        }),
      },
      percentiles,
    };
  }

  return null;
}
