import * as cheerio from "cheerio";
import { findTeamByName, findTeamByKanjiAbbr } from "./teams";

export interface ParsedStanding {
  teamSlug: string;
  wins: number;
  losses: number;
  draws: number;
  winPct: number;
  gamesBehind: number;
}

// npb.jp/bis/{year}/stats/std_{c|p}.html のチーム勝敗表（先頭の表。2つ目は交流戦のみの表なので使わない）
export function parseStandings(html: string): ParsedStanding[] {
  const $ = cheerio.load(html);
  const rows = $("table.tablefix2").first().find("tbody tr.ststats");

  const result: ParsedStanding[] = [];
  rows.each((_, row) => {
    const cells = $(row).find("td");
    const teamName = $(cells[0]).text().trim();
    const team = findTeamByName(teamName);
    if (!team) return;

    const gamesBehindText = $(cells[6]).text().trim();

    result.push({
      teamSlug: team.slug,
      wins: Number($(cells[2]).text().trim()),
      losses: Number($(cells[3]).text().trim()),
      draws: Number($(cells[4]).text().trim()),
      winPct: Number($(cells[5]).text().trim()),
      gamesBehind: gamesBehindText === "--" ? 0 : Number(gamesBehindText),
    });
  });
  return result;
}

export interface ParsedLeaderEntry {
  rank: number;
  playerName: string;
  teamSlug: string;
  value: number;
}

// npb.jp/bis/{year}/stats/{lb|lp}_{category}_{c|p}.html のリーダーズ表
// 行は「順位 / 選手名(球団略称) / 成績値」の3列
export function parseLeaderboard(html: string): ParsedLeaderEntry[] {
  const $ = cheerio.load(html);
  const rows = $("table.tablefix2 tbody tr.ststats");

  const result: ParsedLeaderEntry[] = [];
  rows.each((_, row) => {
    const cells = $(row).find("td");
    const rank = Number($(cells[0]).text().trim());
    const rawName = $(cells[1]).text().trim();
    const value = Number($(cells[2]).text().trim());

    const match = rawName.match(/^(.+?)\((.+)\)$/);
    if (!match) return;
    const [, playerName, abbr] = match;
    const team = findTeamByKanjiAbbr(abbr);
    if (!team) return;

    result.push({ rank, playerName: playerName.trim(), teamSlug: team.slug, value });
  });
  return result;
}

export interface ParsedBattingRow {
  playerName: string;
  games: number;
  plateAppearances: number;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  totalBases: number;
  rbi: number;
  stolenBases: number;
  caughtStealing: number;
  walks: number;
  hitByPitch: number;
  strikeouts: number;
  avg: number;
  slg: number;
  obp: number;
}

// 選手名の先頭に付く"*"（登録抹消・支配下外など状態を示すマーカー）を除去する
function extractPlayerName(raw: string): string {
  return raw.trim().replace(/^\*/, "").trim();
}

// 1軍と2軍(ファーム)でカラム構成が異なる（例: 2軍投手成績にはホールド/ＨＰ列がない）ため、
// 列位置の決め打ちではなくヘッダーのラベル文字列から列番号を引く
function buildHeaderIndex($: cheerio.CheerioAPI, table: ReturnType<cheerio.CheerioAPI>): Map<string, number> {
  const map = new Map<string, number>();
  table.find("thead th").each((i, th) => {
    map.set($(th).text().trim(), i);
  });
  return map;
}

// npb.jp/bis/{year}/stats/idb{1|2}_{team}.html の個人打撃成績（全選手フル成績）
export function parseIndividualBatting(html: string): ParsedBattingRow[] {
  const $ = cheerio.load(html);
  const table = $("table.tablefix2").first();
  const headerIndex = buildHeaderIndex($, table);
  const rows = table.find("tbody tr");

  const result: ParsedBattingRow[] = [];
  rows.each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length === 0) return;
    const num = (label: string) => {
      const i = headerIndex.get(label);
      if (i === undefined) return 0;
      // "----"等の未定義プレースホルダー（打数0の打率など）はNaNになるため0扱いにする
      const value = Number($(cells[i]).text().trim());
      return Number.isNaN(value) ? 0 : value;
    };

    result.push({
      playerName: extractPlayerName($(cells[0]).text()),
      games: num("試合"),
      plateAppearances: num("打席"),
      atBats: num("打数"),
      runs: num("得点"),
      hits: num("安打"),
      doubles: num("二塁打"),
      triples: num("三塁打"),
      homeRuns: num("本塁打"),
      totalBases: num("塁打"),
      rbi: num("打点"),
      stolenBases: num("盗塁"),
      caughtStealing: num("盗塁刺"),
      walks: num("四球"),
      hitByPitch: num("死球"),
      strikeouts: num("三振"),
      avg: num("打率"),
      slg: num("長打率"),
      obp: num("出塁率"),
    });
  });
  return result;
}

export interface ParsedPitchingRow {
  playerName: string;
  appearances: number;
  wins: number;
  losses: number;
  saves: number;
  holds: number;
  inningsPitched: number;
  hits: number;
  homeRuns: number;
  walks: number;
  hitByPitch: number;
  strikeouts: number;
  runs: number;
  earnedRuns: number;
  era: number;
}

