// 「打線/投手陣を補強したら優勝確率がどう変わるか」を試算するWhat-Ifシミュレーション。
// 得失点をPythagoras式で仮に増減させ、既存のシミュレーションエンジンに勝率だけ差し替えて再計算する。
import { prisma } from "@/lib/prisma";
import { League } from "@prisma/client";
import {
  simulateLeagueChampionship,
  type TeamRecord,
  type ScheduledGame,
} from "../../scripts/simulation/simulate";
import { computePythagoreanWinPct } from "../../scripts/analytics/compute";

export interface WhatIfResult {
  offenseUpProbability: number; // 打線が1試合+0.5点強化された場合の優勝確率
  defenseUpProbability: number; // 失点が1試合0.5点減った場合の優勝確率
}

const RUNS = 5000;
const RUNS_PER_GAME_DELTA = 0.5;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export async function computeWhatIf(
  teamId: string,
  storedBaselineProbability: number,
): Promise<WhatIfResult | null> {
  const [standingsDate, insight] = await Promise.all([
    prisma.standingsSnapshot.aggregate({ _max: { date: true } }),
    prisma.teamInsight.findFirst({ where: { teamId }, orderBy: { date: "desc" } }),
  ]);
  if (!standingsDate._max.date || !insight || insight.gamesPlayed === 0) return null;

  const [standings, remainingGames] = await Promise.all([
    prisma.standingsSnapshot.findMany({
      where: { date: standingsDate._max.date },
      include: { team: true },
    }),
    prisma.game.findMany({
      where: { isFinished: false, date: { gte: new Date(new Date().toISOString().slice(0, 10)) } },
    }),
  ]);

  const teams: TeamRecord[] = standings.map((s) => ({
    teamId: s.teamId,
    league: s.team.league === League.CENTRAL ? "central" : "pacific",
    wins: s.wins,
    losses: s.losses,
  }));
  const scheduledGames: ScheduledGame[] = remainingGames.map((g) => ({
    homeTeamId: g.homeTeamId,
    awayTeamId: g.awayTeamId,
  }));

  const baselineResults = simulateLeagueChampionship(teams, scheduledGames, RUNS);
  const freshBaseline = baselineResults[teamId]?.probability ?? storedBaselineProbability;

  const runDelta = insight.gamesPlayed * RUNS_PER_GAME_DELTA;

  const offenseTeams = teams.map((t) =>
    t.teamId === teamId
      ? { ...t, winPctOverride: computePythagoreanWinPct(insight.runsScored + runDelta, insight.runsAllowed) }
      : t,
  );
  const offenseResults = simulateLeagueChampionship(offenseTeams, scheduledGames, RUNS);
  const offenseDelta = (offenseResults[teamId]?.probability ?? freshBaseline) - freshBaseline;

  const defenseTeams = teams.map((t) =>
    t.teamId === teamId
      ? {
          ...t,
          winPctOverride: computePythagoreanWinPct(
            insight.runsScored,
            Math.max(insight.runsAllowed - runDelta, 1),
          ),
        }
      : t,
  );
  const defenseResults = simulateLeagueChampionship(defenseTeams, scheduledGames, RUNS);
  const defenseDelta = (defenseResults[teamId]?.probability ?? freshBaseline) - freshBaseline;

  return {
    offenseUpProbability: clamp01(storedBaselineProbability + offenseDelta),
    defenseUpProbability: clamp01(storedBaselineProbability + defenseDelta),
  };
}
