import type { Metadata } from "next";
import Link from "next/link";
import { formatDateJa } from "@/lib/date";
import { getLatestDayGames, pickClosestGame } from "@/lib/games";
import { FavoriteAwareGameGrid } from "@/components/FavoriteAwareGameGrid";
import { FavoriteTeamHighlight } from "@/components/FavoriteTeamHighlight";
import { getColumns } from "@/lib/microcms";
import { ArticleCoverImage } from "@/components/ArticleCoverImage";
import { TEAM_THEME } from "@/lib/teamTheme";
import { prisma } from "@/lib/prisma";
import { TitleCategory, ProspectCategory } from "@prisma/client";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

// データは1日1回(日次パイプライン)しか更新されないため、それより高頻度で再取得しても
// 表示は変わらずDBの読み取り(Supabase egress)やVercelのISR Writesを無駄に消費するだけ。24時間に緩めている
export const revalidate = 86400;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const sections: {
  href: string;
  label: string;
  desc: string;
  teaserKey: "teams" | "titles" | "prospects" | "analysis" | "columns";
}[] = [
  { href: "/teams", label: "球団別 優勝確率", desc: "残り試合シミュレーションによる優勝確率の推移", teaserKey: "teams" },
  { href: "/titles", label: "タイトルレース", desc: "打者・投手タイトルの獲得確率を日次更新", teaserKey: "titles" },
  { href: "/prospects", label: "2軍注目選手", desc: "2軍成績を1軍換算した昇格候補ランキング", teaserKey: "prospects" },
  { href: "/analysis", label: "LABバリュー", desc: "セイバーメトリクスで算出する独自のMVPランキング", teaserKey: "analysis" },
  { href: "/columns", label: "コラム", desc: "分析記事・考察", teaserKey: "columns" },
];

async function getLatestColumnsSafely() {
  try {
    const { contents } = await getColumns(4);
    return contents;
  } catch {
    // microCMS未設定のビルド環境でも失敗させない([slug]/page.tsxのgenerateStaticParamsと同じ考え方)
    return [];
  }
}

// TOPページの導線カードに添える「今の一番」の生きた数字。取得できない項目はdescの静的文言にフォールバックする
async function getSectionTeasers(): Promise<Record<string, string | null>> {
  try {
    const [champDate, titleDate, prospectDate, valueDate] = await Promise.all([
      prisma.championshipProbability.aggregate({ _max: { date: true } }),
      prisma.titleRaceProbability.aggregate({ _max: { date: true } }),
      prisma.prospectRating.aggregate({ _max: { date: true } }),
      prisma.playerValueRating.aggregate({ _max: { date: true } }),
    ]);

    const [topTeam, topTitle, topProspect, topValue] = await Promise.all([
      champDate._max.date
        ? prisma.championshipProbability.findFirst({
            where: { date: champDate._max.date },
            orderBy: { probability: "desc" },
            include: { team: true },
          })
        : null,
      titleDate._max.date
        ? prisma.titleRaceProbability.findFirst({
            where: { date: titleDate._max.date, category: TitleCategory.HOME_RUNS },
            orderBy: { currentValue: "desc" },
          })
        : null,
      prospectDate._max.date
        ? prisma.prospectRating.findFirst({
            where: { date: prospectDate._max.date, category: ProspectCategory.BATTING },
            orderBy: { rank: "asc" },
          })
        : null,
      valueDate._max.date
        ? prisma.playerValueRating.findFirst({
            where: { date: valueDate._max.date },
            orderBy: { rank: "asc" },
          })
        : null,
    ]);

    return {
      teams: topTeam ? `首位 ${topTeam.team.name} 優勝確率${(topTeam.probability * 100).toFixed(1)}%` : null,
      titles: topTitle ? `本塁打王 ${topTitle.playerName} ${topTitle.currentValue}本` : null,
      prospects: topProspect ? `1位 ${topProspect.playerName} 換算OPS ${topProspect.translatedValue.toFixed(3)}` : null,
      analysis: topValue ? `MVP ${topValue.playerName} LABバリュー${topValue.value.toFixed(2)}` : null,
      columns: null,
    };
  } catch {
    // DB未接続のビルド環境でも失敗させない
    return { teams: null, titles: null, prospects: null, analysis: null, columns: null };
  }
}

