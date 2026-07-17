// NPBデータ収集スクリプトのエントリポイント
// npb.jp（順位表・試合日程・タイトルリーダーズ）から日次でデータを取得し、Prisma DBにupsertする

import { PrismaClient, League, Level, TitleCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TEAMS } from "./teams";
import {
  parseStandings,
  parseLeaderboard,
  parseSchedule,
  parseIndividualBatting,
  parseIndividualPitching,
  parseBoxScoreDecision,
  parseProbableStarters,
} from "./parse";
import { fetchHtml } from "../shared/fetchHtml";
import { slugifyPlayer } from "../shared/slugifyPlayer";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URLが設定されていません");
}
const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function seedTeams() {
  for (const t of TEAMS) {
    await prisma.team.upsert({
      where: { slug: t.slug },
      update: { name: t.name, league: t.league === "central" ? League.CENTRAL : League.PACIFIC },
      create: {
        slug: t.slug,
        name: t.name,
        league: t.league === "central" ? League.CENTRAL : League.PACIFIC,
      },
    });
  }
}

async function scrapeStandings(year: number) {
  const date = new Date(todayIso());
  let count = 0;
  for (const leagueCode of ["c", "p"] as const) {
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
  }
  return count;
}

async function scrapeSchedule(year: number, month: number) {
  const monthStr = String(month).padStart(2, "0");
  const html = await fetchHtml(`https://npb.jp/games/${year}/schedule_${monthStr}.html`);
  const games = parseSchedule(html, year, month);

  let count = 0;
  for (const g of games) {
    const homeTeam = await prisma.team.findUniqueOrThrow({ where: { slug: g.homeTeamSlug } });
    const awayTeam = await prisma.team.findUniqueOrThrow({ where: { slug: g.awayTeamSlug } });
    const date = new Date(g.date);
    await prisma.game.upsert({
      where: {
        date_homeTeamId_awayTeamId: { date, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id },
      },
      update: {
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        isFinished: g.isFinished,
        boxScoreUrl: g.boxScoreUrl,
        venue: g.venue,
      },
      create: {
        date,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        isFinished: g.isFinished,
        boxScoreUrl: g.boxScoreUrl,
        venue: g.venue,
      },
    });
    count++;
  }
  return count;
}

async function scrapeTeamPlayerStats(year: number, date: Date, team: (typeof TEAMS)[number]) {
  const teamRecord = await prisma.team.findUniqueOrThrow({ where: { slug: team.slug } });
  let battingCount = 0;
  let pitchingCount = 0;

  for (const [level, prefix] of [
    [Level.ICHIGUN, 1],
    [Level.NIGUN, 2],
  ] as const) {
    try {
      const battingHtml = await fetchHtml(
        `https://npb.jp/bis/${year}/stats/idb${prefix}_${team.urlCode}.html`,
      );
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

      const pitchingHtml = await fetchHtml(
        `https://npb.jp/bis/${year}/stats/idp${prefix}_${team.urlCode}.html`,
      );
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
      console.warn(`個人成績 ${team.slug} level=${level} の取得に失敗:`, err);
    }
  }

  return { battingCount, pitchingCount };
}

// npb.jpへの同時接続数を絞りつつ、12球団分の待ち時間を短縮するため小バッチで並列化する
const TEAM_FETCH_CONCURRENCY = 4;

async function scrapePlayerStats(year: number) {
  const date = new Date(todayIso());
  let battingCount = 0;
  let pitchingCount = 0;

  for (let i = 0; i < TEAMS.length; i += TEAM_FETCH_CONCURRENCY) {
    const batch = TEAMS.slice(i, i + TEAM_FETCH_CONCURRENCY);
    const results = await Promise.all(
      batch.map((team) => scrapeTeamPlayerStats(year, date, team)),
    );
    for (const r of results) {
      battingCount += r.battingCount;
      pitchingCount += r.pitchingCount;
    }
  }

  return { battingCount, pitchingCount };
}

// boxScoreUrlは日程ページに埋め込まれているリンクをscrapeSchedule側で保存済み
async function fetchGameDecision(game: { id: string; boxScoreUrl: string | null }) {
  if (!game.boxScoreUrl) return false;
  try {
    const html = await fetchHtml(game.boxScoreUrl);
    const decision = parseBoxScoreDecision(html);
    if (decision.winningPitcher) {
      await prisma.game.update({ where: { id: game.id }, data: decision });
      return true;
    }
  } catch (err) {
    console.warn(`勝敗投手 ${game.boxScoreUrl} の取得に失敗:`, err);
  }
  return false;
}

