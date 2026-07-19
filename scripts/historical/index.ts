// 過去シーズンのバックフィル用スクリプト
// npb.jpの過去シーズンページ（シーズン終了後なので最終成績が載っている）から
// 順位表・1軍/2軍個人成績を取得し、season-end代表日付(11/30)でDBにupsertする。
// 2軍→1軍の成長を追う分析（例: 前年2軍で良かった選手が翌年1軍でどうなったか）に使うため2軍も対象。
// 日次スクレイパーと違い、試合日程・タイトルリーダーズは対象外（過去分の価値が薄いため）

import { PrismaClient, Level } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TEAMS } from "../scraper/teams";
import { parseStandings, parseIndividualBatting, parseIndividualPitching } from "../scraper/parse";
import { fetchHtml } from "../shared/fetchHtml";
import { slugifyPlayer } from "../shared/slugifyPlayer";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URLが設定されていません");
}
const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// npb.jpは2025年に旧サイト(ネスト構造のテーブル)から現行の構造(table.tablefix2)へ刷新しており、
// このパーサーは2024年以前の旧サイト構造には対応していない（要・別パーサー）
const FIRST_SEASON = 2025;
const LAST_SEASON = 2025; // 当年(2026)は日次スクレイパー(npm run scrape)側が担当
const TEAM_FETCH_CONCURRENCY = 4;

function seasonEndDate(year: number): Date {
  return new Date(`${year}-11-30`);
}

async function backfillStandings(year: number) {
  const date = seasonEndDate(year);
  let count = 0;
  for (const leagueCode of ["c", "p"] as const) {
    try {
      const html = await fetchHtml(`https://npb.jp/bis/${year}/stats/std_${leagueCode}.html`);
      const rows = parseStandings(html);
      for (const row of rows) {
        const team = await prisma.team.findUniqueOrThrow({ where: { slug: row.teamSlug } });
        await prisma.standingsSnapshot.upsert({
          where: { teamId_date: { teamId: team.id, date } },
          update: {
            wins: row.wins,
            losses: row.losses,
            draws: row.draws,
            winPct: row.winPct,
            gamesBehind: row.gamesBehind,
          },
          create: {
            teamId: team.id,
            date,
            wins: row.wins,
            losses: row.losses,
            draws: row.draws,
            winPct: row.winPct,
            gamesBehind: row.gamesBehind,
          },
        });
        count++;
      }
    } catch (err) {
      console.warn(`standings ${year}-${leagueCode} の取得に失敗:`, err);
    }
  }
  return count;
}

async function backfillTeamPlayerStats(year: number, date: Date, team: (typeof TEAMS)[number]) {
  const teamRecord = await prisma.team.findUniqueOrThrow({ where: { slug: team.slug } });
  let battingCount = 0;
  let pitchingCount = 0;

  for (const [level, prefix] of [
    [Level.ICHIGUN, 1],
    [Level.NIGUN, 2],
  ] as const) {
    try {
      const battingHtml = await fetchHtml(`https://npb.jp/bis/${year}/stats/idb${prefix}_${team.urlCode}.html`);
      const battingRows = parseIndividualBatting(battingHtml);
      for (const row of battingRows) {
        if (row.games === 0) continue;
        const playerId = slugifyPlayer(row.playerName, team.slug);
        await prisma.playerBattingStat.upsert({
          where: { playerId_level_date: { playerId, level, date } },
          update: { ...row, teamId: teamRecord.id, season: year },
          create: { ...row, playerId, teamId: teamRecord.id, level, season: year, date },
        });
        battingCount++;
      }

      const pitchingHtml = await fetchHtml(`https://npb.jp/bis/${year}/stats/idp${prefix}_${team.urlCode}.html`);
      const pitchingRows = parseIndividualPitching(pitchingHtml);
      for (const row of pitchingRows) {
        if (row.appearances === 0) continue;
        const playerId = slugifyPlayer(row.playerName, team.slug);
        await prisma.playerPitchingStat.upsert({
          where: { playerId_level_date: { playerId, level, date } },
          update: { ...row, teamId: teamRecord.id, season: year },
          create: { ...row, playerId, teamId: teamRecord.id, level, season: year, date },
        });
        pitchingCount++;
      }
    } catch (err) {
      console.warn(`個人成績 ${year} ${team.slug} level=${level} の取得に失敗:`, err);
    }
  }

  return { battingCount, pitchingCount };
}

async function backfillYear(year: number) {
  const date = seasonEndDate(year);
  const standingsCount = await backfillStandings(year);

  let battingCount = 0;
  let pitchingCount = 0;
  for (let i = 0; i < TEAMS.length; i += TEAM_FETCH_CONCURRENCY) {
    const batch = TEAMS.slice(i, i + TEAM_FETCH_CONCURRENCY);
    const results = await Promise.all(batch.map((team) => backfillTeamPlayerStats(year, date, team)));
    for (const r of results) {
      battingCount += r.battingCount;
      pitchingCount += r.pitchingCount;
    }
  }

  console.log({ year, standingsCount, battingCount, pitchingCount });
}

async function main() {
  for (let year = FIRST_SEASON; year <= LAST_SEASON; year++) {
    await backfillYear(year);
  }
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
