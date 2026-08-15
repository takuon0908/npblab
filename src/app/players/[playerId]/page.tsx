import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Level } from "@prisma/client";
import { Table, Th, Td } from "@/components/Table";
import { StatTile } from "@/components/StatTile";
import { calcFipConstant, calcFip, calcWoba, calcWhip, calcKPercent, calcBBPercent } from "@/lib/sabermetrics";
import { generateBatterSummary, generatePitcherSummary } from "@/lib/playerSummary";
import { latestPerPlayer } from "@/lib/latestPerPlayer";
import { siteUrl } from "@/lib/siteUrl";
import { getPlayerSocialLinks } from "@/lib/playerSocialLinks";
import { PlayerSocialLinksRow } from "@/components/PlayerSocialLinks";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { ShareButton } from "@/components/ShareButton";
import { A8Banner } from "@/components/A8Banner";
import { getColumns } from "@/lib/microcms";
import { formatDateJa } from "@/lib/date";
import { formatAvg } from "@/lib/format";
import { calcPercentile } from "@/lib/percentile";
import { PercentileBar } from "@/components/PercentileBar";
import { StatTooltip } from "@/components/StatTooltip";

// データは1日1回(日次パイプライン)しか更新されないため24時間に緩めている(Supabase egress/Vercel ISR Writes対策)
export const revalidate = 86400;

// 選手数が多く全件のビルド時プリレンダーは重いため、初回アクセス時にオンデマンドでISR生成する
export async function generateStaticParams() {
  return [];
}

const LEVEL_LABEL: Record<Level, string> = {
  [Level.ICHIGUN]: "1軍",
  [Level.NIGUN]: "2軍",
};

// パーセンタイル評価(0-100)。今季1軍で規定条件を満たした選手プール内での相対位置
interface BattingPercentiles {
  avg: number;
  iso: number;
  woba: number;
  kPercent: number;
  bbPercent: number;
}
interface PitchingPercentiles {
  era: number;
  fip: number;
  whip: number;
  kPercent: number;
  bbPercent: number;
}

// 同一シーズン・同一レベルの中で最新日のスナップショットだけを年度別成績として残す
function latestBySeasonLevel<T extends { season: number; level: Level; date: Date }>(rows: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of rows) {
    const key = `${row.season}-${row.level}`;
    const current = map.get(key);
    if (!current || row.date > current.date) map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.season - a.season || (a.level === Level.ICHIGUN ? -1 : 1));
}