const DECISION_FETCH_CONCURRENCY = 6;

async function scrapeDecisions() {
  const games = await prisma.game.findMany({
    where: { isFinished: true, winningPitcher: null, boxScoreUrl: { not: null } },
  });

  let count = 0;
  for (let i = 0; i < games.length; i += DECISION_FETCH_CONCURRENCY) {
    const batch = games.slice(i, i + DECISION_FETCH_CONCURRENCY);
    const results = await Promise.all(batch.map((g) => fetchGameDecision(g)));
    count += results.filter(Boolean).length;
  }
  return count;
}

const TITLE_CATEGORY_URL: Record<TitleCategory, string> = {
  [TitleCategory.BATTING_AVERAGE]: "lb_avg",
  [TitleCategory.HOME_RUNS]: "lb_hr",
  [TitleCategory.RBI]: "lb_rbi",
  [TitleCategory.STOLEN_BASES]: "lb_sb",
  [TitleCategory.WINS]: "lp_w",
  [TitleCategory.ERA]: "lp_era",
  [TitleCategory.STRIKEOUTS]: "lp_so",
  [TitleCategory.SAVES]: "lp_sv",
  [TitleCategory.HOLDS]: "lp_hldp",
};

async function scrapeTitleLeaders(year: number) {
  const date = new Date(todayIso());
  let count = 0;

  for (const category of Object.values(TitleCategory)) {
    for (const leagueCode of ["c", "p"] as const) {
      const urlPrefix = TITLE_CATEGORY_URL[category];
      const html = await fetchHtml(`https://npb.jp/bis/${year}/stats/${urlPrefix}_${leagueCode}.html`);
      const entries = parseLeaderboard(html);

      for (const entry of entries) {
        const team = await prisma.team.findUniqueOrThrow({ where: { slug: entry.teamSlug } });
        const playerId = slugifyPlayer(entry.playerName, entry.teamSlug);
        await prisma.titleLeaderSnapshot.upsert({
          where: { playerId_category_date: { playerId, category, date } },
          update: { rank: entry.rank, value: entry.value, playerName: entry.playerName, teamId: team.id },
          create: {
            playerId,
            playerName: entry.playerName,
            teamId: team.id,
            category,
            date,
            rank: entry.rank,
            value: entry.value,
          },
        });
        count++;
      }
    }
  }
  return count;
}

// npb.jp/announcement/starter/ は「翌日分」の予告先発のみを掲載する（前日夕方頃に公示）
async function scrapeProbableStarters(year: number) {
  let entries;
  try {
    const html = await fetchHtml("https://npb.jp/announcement/starter/");
    entries = parseProbableStarters(html, year);
  } catch (err) {
    console.warn("予告先発の取得に失敗（未公示の可能性）:", err);
    return 0;
  }

  let count = 0;
  for (const e of entries) {
    const homeTeam = await prisma.team.findUniqueOrThrow({ where: { slug: e.homeTeamSlug } });
    const awayTeam = await prisma.team.findUniqueOrThrow({ where: { slug: e.awayTeamSlug } });
    const date = new Date(e.date);
    try {
      await prisma.game.update({
        where: { date_homeTeamId_awayTeamId: { date, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id } },
        data: { probableHomePitcher: e.homePitcher, probableAwayPitcher: e.awayPitcher },
      });
      count++;
    } catch (err) {
      console.warn(`予告先発 ${e.date} ${e.homeTeamSlug}-${e.awayTeamSlug} に対応する試合が見つかりません:`, err);
    }
  }
  return count;
}

// NPBのレギュラーシーズンは3月開幕なので、開幕月〜当月までを毎回まとめて取り込む。
// 過去分は結果が変わらないのでupsertで冪等、当月分だけが実質更新される
const SEASON_START_MONTH = 3;

async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  await seedTeams();
  const standingsCount = await scrapeStandings(year);

  let gamesCount = 0;
  for (let month = SEASON_START_MONTH; month <= currentMonth; month++) {
    try {
      gamesCount += await scrapeSchedule(year, month);
    } catch (err) {
      console.warn(`schedule ${year}-${month} の取得に失敗（開幕前 or 未公開の可能性）:`, err);
    }
  }

  const leadersCount = await scrapeTitleLeaders(year);
  const { battingCount, pitchingCount } = await scrapePlayerStats(year);
  const decisionsCount = await scrapeDecisions();
  const probableStartersCount = await scrapeProbableStarters(year);

  console.log({
    standingsCount,
    gamesCount,
    leadersCount,
    battingCount,
    pitchingCount,
    decisionsCount,
    probableStartersCount,
  });
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
