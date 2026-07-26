import { prisma } from "@/lib/prisma";

export async function getLatestDayGames() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const latest = await prisma.game.findFirst({
    where: { date: { lte: today }, isFinished: true },
    orderBy: { date: "desc" },
    select: { date: true },
  });
  if (!latest) return null;

  const games = await prisma.game.findMany({
    where: { date: latest.date, isFinished: true },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { homeTeamId: "asc" },
  });

  return { date: latest.date, games };
}

// その日の試合の中から、最も僅差だった一戦を「今日の接戦」として選ぶ
export function pickClosestGame<T extends { homeScore: number | null; awayScore: number | null }>(
  games: T[]
): T | null {
  const finished = games.filter((g) => g.homeScore !== null && g.awayScore !== null);
  if (finished.length === 0) return null;
  return finished.reduce((closest, g) => {
    const margin = Math.abs(g.homeScore! - g.awayScore!);
    const closestMargin = Math.abs(closest.homeScore! - closest.awayScore!);
    return margin < closestMargin ? g : closest;
  });
}
