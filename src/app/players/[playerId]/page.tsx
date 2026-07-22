import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Level } from "@prisma/client";
import { Table, Th, Td } from "@/components/Table";
import { StatTile } from "@/components/StatTile";
import { calcFipConstant, calcFip, calcWoba, calcWhip, calcKPercent, calcBBPercent } from "@/lib/sabermetrics";
import { latestPerPlayer } from "@/lib/latestPerPlayer";

export const revalidate = 3600;

// 選手数が多く全件のビルド時プリレンダーは重いため、初回アクセス時にオンデマンドでISR生成する
export async function generateStaticParams() {
  return [];
}

const LEVEL_LABEL: Record<Level, string> = {
  [Level.ICHIGUN]: "1軍",
  [Level.NIGUN]: "2軍",
};

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
  let fipConstant: number | null = null;
  if (currentPitching) {
    const seasonPitchers = await prisma.playerPitchingStat.findMany({ where: { season, level: Level.ICHIGUN } });
    fipConstant = calcFipConstant(latestPerPlayer(seasonPitchers));
  }

  return {
    playerName: first.playerName,
    team: first.team,
    currentBatting,
    currentPitching,
    currentNigunBatting,
    currentNigunPitching,
    fipConstant,
    battingHistory: latestBySeasonLevel(battingRows),
    pitchingHistory: latestBySeasonLevel(pitchingRows),
    valueRatings,
    prospectRating: prospectRatings[0] ?? null,
  };
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

  return {
    title: `${player.playerName} 成績・データ`,
    description: `${player.playerName}(${player.team.name})の最新成績、LABバリュー、セイバーメトリクス指標をシーズン推移で掲載。`,
    alternates: { canonical: `/players/${playerId}` },
  };
}

export default async function PlayerPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId: rawPlayerId } = await params;
  const playerId = decodeURIComponent(rawPlayerId);
  const player = await getPlayer(playerId);
  if (!player) notFound();

  const woba = player.currentBatting ? calcWoba(player.currentBatting) : null;
  const kPercent = player.currentBatting ? calcKPercent(player.currentBatting) : null;
  const bbPercent = player.currentBatting ? calcBBPercent(player.currentBatting) : null;
  const fip = player.currentPitching && player.fipConstant !== null ? calcFip(player.currentPitching, player.fipConstant) : null;
  const whip = player.currentPitching ? calcWhip(player.currentPitching) : null;

  const latestValue = player.valueRatings.at(-1) ?? null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
        <Link href={`/teams/${player.team.slug}`} className="hover:underline" style={{ color: "var(--accent)" }}>
          {player.team.name}
        </Link>
      </p>
      <h1 className="text-2xl font-bold mb-8">{player.playerName}</h1>

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
            <StatTile label="打率" value={player.currentBatting.avg.toFixed(3)} />
            <StatTile label="本塁打" value={`${player.currentBatting.homeRuns}本`} />
            <StatTile label="打点" value={`${player.currentBatting.rbi}打点`} />
            <StatTile label="盗塁" value={`${player.currentBatting.stolenBases}盗塁`} />
            <StatTile label="OPS" value={(player.currentBatting.obp + player.currentBatting.slg).toFixed(3)} />
            {woba !== null && <StatTile label="wOBA" value={woba.toFixed(3)} />}
            {kPercent !== null && <StatTile label="K%" value={`${(kPercent * 100).toFixed(1)}%`} />}
            {bbPercent !== null && <StatTile label="BB%" value={`${(bbPercent * 100).toFixed(1)}%`} />}
          </dl>
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
              打率 <span className="font-semibold">{player.currentNigunBatting.avg.toFixed(3)}</span>　本塁打{" "}
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
                    <tr key={`${b.season}-${b.level}`} className="hover:bg-black/[0.03]">
                      <Td>
                        {b.season}年
                        <span className="text-xs ml-1" style={{ color: "var(--ink-muted)" }}>
                          {LEVEL_LABEL[b.level]}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold">{b.avg.toFixed(3)}</span>
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
                    <tr key={`${p.season}-${p.level}`} className="hover:bg-black/[0.03]">
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
    </main>
  );
}
