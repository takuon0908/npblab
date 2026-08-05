import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TitleCategory, Level } from "@prisma/client";
import { Table, Th, Td } from "@/components/Table";
import { RankBar } from "@/components/RankBar";
import { PlayerSocialIcons } from "@/components/PlayerSocialLinks";
import { getPlayerSocialLinks } from "@/lib/playerSocialLinks";
import { latestPerPlayer } from "@/lib/latestPerPlayer";
import { TEAM_THEME } from "@/lib/teamTheme";
import { siteUrl } from "@/lib/siteUrl";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { RankBadge } from "@/components/RankBadge";

function TeamDot({ slug }: { slug: string }) {
  return (
    <span
      aria-hidden
      className="inline-block rounded-full mr-1"
      style={{ width: 6, height: 6, background: TEAM_THEME[slug]?.accent ?? "var(--ink-muted)" }}
    />
  );
}

// NPBの規定打席・規定投球回の定義（チーム試合数を基準にした変動値）
const QUALIFYING_PA_PER_GAME = 3.1;
const QUALIFYING_IP_PER_GAME = 1;

// データは1日1回(日次パイプライン)しか更新されないため6時間に緩めている(Supabase egress対策)
export const revalidate = 21600;

export const metadata: Metadata = {
  title: "プロ野球タイトルレース 獲得確率ランキング",
  description:
    "本塁打王・打点王・盗塁王・最多勝・最多奪三振・最多セーブ・最多ホールドの獲得確率を日次シミュレーションで算出。首位打者・防御率は規定到達者の現在値も掲載。",
  alternates: { canonical: "/titles" },
};

const CATEGORY_LABELS: Record<TitleCategory, string> = {
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

// 成績の単位。打率・防御率のような比率成績は単位を付けない前提（未対応カテゴリなので実質未使用）
const CATEGORY_UNITS: Partial<Record<TitleCategory, string>> = {
  [TitleCategory.HOME_RUNS]: "本",
  [TitleCategory.RBI]: "打点",
  [TitleCategory.STOLEN_BASES]: "盗塁",
  [TitleCategory.WINS]: "勝",
  [TitleCategory.STRIKEOUTS]: "奪三振",
  [TitleCategory.SAVES]: "セーブ",
  [TitleCategory.HOLDS]: "ホールド",
};

// 打率・防御率は比率成績で規定打席/投球回の判定が必要になるため、シミュレーション未対応（TODO）
const IMPLEMENTED_CATEGORIES: TitleCategory[] = [
  TitleCategory.HOME_RUNS,
  TitleCategory.RBI,
  TitleCategory.STOLEN_BASES,
  TitleCategory.WINS,
  TitleCategory.STRIKEOUTS,
  TitleCategory.SAVES,
  TitleCategory.HOLDS,
];

async function getTitleRaces() {
  const latest = await prisma.titleRaceProbability.aggregate({ _max: { date: true } });
  if (!latest._max.date) return null;

  // 確率はあくまで当サイト独自のシミュレーション値なので、並び順は実際の成績(currentValue)を主役にする
  const rows = await prisma.titleRaceProbability.findMany({
    where: { date: latest._max.date },
    include: { team: true },
    orderBy: { currentValue: "desc" },
  });

  const byCategory = new Map<TitleCategory, typeof rows>();
  for (const row of rows) {
    const list = byCategory.get(row.category) ?? [];
    list.push(row);
    byCategory.set(row.category, list);
  }
  return byCategory;
}

// 打率・防御率は比率成績のため、規定打席/投球回に到達した選手の「現在値」のみを集計する。
// カウント成績のような残り試合シミュレーションは行っていない（確率を出せない理由は/columns参照）
async function getRateStatLeaders() {
  const standingsLatest = await prisma.standingsSnapshot.aggregate({ _max: { date: true } });
  if (!standingsLatest._max.date) return null;

  const standings = await prisma.standingsSnapshot.findMany({ where: { date: standingsLatest._max.date } });
  const teamGames = new Map(standings.map((s) => [s.teamId, s.wins + s.losses + s.draws]));

  const season = new Date().getFullYear();
  const [battingRows, pitchingRows] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { level: Level.ICHIGUN, season }, include: { team: true } }),
    prisma.playerPitchingStat.findMany({ where: { level: Level.ICHIGUN, season }, include: { team: true } }),
  ]);

  const qualifiedBatters = latestPerPlayer(battingRows)
    .filter((b) => b.plateAppearances >= (teamGames.get(b.teamId) ?? 0) * QUALIFYING_PA_PER_GAME)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  const qualifiedPitchers = latestPerPlayer(pitchingRows)
    .filter((p) => p.inningsPitched >= (teamGames.get(p.teamId) ?? 0) * QUALIFYING_IP_PER_GAME)
    .sort((a, b) => a.era - b.era)
    .slice(0, 5);

  return { qualifiedBatters, qualifiedPitchers };
}