async function getPlayer(playerId: string) {
  const [battingRows, pitchingRows, valueRatings, prospectRatings] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { playerId }, include: { team: true }, orderBy: { date: "desc" } }),
    prisma.playerPitchingStat.findMany({ where: { playerId }, include: { team: true }, orderBy: { date: "desc" } }),
    prisma.playerValueRating.findMany({ where: { playerId }, orderBy: { date: "asc" } }),
    prisma.prospectRating.findMany({ where: { playerId }, orderBy: { date: "desc" }, take: 1 }),
  ]);

  if (battingRows.length === 0 && pitchingRows.length === 0) return null;

  const first = battingRows[0] ?? pitchingRows[0];
  const season = new Date().getFullYear();

  const currentBatting = battingRows.find((b) => b.season === season && b.level === Level.ICHIGUN) ?? null;
  const currentPitching = pitchingRows.find((p) => p.season === season && p.level === Level.ICHIGUN) ?? null;
  const currentNigunBatting = battingRows.find((b) => b.season === season && b.level === Level.NIGUN) ?? null;
  const currentNigunPitching = pitchingRows.find((p) => p.season === season && p.level === Level.NIGUN) ?? null;

  // FIPはリーグ全体の防御率に較正する定数が必要なため、現シーズンの1軍投手陣全体を取得する
  // ついでに同じデータから防御率の順位・パーセンタイル評価を算出し、選手ページで使う
  let fipConstant: number | null = null;
  let pitchingRank: { rank: number; total: number } | null = null;
  let pitchingPercentiles: PitchingPercentiles | null = null;
  if (currentPitching) {
    const seasonPitchers = await prisma.playerPitchingStat.findMany({ where: { season, level: Level.ICHIGUN } });
    const latestSeasonPitchers = latestPerPlayer(seasonPitchers);
    fipConstant = calcFipConstant(latestSeasonPitchers);

    const qualified = latestSeasonPitchers.filter((p) => p.inningsPitched >= 10);
    const byEra = [...qualified].sort((a, b) => a.era - b.era);
    const rank = byEra.findIndex((p) => p.playerId === playerId) + 1;
    if (rank > 0) pitchingRank = { rank, total: qualified.length };

    if (qualified.length >= 5 && qualified.some((p) => p.playerId === playerId)) {
      // 打者対戦数(打席数)そのものはDBに無いため、投球回から簡易推定する
      // (1イニングあたり平均4.3打席という一般的な近似値を使用)
      const withDerived = qualified.map((p) => {
        const estimatedBattersFaced = p.inningsPitched * 4.3;
        return {
          playerId: p.playerId,
          era: p.era,
          fip: calcFip(p, fipConstant!),
          whip: calcWhip(p),
          kPercent: calcKPercent({ strikeouts: p.strikeouts, plateAppearances: estimatedBattersFaced }),
          bbPercent: calcBBPercent({ walks: p.walks + p.hitByPitch, plateAppearances: estimatedBattersFaced }),
        };
      });
      const me = withDerived.find((p) => p.playerId === playerId)!;
      pitchingPercentiles = {
        era: calcPercentile(me.era, withDerived.map((p) => p.era), false),
        fip: calcPercentile(me.fip, withDerived.map((p) => p.fip), false),
        whip: calcPercentile(me.whip, withDerived.map((p) => p.whip), false),
        kPercent: calcPercentile(me.kPercent, withDerived.map((p) => p.kPercent), true),
        bbPercent: calcPercentile(me.bbPercent, withDerived.map((p) => p.bbPercent), false),
      };
    }
  }

  // 打率の順位・パーセンタイル評価も同様に、今季1軍で打数のある選手全体の中での位置づけを算出する
  let battingRank: { rank: number; total: number } | null = null;
  let battingPercentiles: BattingPercentiles | null = null;
  if (currentBatting) {
    const seasonBatters = await prisma.playerBattingStat.findMany({ where: { season, level: Level.ICHIGUN } });
    const qualified = latestPerPlayer(seasonBatters).filter((b) => b.atBats > 0);
    const byAvg = [...qualified].sort((a, b) => b.avg - a.avg);
    const rank = byAvg.findIndex((b) => b.playerId === playerId) + 1;
    if (rank > 0) battingRank = { rank, total: qualified.length };

    if (qualified.length >= 5 && qualified.some((b) => b.playerId === playerId)) {
      const withDerived = qualified.map((b) => ({
        playerId: b.playerId,
        avg: b.avg,
        iso: b.slg - b.avg,
        woba: calcWoba(b),
        kPercent: calcKPercent(b),
        bbPercent: calcBBPercent(b),
      }));
      const me = withDerived.find((b) => b.playerId === playerId)!;
      battingPercentiles = {
        avg: calcPercentile(me.avg, withDerived.map((b) => b.avg), true),
        iso: calcPercentile(me.iso, withDerived.map((b) => b.iso), true),
        woba: calcPercentile(me.woba, withDerived.map((b) => b.woba), true),
        kPercent: calcPercentile(me.kPercent, withDerived.map((b) => b.kPercent), false),
        bbPercent: calcPercentile(me.bbPercent, withDerived.map((b) => b.bbPercent), true),
      };
    }
  }

  // 選手ページが行き止まりにならないよう、同球団のLABバリュー上位選手を関連選手として案内する
  const latestValue = valueRatings.at(-1) ?? null;
  let teammates: { playerId: string; playerName: string; value: number }[] = [];
  if (latestValue) {
    const teamRatings = await prisma.playerValueRating.findMany({
      where: { teamId: first.team.id, date: latestValue.date },
      orderBy: { rank: "asc" },
    });
    teammates = teamRatings.filter((r) => r.playerId !== playerId).slice(0, 5);
  }

  return {
    playerName: first.playerName,
    team: first.team,
    currentBatting,
    currentPitching,
    currentNigunBatting,
    currentNigunPitching,
    fipConstant,
    battingRank,
    pitchingRank,
    battingPercentiles,
    pitchingPercentiles,
    battingHistory: latestBySeasonLevel(battingRows),
    pitchingHistory: latestBySeasonLevel(pitchingRows),
    valueRatings,
    prospectRating: prospectRatings[0] ?? null,
    teammates,
  };
}