// npb.jp/bis/{year}/stats/idp{1|2}_{team}.html の個人投手成績（全選手フル成績）
// 2軍(ファーム)ページには「ホールド」「ＨＰ」列が存在しない等、1軍とカラム構成が異なるため
// ヘッダーラベルから列を引く（存在しない列は0扱い）
// 投球回は「6.1」=6回1/3、「6.2」=6回2/3 という野球独自の端数表記（実際の小数ではない）
export function parseIndividualPitching(html: string): ParsedPitchingRow[] {
  const $ = cheerio.load(html);
  const table = $("table.tablefix2").first();
  const headerIndex = buildHeaderIndex($, table);
  const rows = table.find("tbody tr");

  const result: ParsedPitchingRow[] = [];
  rows.each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length === 0) return;
    const cellText = (label: string) => {
      const i = headerIndex.get(label);
      return i === undefined ? "" : $(cells[i]).text().trim();
    };
    const num = (label: string) => {
      // "----"等の未定義プレースホルダー（0イニングの防御率など）はNaNになるため0扱いにする
      const value = Number(cellText(label) || 0);
      return Number.isNaN(value) ? 0 : value;
    };

    result.push({
      playerName: extractPlayerName($(cells[0]).text()),
      appearances: num("登板"),
      wins: num("勝利"),
      losses: num("敗北"),
      saves: num("セーブ"),
      holds: num("ホールド"),
      inningsPitched: parseInningsPitched(cellText("投球回")),
      hits: num("安打"),
      homeRuns: num("本塁打"),
      walks: num("四球"),
      hitByPitch: num("死球"),
      strikeouts: num("三振"),
      runs: num("失点"),
      earnedRuns: num("自責点"),
      era: num("防御率"),
    });
  });
  return result;
}

// 野球独自の投球回表記（アウトカウント端数）を実イニング数に変換する。".1"=1/3回、".2"=2/3回（実際の小数ではない）。
// "+"は「登板したが1アウトも取れずに降板」を表す特殊表記で、イニング数としては0
function parseInningsPitched(raw: string): number {
  if (raw.trim() === "+") return 0;
  const [wholeStr, fracStr] = raw.split(".");
  const whole = Number(wholeStr || 0);
  if (!fracStr) return whole;
  return whole + Number(fracStr) / 3;
}

export interface ParsedGame {
  date: string; // ISO (YYYY-MM-DD)
  homeTeamSlug: string;
  awayTeamSlug: string;
  homeScore: number | null;
  awayScore: number | null;
  isFinished: boolean;
  boxScoreUrl: string | null;
}

// npb.jp/games/{year}/schedule_{month}.html の月間日程。1日ごとに複数カードがネストしたテーブル。
// 各カードのtableは<a href="/scores/{year}/{MMDD}/{away}-{home}-{seriesNo}/">で囲まれており、
// 勝敗投手を取得するボックススコアページへのリンクとして使える
export function parseSchedule(html: string, year: number, month: number): ParsedGame[] {
  const $ = cheerio.load(html);
  const result: ParsedGame[] = [];

  $(".date").each((_, dateEl) => {
    const dayText = $(dateEl).text().trim();
    const day = Number(dayText);
    if (!day) return;

    // その日の日付セルを含む<td>の中にある試合カードのtableを走査
    const dayCell = $(dateEl).closest("td");
    dayCell.find("table").each((_, gameTable) => {
      const row = $(gameTable).find("tr").first();
      const team1Img = row.find("td.team1 img");
      const team2Img = row.find("td.team2 img");
      if (team1Img.length === 0 || team2Img.length === 0) return;

      const homeName = team1Img.attr("alt")?.trim() ?? "";
      const awayName = team2Img.attr("alt")?.trim() ?? "";
      const homeTeam = findTeamByName(homeName);
      const awayTeam = findTeamByName(awayName);
      if (!homeTeam || !awayTeam) return;

      const scores = row.find("td.score");
      const homeScoreText = $(scores[0]).text().trim();
      const awayScoreText = $(scores[1]).text().trim();
      const isFinished = /^\d+$/.test(homeScoreText) && /^\d+$/.test(awayScoreText);

      const href = $(gameTable).closest("a").attr("href");
      const boxScoreUrl = href ? new URL(href, "https://npb.jp").toString() : null;

      result.push({
        date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        homeTeamSlug: homeTeam.slug,
        awayTeamSlug: awayTeam.slug,
        homeScore: isFinished ? Number(homeScoreText) : null,
        awayScore: isFinished ? Number(awayScoreText) : null,
        isFinished,
        boxScoreUrl,
      });
    });
  });

  return result;
}

export interface ParsedDecision {
  winningPitcher: string | null;
  losingPitcher: string | null;
  savePitcher: string | null;
}

// npb.jp/scores/{year}/{MMDD}/{away}-{home}-{seriesNo}/ のボックススコアページから
// 【勝投手】【敗投手】【セーブ】（例: 「【勝投手】 才木 （7勝4敗）」）を抜き出す。
// どちらのチームの投手かの情報は無いため、呼び出し側でスコアの勝敗と突き合わせて判定する
export function parseBoxScoreDecision(html: string): ParsedDecision {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  const extract = (label: string) => {
    const match = text.match(new RegExp(`【${label}】\\s*([^\\s（]+)`));
    return match ? match[1] : null;
  };

  return {
    winningPitcher: extract("勝投手"),
    losingPitcher: extract("敗投手"),
    savePitcher: extract("セーブ"),
  };
}