function itemListJsonLd(name: string, items: { playerId: string; playerName: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.playerName,
      url: `${siteUrl}/players/${item.playerId}`,
    })),
  };
}

export default async function TitlesPage() {
  const byCategory = await getTitleRaces();
  const rateStats = await getRateStatLeaders();

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-black mb-2">タイトルレース</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-secondary)" }}>
        獲得確率は、シーズン残り試合をコンピュータで1万回シミュレーションし、そのタイトルを獲得した試行の割合です。
      </p>

      {!byCategory ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          データがありません。<code>npm run scrape</code> と <code>npm run simulate</code> を実行してください。
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 min-w-0">
          {IMPLEMENTED_CATEGORIES.map((category) => {
            const rows = (byCategory.get(category) ?? []).slice(0, 5);
            const unit = CATEGORY_UNITS[category] ?? "";
            return (
              <div key={category}>
                {rows.length > 0 && (
                  /* eslint-disable-next-line react/no-danger */
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                      __html: JSON.stringify(itemListJsonLd(`${CATEGORY_LABELS[category]}獲得確率ランキング`, rows)),
                    }}
                  />
                )}
                <h2 className="font-semibold mb-3">{CATEGORY_LABELS[category]}</h2>
                {rows.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                    データなし
                  </p>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>選手</Th>
                        <Th align="right">現在</Th>
                        <Th align="right">獲得確率</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={row.playerId} className="hover:bg-white/[0.05]">
                          <Td>
                            <div className="flex items-start gap-2.5">
                              <RankBadge rank={i + 1} />
                              <PlayerPortrait playerId={row.playerId} playerName={row.playerName} size={32} rounded />
                              <div style={{ maxWidth: 115 }}>
                                <Link href={`/players/${row.playerId}`} className="hover:underline font-medium">
                                  {row.playerName}
                                </Link>
                                <Link
                                  href={`/teams/${row.team.slug}`}
                                  className="text-xs hover:underline inline-flex items-center gap-1"
                                  style={{ color: "var(--ink-secondary)" }}
                                >
                                  <TeamDot slug={row.team.slug} />
                                  {row.team.name}
                                </Link>
                                <div className="mt-1">
                                  <PlayerSocialIcons links={getPlayerSocialLinks(row.playerId)} />
                                </div>
                              </div>
                            </div>
                          </Td>
                          <Td align="right">
                            <div className="font-semibold text-base">
                              {row.currentValue}
                              {unit}
                            </div>
                            <div className="text-xs" style={{ color: "var(--ink-muted)" }}>
                              予測 {row.projectedValue.toFixed(1)}
                              {unit}
                            </div>
                          </Td>
                          <Td align="right" muted>
                            <div className="flex flex-col items-end gap-1.5">
                              <span>{(row.probability * 100).toFixed(1)}%</span>
                              <RankBar ratio={row.probability} />
                            </div>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rateStats && (
        <div className="mt-12">
          {rateStats.qualifiedBatters.length > 0 && (
            /* eslint-disable-next-line react/no-danger */
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(itemListJsonLd("首位打者ランキング", rateStats.qualifiedBatters)),
              }}
            />
          )}
          {rateStats.qualifiedPitchers.length > 0 && (
            /* eslint-disable-next-line react/no-danger */
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(itemListJsonLd("防御率ランキング", rateStats.qualifiedPitchers)),
              }}
            />
          )}
          <h2 className="font-semibold mb-1">首位打者・防御率（規定到達者）</h2>
          <p className="text-xs mb-4" style={{ color: "var(--ink-muted)" }}>
            規定打席（チーム試合数×3.1）・規定投球回（チーム試合数×1）に到達した選手の現在値です。
            比率成績のため、当サイトの残り試合シミュレーションによる獲得確率は算出していません。規定未到達の選手も含めた
            <Link href="/titles/batting-average" className="mx-1 hover:underline" style={{ color: "var(--accent)" }}>
              打率
            </Link>
            /
            <Link href="/titles/era" className="mx-1 hover:underline" style={{ color: "var(--accent)" }}>
              防御率
            </Link>
            の全選手ランキングも見られます。
          </p>
          <div className="grid gap-8 sm:grid-cols-2 min-w-0">
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-secondary)" }}>
                首位打者
              </h3>
              {rateStats.qualifiedBatters.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                  規定打席到達者なし
                </p>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>選手</Th>
                      <Th align="right">打率</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateStats.qualifiedBatters.map((b, i) => (
                      <tr key={b.playerId} className="hover:bg-white/[0.05]">
                        <Td>
                          <div className="flex items-start gap-2.5">
                            <RankBadge rank={i + 1} />
                            <PlayerPortrait playerId={b.playerId} playerName={b.playerName} size={32} rounded />
                            <div style={{ maxWidth: 115 }}>
                              <Link href={`/players/${b.playerId}`} className="hover:underline font-medium">
                                {b.playerName}
                              </Link>
                              <Link
                                href={`/teams/${b.team.slug}`}
                                className="text-xs hover:underline inline-flex items-center gap-1"
                                style={{ color: "var(--ink-secondary)" }}
                              >
                                <TeamDot slug={b.team.slug} />
                                {b.team.name}
                              </Link>
                              <div className="mt-1">
                                <PlayerSocialIcons links={getPlayerSocialLinks(b.playerId)} />
                              </div>
                            </div>
                          </div>
                        </Td>
                        <Td align="right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="font-semibold text-base">{b.avg.toFixed(3)}</span>
                            <RankBar ratio={b.avg / rateStats.qualifiedBatters[0].avg} />
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-secondary)" }}>
                防御率
              </h3>
              {rateStats.qualifiedPitchers.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                  規定投球回到達者なし
                </p>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>選手</Th>
                      <Th align="right">防御率</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateStats.qualifiedPitchers.map((p, i) => (
                      <tr key={p.playerId} className="hover:bg-white/[0.05]">
                        <Td>
                          <div className="flex items-start gap-2.5">
                            <RankBadge rank={i + 1} />
                            <PlayerPortrait playerId={p.playerId} playerName={p.playerName} size={32} rounded />
                            <div style={{ maxWidth: 115 }}>
                              <Link href={`/players/${p.playerId}`} className="hover:underline font-medium">
                                {p.playerName}
                              </Link>
                              <Link
                                href={`/teams/${p.team.slug}`}
                                className="text-xs hover:underline inline-flex items-center gap-1"
                                style={{ color: "var(--ink-secondary)" }}
                              >
                                <TeamDot slug={p.team.slug} />
                                {p.team.name}
                              </Link>
                              <div className="mt-1">
                                <PlayerSocialIcons links={getPlayerSocialLinks(p.playerId)} />
                              </div>
                            </div>
                          </div>
                        </Td>
                        <Td align="right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="font-semibold text-base">{p.era.toFixed(2)}</span>
                            <RankBar ratio={rateStats.qualifiedPitchers[0].era / p.era} />
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