// 選手ページが行き止まりにならないよう最新コラムへの導線も添える(microCMS未設定のビルド環境でも失敗させない)
async function getLatestColumnsSafely() {
  try {
    const { contents } = await getColumns(3);
    return contents;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ playerId: string }>;
}): Promise<Metadata> {
  const { playerId: rawPlayerId } = await params;
  const playerId = decodeURIComponent(rawPlayerId);
  const player = await getPlayer(playerId);
  if (!player) return {};

  // 今シーズンの現役データが無い(引退・故障者等)選手は解説文が生成できず内容が薄いため、評価対象から外す
  const hasCurrentSeasonData =
    player.currentBatting || player.currentPitching || player.currentNigunBatting || player.currentNigunPitching;

  return {
    title: `${player.playerName} 成績・データ`,
    description: `${player.playerName}(${player.team.name})の最新成績、LABバリュー、セイバーメトリクス指標をシーズン推移で掲載。`,
    alternates: { canonical: `/players/${playerId}` },
    ...(hasCurrentSeasonData ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function PlayerPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId: rawPlayerId } = await params;
  const playerId = decodeURIComponent(rawPlayerId);
  const [player, latestColumns] = await Promise.all([getPlayer(playerId), getLatestColumnsSafely()]);
  if (!player) notFound();

  const woba = player.currentBatting ? calcWoba(player.currentBatting) : null;
  const kPercent = player.currentBatting ? calcKPercent(player.currentBatting) : null;
  const bbPercent = player.currentBatting ? calcBBPercent(player.currentBatting) : null;
  const fip = player.currentPitching && player.fipConstant !== null ? calcFip(player.currentPitching, player.fipConstant) : null;
  const whip = player.currentPitching ? calcWhip(player.currentPitching) : null;

  const battingSummary = player.currentBatting
    ? generateBatterSummary({
        avg: player.currentBatting.avg,
        homeRuns: player.currentBatting.homeRuns,
        stolenBases: player.currentBatting.stolenBases,
        kPercent: kPercent ?? 0,
        bbPercent: bbPercent ?? 0,
        atBats: player.currentBatting.atBats,
        avgRank: player.battingRank?.rank ?? null,
        totalQualified: player.battingRank?.total ?? null,
      })
    : "";
  const pitchingSummary = player.currentPitching
    ? generatePitcherSummary({
        era: player.currentPitching.era,
        saves: player.currentPitching.saves,
        holds: player.currentPitching.holds,
        appearances: player.currentPitching.appearances,
        inningsPitched: player.currentPitching.inningsPitched,
        strikeouts: player.currentPitching.strikeouts,
        walks: player.currentPitching.walks + player.currentPitching.hitByPitch,
        eraRank: player.pitchingRank?.rank ?? null,
        totalQualified: player.pitchingRank?.total ?? null,
      })
    : "";
  const nigunBattingSummary =
    !player.currentBatting && player.currentNigunBatting
      ? generateBatterSummary({
          avg: player.currentNigunBatting.avg,
          homeRuns: player.currentNigunBatting.homeRuns,
          stolenBases: player.currentNigunBatting.stolenBases,
          kPercent: calcKPercent(player.currentNigunBatting),
          bbPercent: calcBBPercent(player.currentNigunBatting),
          atBats: player.currentNigunBatting.atBats,
        })
      : "";
  const nigunPitchingSummary =
    !player.currentPitching && player.currentNigunPitching
      ? generatePitcherSummary({
          era: player.currentNigunPitching.era,
          saves: player.currentNigunPitching.saves,
          holds: player.currentNigunPitching.holds,
          appearances: player.currentNigunPitching.appearances,
          inningsPitched: player.currentNigunPitching.inningsPitched,
          strikeouts: player.currentNigunPitching.strikeouts,
          walks: player.currentNigunPitching.walks + player.currentNigunPitching.hitByPitch,
        })
      : "";
  const scoutingReport = [battingSummary, pitchingSummary, nigunBattingSummary, nigunPitchingSummary]
    .filter(Boolean)
    .join(" ");

  const latestValue = player.valueRatings.at(-1) ?? null;
  const socialLinks = getPlayerSocialLinks(playerId);
  const sameAs = [
    socialLinks?.x?.url,
    socialLinks?.instagram?.url,
    socialLinks?.youtube?.url,
    socialLinks?.fanclub?.url,
    socialLinks?.wikipedia?.url,
  ].filter((url): url is string => Boolean(url));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "プロ野球LAB", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "選手" },
      { "@type": "ListItem", position: 3, name: player.playerName },
    ],
  };

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: player.playerName,
    url: `${siteUrl}/players/${playerId}`,
    jobTitle: "プロ野球選手",
    affiliation: { "@type": "SportsTeam", name: player.team.name, url: `${siteUrl}/teams/${player.team.slug}` },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />

      <nav className="mb-8 text-xs" style={{ color: "var(--ink-muted)" }} aria-label="パンくずリスト">
        <Link href="/" className="hover:underline">
          プロ野球LAB
        </Link>
        <span className="mx-1.5">›</span>
        <span>選手</span>
      </nav>

      <div className="flex items-start gap-4">
        <PlayerPortrait playerId={playerId} playerName={player.playerName} />
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
            <Link href={`/teams/${player.team.slug}`} className="hover:underline" style={{ color: "var(--accent)" }}>
              {player.team.name}
            </Link>
          </p>
          <h1 className="text-2xl font-black">{player.playerName}</h1>
          <PlayerSocialLinksRow links={socialLinks} />
        </div>
      </div>
      <div className="mt-3">
        <ShareButton title={`${player.playerName}(${player.team.name})の成績・データ`} url={`${siteUrl}/players/${playerId}`} />
      </div>
      <div className="mb-8" />

      {scoutingReport && (
        <div
          className="rounded-none p-5 mb-8"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="text-sm mb-2" style={{ color: "var(--ink-muted)" }}>
            LAB分析レポート
          </div>
          <p className="leading-relaxed">{scoutingReport}</p>
          <p className="text-xs mt-2" style={{ color: "var(--ink-muted)" }}>
            今シーズンの実成績から当サイトが独自に生成した分析コメントです。
          </p>
        </div>
      )}

      {!player.currentBatting && !player.currentPitching && (
        <p className="text-sm mb-8" style={{ color: "var(--ink-secondary)" }}>
          {new Date().getFullYear()}年の1軍成績データはまだありません。
          {(player.currentNigunBatting || player.currentNigunPitching) && "2軍成績は下部をご覧ください。"}
        </p>
      )}

      {player.currentBatting && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-muted)" }}>
            今シーズン打撃成績（1軍）
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
            <StatTile label="打率" value={formatAvg(player.currentBatting.avg)} />
            <StatTile label="本塁打" value={`${player.currentBatting.homeRuns}本`} />
            <StatTile label="打点" value={`${player.currentBatting.rbi}打点`} />
            <StatTile label="盗塁" value={`${player.currentBatting.stolenBases}盗塁`} />
            <StatTile label="OPS" value={formatAvg(player.currentBatting.obp + player.currentBatting.slg)} />
            {woba !== null && <StatTile label="wOBA" value={formatAvg(woba)} />}
            {kPercent !== null && <StatTile label="K%" value={`${(kPercent * 100).toFixed(1)}%`} />}
            {bbPercent !== null && <StatTile label="BB%" value={`${(bbPercent * 100).toFixed(1)}%`} />}
          </dl>

          {player.battingPercentiles && (
            <div
              className="grid gap-x-6 gap-y-4 sm:grid-cols-2 mb-4 rounded-lg p-4"
              style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
            >
              <PercentileBar
                label={<StatTooltip label="打率" definition="打数に占める安打の割合。純粋なコンタクト力の指標" />}
                percentile={player.battingPercentiles.avg}
                displayValue={formatAvg(player.currentBatting.avg)}
              />
              <PercentileBar
                label={<StatTooltip label="長打力(ISO)" definition="長打率-打率。単打を除いた長打だけの力を示す" />}
                percentile={player.battingPercentiles.iso}
                displayValue={formatAvg(player.currentBatting.slg - player.currentBatting.avg)}
              />
              <PercentileBar
                label={<StatTooltip label="wOBA" definition="出塁の質を単打・長打・四死球で重みづけした総合打撃指標" />}
                percentile={player.battingPercentiles.woba}
                displayValue={woba !== null ? formatAvg(woba) : "―"}
              />
              <PercentileBar
                label={<StatTooltip label="選球眼(BB%)" definition="打席に占める四球の割合。高いほど選球眼が良い" />}
                percentile={player.battingPercentiles.bbPercent}
                displayValue={bbPercent !== null ? `${(bbPercent * 100).toFixed(1)}%` : "―"}
              />
              <PercentileBar
                label={<StatTooltip label="コンタクト(K%)" definition="打席に占める三振の割合。低いほど当てる技術が高い(逆順で評価)" />}
                percentile={player.battingPercentiles.kPercent}
                displayValue={kPercent !== null ? `${(kPercent * 100).toFixed(1)}%` : "―"}
              />
            </div>
          )}

          <Table>
            <thead>
              <tr>
                <Th align="right">試合</Th>
                <Th align="right">打数</Th>
                <Th align="right">安打</Th>
                <Th align="right">二塁打</Th>
                <Th align="right">三塁打</Th>
                <Th align="right">四死球</Th>
                <Th align="right">三振</Th>
                <Th align="right">盗塁刺</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td align="right">{player.currentBatting.games}</Td>
                <Td align="right">{player.currentBatting.atBats}</Td>
                <Td align="right">{player.currentBatting.hits}</Td>
                <Td align="right">{player.currentBatting.doubles}</Td>
                <Td align="right">{player.currentBatting.triples}</Td>
                <Td align="right">{player.currentBatting.walks + player.currentBatting.hitByPitch}</Td>
                <Td align="right">{player.currentBatting.strikeouts}</Td>
                <Td align="right">{player.currentBatting.caughtStealing}</Td>
              </tr>
            </tbody>
          </Table>
        </div>
      )}

      {player.currentPitching && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-muted)" }}>
            今シーズン投手成績（1軍）
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
            <StatTile label="防御率" value={player.currentPitching.era.toFixed(2)} />
            <StatTile
              label="勝敗"
              value={`${player.currentPitching.wins}勝${player.currentPitching.losses}敗`}
            />
            <StatTile label="セーブ" value={`${player.currentPitching.saves}S`} />
            <StatTile label="奪三振" value={`${player.currentPitching.strikeouts}奪三振`} />
            {whip !== null && <StatTile label="WHIP" value={whip.toFixed(2)} />}
            {fip !== null && <StatTile label="FIP" value={fip.toFixed(2)} />}
          </dl>

          {player.pitchingPercentiles && (
            <div
              className="grid gap-x-6 gap-y-4 sm:grid-cols-2 mb-4 rounded-lg p-4"
              style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
            >
              <PercentileBar
                label={<StatTooltip label="防御率" definition="9イニングあたりの自責点。低いほど良い(逆順で評価)" />}
                percentile={player.pitchingPercentiles.era}
                displayValue={player.currentPitching.era.toFixed(2)}
              />
              <PercentileBar
                label={<StatTooltip label="FIP" definition="本塁打・四死球・奪三振だけから算出する、守備に依存しない投手指標" />}
                percentile={player.pitchingPercentiles.fip}
                displayValue={fip !== null ? fip.toFixed(2) : "―"}
              />
              <PercentileBar
                label={<StatTooltip label="WHIP" definition="1イニングあたりの与四球+被安打数。低いほど良い(逆順で評価)" />}
                percentile={player.pitchingPercentiles.whip}
                displayValue={whip !== null ? whip.toFixed(2) : "―"}
              />
              <PercentileBar
                label={<StatTooltip label="奪三振力(K%)" definition="投球回から推定した、対戦打者に占める奪三振の割合" />}
                percentile={player.pitchingPercentiles.kPercent}
                displayValue={`${player.currentPitching.strikeouts}奪三振`}
              />
              <PercentileBar
                label={<StatTooltip label="制球力(BB%)" definition="投球回から推定した、対戦打者に占める与四死球の割合。低いほど良い(逆順で評価)" />}
                percentile={player.pitchingPercentiles.bbPercent}
                displayValue={`${player.currentPitching.walks + player.currentPitching.hitByPitch}与四死球`}
              />
            </div>
          )}

          <Table>
            <thead>
              <tr>
                <Th align="right">登板</Th>
                <Th align="right">投球回</Th>
                <Th align="right">被安打</Th>
                <Th align="right">被本塁打</Th>
                <Th align="right">四死球</Th>
                <Th align="right">奪三振</Th>
                <Th align="right">ホールド</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td align="right">{player.currentPitching.appearances}</Td>
                <Td align="right">{player.currentPitching.inningsPitched.toFixed(1)}</Td>
                <Td align="right">{player.currentPitching.hits}</Td>
                <Td align="right">{player.currentPitching.homeRuns}</Td>
                <Td align="right">{player.currentPitching.walks + player.currentPitching.hitByPitch}</Td>
                <Td align="right">{player.currentPitching.strikeouts}</Td>
                <Td align="right">{player.currentPitching.holds}</Td>
              </tr>
            </tbody>
          </Table>
        </div>
      )}

      {(player.currentNigunBatting || player.currentNigunPitching) && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-muted)" }}>
            今シーズン成績（2軍）
          </h2>
          {player.currentNigunBatting && (
            <p className="text-sm mb-2">
              打率 <span className="font-semibold">{formatAvg(player.currentNigunBatting.avg)}</span>　本塁打{" "}
              {player.currentNigunBatting.homeRuns}本　打点 {player.currentNigunBatting.rbi}
            </p>
          )}
          {player.currentNigunPitching && (
            <p className="text-sm mb-2">
              防御率 <span className="font-semibold">{player.currentNigunPitching.era.toFixed(2)}</span>
              {player.currentNigunPitching.wins}勝{player.currentNigunPitching.losses}敗　奪三振{" "}
              {player.currentNigunPitching.strikeouts}
            </p>
          )}
          {player.prospectRating && (
            <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
              当サイト独自の分析・試算による1軍換算値は
              <Link href="/prospects" className="mx-1 hover:underline" style={{ color: "var(--accent)" }}>
                2軍注目選手ランキング
              </Link>
              をご覧ください。
            </p>
          )}
        </div>
      )}

      {latestValue && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-muted)" }}>
            LABバリュー
          </h2>
          <p className="text-sm">
            全体<span className="font-semibold">{latestValue.rank}位</span>（値:{" "}
            <span className="font-semibold">{latestValue.value.toFixed(2)}</span>）
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
            当サイト独自の分析・試算です。算出方法は
            <Link href="/about/methodology" className="mx-1 hover:underline" style={{ color: "var(--accent)" }}>
              算出方法について
            </Link>
            をご覧ください。
          </p>
        </div>
      )}

      {(player.battingHistory.length > 0 || player.pitchingHistory.length > 0) && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-muted)" }}>
            年度別成績
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 min-w-0">
            {player.battingHistory.length > 0 && (
              <Table>
                <thead>
                  <tr>
                    <Th>年度</Th>
                    <Th align="right">打率</Th>
                    <Th align="right">本塁打</Th>
                    <Th align="right">打点</Th>
                  </tr>
                </thead>
                <tbody>
                  {player.battingHistory.map((b) => (
                    <tr key={`${b.season}-${b.level}`} className="hover:bg-white/[0.05]">
                      <Td>
                        {b.season}年
                        <span className="text-xs ml-1" style={{ color: "var(--ink-muted)" }}>
                          {LEVEL_LABEL[b.level]}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{formatAvg(b.avg)}</span>
                      </Td>
                      <Td align="right" muted>
                        {b.homeRuns}本
                      </Td>
                      <Td align="right" muted>
                        {b.rbi}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            {player.pitchingHistory.length > 0 && (
              <Table>
                <thead>
                  <tr>
                    <Th>年度</Th>
                    <Th align="right">防御率</Th>
                    <Th align="right">勝敗</Th>
                    <Th align="right">奪三振</Th>
                  </tr>
                </thead>
                <tbody>
                  {player.pitchingHistory.map((p) => (
                    <tr key={`${p.season}-${p.level}`} className="hover:bg-white/[0.05]">
                      <Td>
                        {p.season}年
                        <span className="text-xs ml-1" style={{ color: "var(--ink-muted)" }}>
                          {LEVEL_LABEL[p.level]}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{p.era.toFixed(2)}</span>
                      </Td>
                      <Td align="right" muted>
                        {p.wins}勝{p.losses}敗
                      </Td>
                      <Td align="right" muted>
                        {p.strikeouts}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      )}

      <A8Banner />

      {player.teammates.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-muted)" }}>
            {player.team.name}の他の注目選手
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {player.teammates.map((t) => (
              <Link
                key={t.playerId}
                href={`/players/${t.playerId}`}
                className="hover-lift flex items-center justify-between gap-2 px-3 py-2 text-sm"
                style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}
              >
                <span className="hover:underline">{t.playerName}</span>
                <span className="text-xs tabular-nums" style={{ color: "var(--ink-muted)" }}>
                  LABバリュー {t.value.toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {latestColumns.length > 0 && (
        <div className="mt-12">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--ink-muted)" }}>
              最新コラム
            </h2>
            <Link href="/columns" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
              もっと見る →
            </Link>
          </div>
          <div className="grid gap-2">
            {latestColumns.map((c) => (
              <Link
                key={c.id}
                href={`/columns/${c.slug}`}
                className="hover-lift flex items-baseline justify-between gap-3 px-3 py-2 text-sm"
                style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}
              >
                <span className="hover:underline">{c.title}</span>
                <span className="text-xs whitespace-nowrap" style={{ color: "var(--ink-muted)" }}>
                  {formatDateJa(new Date(c.publishedAt))}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
