import type { Metadata } from "next";
import Link from "next/link";
import { formatDateJa } from "@/lib/date";
import { formatAvg } from "@/lib/format";
import { getLatestDayGames, getScheduledGames, pickClosestGame } from "@/lib/games";
import { GamesTabSwitcher } from "@/components/GamesTabSwitcher";
import { FavoriteTeamHighlight } from "@/components/FavoriteTeamHighlight";
import { getColumns } from "@/lib/microcms";
import { getPopularColumns } from "@/lib/columnViews";
import { ArticleCoverImage } from "@/components/ArticleCoverImage";
import { TEAM_THEME } from "@/lib/teamTheme";
import { RankBar } from "@/components/RankBar";
import { teamAbbr } from "@/lib/teamAbbr";
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

async function getLatestColumnsSafely() {
  try {
    const { contents } = await getColumns(4);
    return contents;
  } catch {
    // microCMS未設定のビルド環境でも失敗させない([slug]/page.tsxのgenerateStaticParamsと同じ考え方)
    return [];
  }
}

// TOPページの導線カードとヒーローの「キラーデータ」カードの両方に使う「今の一番」の生きた数字。
// 同じクエリ結果を使い回し、DB問い合わせを1回で済ませる
async function getHeroStats() {
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
            include: { team: true },
          })
        : null,
      prospectDate._max.date
        ? prisma.prospectRating.findFirst({
            where: { date: prospectDate._max.date, category: ProspectCategory.BATTING },
            orderBy: { rank: "asc" },
            include: { team: true },
          })
        : null,
      valueDate._max.date
        ? prisma.playerValueRating.findFirst({
            where: { date: valueDate._max.date },
            orderBy: { rank: "asc" },
            include: { team: true },
          })
        : null,
    ]);

    return { topTeam, topTitle, topProspect, topValue };
  } catch {
    // DB未接続のビルド環境でも失敗させない
    return { topTeam: null, topTitle: null, topProspect: null, topValue: null };
  }
}

type HeroStats = Awaited<ReturnType<typeof getHeroStats>>;

// 「注目データダッシュボード」共通カード枠。バッジ・右上の添え情報・本体・フッターの
// 4段構成に統一し、種類が違うデータ(確率/タイトル/独自指標/2軍)でも同じ視線の動きで読めるようにする
function DashboardCard({
  badgeLabel,
  badgeColor,
  badgeBg,
  corner,
  teamLine,
  value,
  valueUnit,
  ratio,
  footer,
  href,
}: {
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
  corner?: React.ReactNode;
  teamLine: string;
  value: string;
  valueUnit?: string;
  ratio?: number;
  footer: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="hover-lift flex flex-col justify-between rounded-2xl p-5 transition-shadow"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ color: badgeColor, background: badgeBg }}
          >
            {badgeLabel}
          </span>
          {corner}
        </div>
        <div className="text-sm font-semibold truncate" style={{ color: "var(--ink-secondary)" }}>
          {teamLine}
        </div>
        <div
          className="tabular-nums my-2"
          style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.75rem", color: "var(--ink)", lineHeight: 1.1 }}
        >
          {value}
          {valueUnit && (
            <span className="text-base font-bold ml-1" style={{ color: "var(--ink-muted)" }}>
              {valueUnit}
            </span>
          )}
        </div>
        {ratio !== undefined && (
          <div className="mb-1">
            <RankBar ratio={ratio} widthClassName="w-full" />
          </div>
        )}
      </div>
      <div
        className="text-xs pt-2 mt-2"
        style={{ borderTop: "1px solid var(--border)", color: "var(--ink-muted)" }}
      >
        {footer}
      </div>
    </Link>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null || Math.abs(delta) < 0.001) return null;
  return (
    <span
      className="text-xs font-bold whitespace-nowrap tabular-nums"
      style={{ color: delta > 0 ? "var(--good)" : "var(--critical)" }}
    >
      {delta > 0 ? "↑" : "↓"} {Math.abs(delta * 100).toFixed(1)}%
    </span>
  );
}