const TITLE_CATEGORY_SHORT_LABEL: Partial<Record<TitleCategory, string>> = {
  [TitleCategory.BATTING_AVERAGE]: "首位打者",
  [TitleCategory.HOME_RUNS]: "本塁打王",
  [TitleCategory.RBI]: "打点王",
  [TitleCategory.STOLEN_BASES]: "盗塁王",
  [TitleCategory.WINS]: "最多勝",
  [TitleCategory.ERA]: "防御率",
  [TitleCategory.STRIKEOUTS]: "最多奪三振",
  [TitleCategory.SAVES]: "最多セーブ",
  [TitleCategory.HOLDS]: "最多ホールド",
};

export interface TeamHighlight {
  slug: string;
  name: string;
  probability: number;
  rank: number;
  wins: number;
  losses: number;
  gamesBehind: number;
  topTitleCandidate: { playerName: string; label: string; probability: number } | null;
}

// お気に入り球団のパーソナライズ表示用に、全12球団分をまとめて1回で取得しておく。
// (お気に入りはブラウザのlocalStorageにしか無くサーバー側からは分からないため、
// 「どの球団が選ばれても対応できるデータ」を先に渡し、選別はクライアント側で行う)
async function getTeamHighlights(): Promise<TeamHighlight[]> {
  try {
    const [champDate, standingsDate, titleDate] = await Promise.all([
      prisma.championshipProbability.aggregate({ _max: { date: true } }),
      prisma.standingsSnapshot.aggregate({ _max: { date: true } }),
      prisma.titleRaceProbability.aggregate({ _max: { date: true } }),
    ]);
    if (!champDate._max.date || !standingsDate._max.date) return [];

    const [probs, standings, titleRows] = await Promise.all([
      prisma.championshipProbability.findMany({
        where: { date: champDate._max.date },
        include: { team: true },
        orderBy: { probability: "desc" },
      }),
      prisma.standingsSnapshot.findMany({ where: { date: standingsDate._max.date } }),
      titleDate._max.date
        ? prisma.titleRaceProbability.findMany({ where: { date: titleDate._max.date }, orderBy: { probability: "desc" } })
        : Promise.resolve([]),
    ]);

    const standingsByTeam = new Map(standings.map((s) => [s.teamId, s]));
    const bestTitleByTeam = new Map<string, (typeof titleRows)[number]>();
    for (const row of titleRows) {
      if (!bestTitleByTeam.has(row.teamId)) bestTitleByTeam.set(row.teamId, row);
    }

    return probs.map((p, i) => {
      const standing = standingsByTeam.get(p.teamId);
      const title = bestTitleByTeam.get(p.teamId);
      return {
        slug: p.team.slug,
        name: p.team.name,
        probability: p.probability,
        rank: i + 1,
        wins: standing?.wins ?? 0,
        losses: standing?.losses ?? 0,
        gamesBehind: standing?.gamesBehind ?? 0,
        topTitleCandidate: title
          ? {
              playerName: title.playerName,
              label: TITLE_CATEGORY_SHORT_LABEL[title.category] ?? "タイトル候補",
              probability: title.probability,
            }
          : null,
      };
    });
  } catch {
    return [];
  }
}

function HighlightGame({ game }: { game: NonNullable<Awaited<ReturnType<typeof getLatestDayGames>>>["games"][number] }) {
  const margin = Math.abs(game.homeScore! - game.awayScore!);
  const homeWin = game.homeScore! > game.awayScore!;
  const winner = homeWin ? game.homeTeam : game.awayTeam;
  const label = margin === 1 ? "1点差の大接戦" : `僅差の${margin}点差ゲーム`;

  return (
    <Link
      href={`/teams/${winner.slug}`}
      className="hover-lift group block p-4 mb-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderLeft: `4px solid ${TEAM_THEME[winner.slug]?.accent ?? "var(--accent)"}` }}
    >
      <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--accent)" }}>
        今日の一戦 ・ {label}
      </p>
      <p className="text-base font-bold group-hover:underline" style={{ fontFamily: "var(--font-heading)" }}>
        {game.awayTeam.name} {game.awayScore}-{game.homeScore} {game.homeTeam.name}
      </p>
      {game.winningPitcher && (
        <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
          勝投手: {game.winningPitcher}
          {game.savePitcher && ` ・ セーブ: ${game.savePitcher}`}
        </p>
      )}
    </Link>
  );
}

