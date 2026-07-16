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