function HeroStatsRow({ hero, topTeamDelta }: { hero: HeroStats; topTeamDelta: number | null }) {
  const cards: React.ReactNode[] = [];

  if (hero.topTeam) {
    cards.push(
      <DashboardCard
        key="champ"
        badgeLabel="優勝確率 首位"
        badgeColor="var(--accent)"
        badgeBg="var(--accent-track)"
        corner={<DeltaBadge delta={topTeamDelta} />}
        teamLine={hero.topTeam.team.name}
        value={`${(hero.topTeam.probability * 100).toFixed(1)}`}
        valueUnit="%"
        ratio={hero.topTeam.probability}
        footer={
          <div className="flex justify-between">
            <span>順位表を見る</span>
            <span className="font-bold" style={{ color: TEAM_THEME[hero.topTeam.team.slug]?.accent ?? "var(--accent)" }}>
              →
            </span>
          </div>
        }
        href="/teams"
      />,
    );
  }

  if (hero.topTitle) {
    cards.push(
      <DashboardCard
        key="title"
        badgeLabel="タイトルレース"
        badgeColor="var(--category-amber)"
        badgeBg="var(--category-amber-soft)"
        corner={
          <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
            本塁打王
          </span>
        }
        teamLine={`${hero.topTitle.playerName}（${teamAbbr(hero.topTitle.team.slug)}）`}
        value={`${hero.topTitle.currentValue}`}
        valueUnit="本"
        footer={
          <div className="flex justify-between">
            <span>獲得確率</span>
            <span className="font-bold tabular-nums" style={{ color: "var(--ink)" }}>
              {(hero.topTitle.probability * 100).toFixed(1)}%
            </span>
          </div>
        }
        href="/titles"
      />,
    );
  }

  if (hero.topValue) {
    cards.push(
      <DashboardCard
        key="value"
        badgeLabel="独自指標 MVP"
        badgeColor="var(--category-purple)"
        badgeBg="var(--category-purple-soft)"
        corner={
          <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
            LABバリュー
          </span>
        }
        teamLine={`${hero.topValue.playerName}（${teamAbbr(hero.topValue.team.slug)}）`}
        value={hero.topValue.value.toFixed(2)}
        footer="総合貢献度の独自試算トップ"
        href="/analysis"
      />,
    );
  }

  if (hero.topProspect) {
    cards.push(
      <DashboardCard
        key="prospect"
        badgeLabel="2軍ブレイク候補"
        badgeColor="var(--category-emerald)"
        badgeBg="var(--category-emerald-soft)"
        corner={
          <span className="text-xs tracking-tight" style={{ color: "var(--category-amber)" }} aria-label="期待度: 最高評価">
            ★★★★★
          </span>
        }
        teamLine={`${hero.topProspect.playerName}（${teamAbbr(hero.topProspect.team.slug)}）`}
        value={formatAvg(hero.topProspect.translatedValue)}
        valueUnit="OPS"
        footer={
          <div className="flex justify-between">
            <span>1軍昇格期待度</span>
            <span className="font-bold" style={{ color: "var(--category-emerald)" }}>
              極めて高い
            </span>
          </div>
        }
        href="/prospects"
      />,
    );
  }

  if (cards.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--ink)" }}>
          <span aria-hidden className="w-2.5 h-6 rounded-full inline-block" style={{ background: "var(--accent)" }} />
          NPB LAB 注目データ
        </h2>
        <span className="text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
          毎日更新
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards}</div>
    </section>
  );
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
  probabilityDelta: number | null;
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
    const [champDates, standingsDate, titleDate] = await Promise.all([
      prisma.championshipProbability.findMany({
        distinct: ["date"],
        select: { date: true },
        orderBy: { date: "desc" },
        take: 2,
      }),
      prisma.standingsSnapshot.aggregate({ _max: { date: true } }),
      prisma.titleRaceProbability.aggregate({ _max: { date: true } }),
    ]);
    const [latestDate, previousDate] = [champDates[0]?.date, champDates[1]?.date];
    if (!latestDate || !standingsDate._max.date) return [];

    const [probs, previousProbs, standings, titleRows] = await Promise.all([
      prisma.championshipProbability.findMany({
        where: { date: latestDate },
        include: { team: true },
        orderBy: { probability: "desc" },
      }),
      previousDate ? prisma.championshipProbability.findMany({ where: { date: previousDate } }) : Promise.resolve([]),
      prisma.standingsSnapshot.findMany({ where: { date: standingsDate._max.date } }),
      titleDate._max.date
        ? prisma.titleRaceProbability.findMany({ where: { date: titleDate._max.date }, orderBy: { probability: "desc" } })
        : Promise.resolve([]),
    ]);

    const standingsByTeam = new Map(standings.map((s) => [s.teamId, s]));
    const previousProbByTeam = new Map(previousProbs.map((p) => [p.teamId, p]));
    const bestTitleByTeam = new Map<string, (typeof titleRows)[number]>();
    for (const row of titleRows) {
      if (!bestTitleByTeam.has(row.teamId)) bestTitleByTeam.set(row.teamId, row);
    }

    return probs.map((p, i) => {
      const standing = standingsByTeam.get(p.teamId);
      const title = bestTitleByTeam.get(p.teamId);
      const previous = previousProbByTeam.get(p.teamId);
      return {
        slug: p.team.slug,
        name: p.team.name,
        probability: p.probability,
        probabilityDelta: previous ? p.probability - previous.probability : null,
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
      className="hover-lift group block rounded-2xl p-5 mb-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center justify-between text-[11px] font-bold mb-3">
        <span className="px-2 py-0.5 rounded" style={{ background: "var(--page)", color: "var(--ink-secondary)" }}>
          今日の一戦
        </span>
        <span style={{ color: "var(--ink-muted)" }}>{label}</span>
      </div>
      <div className="flex items-center justify-between py-1">
        <div className="flex-1 text-left font-bold truncate" style={{ color: "var(--ink)" }}>
          {game.awayTeam.name}
        </div>
        <div
          className="px-4 tabular-nums tracking-wider group-hover:underline"
          style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.5rem", color: "var(--ink)" }}
        >
          {game.awayScore} - {game.homeScore}
        </div>
        <div className="flex-1 text-right font-bold truncate" style={{ color: "var(--ink-secondary)" }}>
          {game.homeTeam.name}
        </div>
      </div>
      {game.winningPitcher && (
        <p
          className="text-xs mt-3 pt-2 flex justify-between"
          style={{ borderTop: "1px solid var(--border)", color: "var(--ink-muted)" }}
        >
          <span>(勝) {game.winningPitcher}</span>
          {game.savePitcher && <span>(Ｓ) {game.savePitcher}</span>}
        </p>
      )}
    </Link>
  );
}

export default async function Home() {
  const [latestGames, scheduledGames, latestColumns, heroStats, teamHighlights, popularColumns] = await Promise.all([
    getLatestDayGames(),
    getScheduledGames(),
    getLatestColumnsSafely(),
    getHeroStats(),
    getTeamHighlights(),
    getPopularColumns("", 3),
  ]);
  const highlightGame = latestGames ? pickClosestGame(latestGames.games) : null;
  const [heroColumn, ...restColumns] = latestColumns;

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <div className="relative">
        {/* 朝日のような柔らかい光彩。ヒーロー部分のみの控えめな演出 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(27,117,222,0.10) 0%, rgba(27,117,222,0) 62%)",
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

        {popularColumns[0] && (
          <Link
            href={`/columns/${popularColumns[0].slug}`}
            className="hover-lift flex items-center gap-3 rounded-lg px-4 py-3 mb-8"
            style={{ background: "var(--surface-2)", borderLeft: "3px solid var(--accent)" }}
          >
            <span
              className="flex-none text-xs font-bold px-2 py-1 rounded"
              style={{ background: "var(--accent)", color: "#ffffff" }}
            >
              注目
            </span>
            <span className="text-sm min-w-0 truncate" style={{ fontWeight: 700, color: "var(--ink)" }}>
              {popularColumns[0].title}
            </span>
            <span className="ml-auto flex-none text-xs" style={{ color: "var(--accent)" }}>
              読む →
            </span>
          </Link>
        )}

        <HeroStatsRow hero={heroStats} topTeamDelta={teamHighlights[0]?.probabilityDelta ?? null} />

        {teamHighlights.length > 0 && <FavoriteTeamHighlight teams={teamHighlights} />}

        {latestGames && latestGames.games.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
                {formatDateJa(latestGames.date).replace(/^\d+年/, "")}の試合結果
              </h2>
              <Link href="/games" className="text-xs font-bold hover:underline" style={{ color: "var(--accent)" }}>
                もっと見る →
              </Link>
            </div>
            {highlightGame && <HighlightGame game={highlightGame} />}
            <GamesTabSwitcher
              resultsDateLabel={formatDateJa(latestGames.date).replace(/^\d+年/, "")}
              resultsGames={latestGames.games}
              scheduleGames={scheduledGames.map((g) => ({ ...g, date: g.date.toISOString() }))}
            />
          </section>
        )}
      </div>

      {popularColumns.length > 0 && (
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="flex items-center gap-2 font-semibold text-sm" style={{ color: "var(--ink)" }}>
              <span aria-hidden style={{ width: 9, height: 9, background: "var(--accent)", flex: "none", transform: "rotate(45deg)" }} />
              人気記事
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {popularColumns.map((c, i) => (
              <Link
                key={c.id}
                href={`/columns/${c.slug}`}
                className="hover-lift rounded-lg p-4 flex gap-3 items-start"
                style={{ background: "var(--surface)" }}
              >
                <span
                  className="flex-none text-lg leading-none"
                  style={{ fontFamily: "var(--font-heading)", fontWeight: 900, color: "var(--accent)" }}
                >
                  {i + 1}
                </span>
                <p className="text-sm leading-snug" style={{ fontWeight: 700, textWrap: "balance" }}>
                  {c.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

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
              className="hover-lift group grid gap-0 sm:grid-cols-2 mb-4 rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
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
                  className="hover-lift group flex gap-3 rounded-2xl overflow-hidden p-3"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
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

    </main>
  );
}