export default async function Home() {
  const [latestGames, latestColumns, teasers, teamHighlights] = await Promise.all([
    getLatestDayGames(),
    getLatestColumnsSafely(),
    getSectionTeasers(),
    getTeamHighlights(),
  ]);
  const highlightGame = latestGames ? pickClosestGame(latestGames.games) : null;
  const [heroColumn, ...restColumns] = latestColumns;

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <div className="relative">
        {/* ナイター照明が上から柔らかく当たっているような光彩。ヒーロー部分のみの控えめな演出 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(240,168,60,0.14) 0%, rgba(240,168,60,0) 62%)",
          }}
        />
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--accent)" }}>
          プロ野球LAB
        </p>
        <h1
          className="text-2xl mb-10 leading-snug sm:text-3xl"
          style={{ fontFamily: "var(--font-heading)", fontWeight: 900, letterSpacing: "0.01em", textWrap: "balance" }}
        >
          野球を科学する。NPBのデータを独自に分析し、優勝確率・タイトル獲得確率を毎日更新します。
        </h1>

        {teamHighlights.length > 0 && <FavoriteTeamHighlight teams={teamHighlights} />}

        {latestGames && latestGames.games.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="flex items-center gap-2 font-semibold text-sm" style={{ color: "var(--ink)" }}>
                <span aria-hidden style={{ width: 9, height: 9, background: "var(--accent)", flex: "none", transform: "rotate(45deg)" }} />
                {formatDateJa(latestGames.date)}の試合結果
              </h2>
              <Link href="/games" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
                もっと見る →
              </Link>
            </div>
            {highlightGame && <HighlightGame game={highlightGame} />}
            <FavoriteAwareGameGrid games={latestGames.games} />
          </section>
        )}
      </div>

      {latestColumns.length > 0 && (
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="flex items-center gap-2 font-semibold text-sm" style={{ color: "var(--ink)" }}>
              <span aria-hidden style={{ width: 9, height: 9, background: "var(--accent)", flex: "none", transform: "rotate(45deg)" }} />
              最新コラム
            </h2>
            <Link href="/columns" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
              もっと見る →
            </Link>
          </div>
          {heroColumn && (
            <Link
              href={`/columns/${heroColumn.slug}`}
              className="hover-lift group grid gap-0 sm:grid-cols-2 mb-4 rounded-none overflow-hidden"
              style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
            >
              <div className="aspect-video sm:aspect-auto sm:h-full">
                <ArticleCoverImage
                  slug={heroColumn.slug}
                  text={`${heroColumn.title} ${stripHtml(heroColumn.body)}`}
                  category={heroColumn.category}
                  tags={heroColumn.tags}
                  showCategoryBadge
                  priority
                />
              </div>
              <div className="p-6 flex flex-col justify-center">
                <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
                  {formatDateJa(new Date(heroColumn.publishedAt))} ・ 新着
                </p>
                <h3
                  className="text-xl mb-0 leading-snug group-hover:underline sm:text-2xl"
                  style={{ fontFamily: "var(--font-heading)", fontWeight: 800, textWrap: "balance" }}
                >
                  {heroColumn.title}
                </h3>
              </div>
            </Link>
          )}

          {restColumns.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {restColumns.map((c) => (
                <Link
                  key={c.id}
                  href={`/columns/${c.slug}`}
                  className="hover-lift group flex gap-3 rounded-none overflow-hidden p-3"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}
                >
                  <div className="w-20 aspect-square flex-none">
                    <ArticleCoverImage slug={c.slug} text={`${c.title} ${stripHtml(c.body)}`} category={c.category} tags={c.tags} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs mb-1" style={{ color: "var(--ink-muted)" }}>
                      {formatDateJa(new Date(c.publishedAt))}
                      {c.category && c.category.length > 0 && ` ・ ${c.category[0]}`}
                    </p>
                    <p
                      className="text-sm leading-snug group-hover:underline"
                      style={{ fontWeight: 700, textWrap: "balance" }}
                    >
                      {c.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => {
          const teaser = teasers[s.teaserKey];
          return (
            <Link
              key={s.href}
              href={s.href}
              className="hover-lift group block rounded-none p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}
            >
              <div className="flex items-center gap-2 font-semibold">
                <span aria-hidden style={{ width: 9, height: 9, background: "var(--accent)", flex: "none", transform: "rotate(45deg)" }} />
                <span className="group-hover:underline">{s.label}</span>
              </div>
              {teaser ? (
                <div className="text-sm mt-1.5 font-semibold tabular-nums" style={{ color: "var(--accent)" }}>
                  {teaser}
                </div>
              ) : (
                <div className="text-sm mt-1.5" style={{ color: "var(--ink-secondary)" }}>
                  {s.desc}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
