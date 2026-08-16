import type { Metadata } from "next";
import Link from "next/link";
import { getPlayerComparisonData, type PlayerComparisonData } from "@/lib/playerCompare";
import { CompareForm } from "@/components/CompareForm";
import { PercentileBar } from "@/components/PercentileBar";
import { StatTooltip } from "@/components/StatTooltip";
import { formatAvg } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { Level } from "@prisma/client";
import { latestPerPlayer } from "@/lib/latestPerPlayer";

export const revalidate = 3600;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string; p2?: string }>;
}): Promise<Metadata> {
  const { p1, p2 } = await searchParams;
  if (!p1 || !p2) {
    return {
      title: "選手比較",
      description: "NPBの選手2人を、パーセンタイルバーで主要指標を横並び比較。",
      alternates: { canonical: "/compare" },
    };
  }
  const [a, b] = await Promise.all([getPlayerComparisonData(p1), getPlayerComparisonData(p2)]);
  if (!a || !b) return { title: "選手比較", alternates: { canonical: "/compare" } };
  return {
    title: `${a.playerName} vs ${b.playerName} 成績比較`,
    description: `${a.playerName}(${a.teamName})と${b.playerName}(${b.teamName})の今季成績をパーセンタイルで比較。`,
    alternates: { canonical: `/compare?p1=${encodeURIComponent(p1)}&p2=${encodeURIComponent(p2)}` },
  };
}

const BATTING_METRICS: { key: string; label: string; definition: string; format: (v: number) => string }[] = [
  { key: "avg", label: "打率", definition: "安打数を打数で割った基本指標。", format: (v) => formatAvg(v) },
  { key: "iso", label: "長打力(ISO)", definition: "長打率−打率。単打を除いた長打の生産力。", format: (v) => formatAvg(v) },
  { key: "woba", label: "wOBA", definition: "出塁の質を単打・長打・四死球で重みづけした総合打撃指標。", format: (v) => formatAvg(v) },
  { key: "homeRuns", label: "本塁打", definition: "シーズン本塁打数。", format: (v) => `${v}本` },
  { key: "kPercent", label: "コンタクト力(K%)", definition: "打席に占める三振の割合。低いほどコンタクトが良い。", format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: "bbPercent", label: "選球眼(BB%)", definition: "打席に占める四球の割合。高いほど選球眼が良い。", format: (v) => `${(v * 100).toFixed(1)}%` },
];

const PITCHING_METRICS: { key: string; label: string; definition: string; format: (v: number) => string }[] = [
  { key: "era", label: "防御率", definition: "9イニングあたりの自責点。低いほど良い。", format: (v) => v.toFixed(2) },
  { key: "fip", label: "FIP", definition: "守備・運に依存しない、本塁打・四死球・奪三振だけで算出した防御率相当の指標。", format: (v) => v.toFixed(2) },
  { key: "whip", label: "WHIP", definition: "1イニングあたりに出した走者数。低いほど良い。", format: (v) => v.toFixed(2) },
  { key: "strikeouts", label: "奪三振", definition: "シーズン奪三振数。", format: (v) => `${v}個` },
  { key: "kPercent", label: "奪三振力(K%)", definition: "打者対戦数に占める奪三振の割合。高いほど良い。", format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: "bbPercent", label: "制球力(BB%)", definition: "打者対戦数に占める与四球の割合。低いほど良い。", format: (v) => `${(v * 100).toFixed(1)}%` },
];

// トップページと同じ「実データから機械的に選ぶ」方針。現在の本塁打王争い上位2名・
// 防御率争い上位2名(規定投球回相当に達している投手のみ)を比較ページへの導線として提示する
async function getSuggestedMatchups() {
  const season = new Date().getFullYear();
  const [battingRows, pitchingRows] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { level: Level.ICHIGUN, season }, include: { team: true } }),
    prisma.playerPitchingStat.findMany({ where: { level: Level.ICHIGUN, season }, include: { team: true } }),
  ]);

  const hrLeaders = [...latestPerPlayer(battingRows)]
    .sort((a, b) => b.homeRuns - a.homeRuns)
    .slice(0, 2);

  const eraLeaders = [...latestPerPlayer(pitchingRows)]
    .filter((p) => p.inningsPitched >= 40)
    .sort((a, b) => a.era - b.era)
    .slice(0, 2);

  const matchups: { title: string; sub: string; p1: string; p2: string; p1Name: string; p2Name: string }[] = [];
  if (hrLeaders.length === 2) {
    matchups.push({
      title: "本塁打王争い",
      sub: `${hrLeaders[0].playerName} ${hrLeaders[0].homeRuns}本 vs ${hrLeaders[1].playerName} ${hrLeaders[1].homeRuns}本`,
      p1: hrLeaders[0].playerId,
      p2: hrLeaders[1].playerId,
      p1Name: hrLeaders[0].playerName,
      p2Name: hrLeaders[1].playerName,
    });
  }
  if (eraLeaders.length === 2) {
    matchups.push({
      title: "防御率争い",
      sub: `${eraLeaders[0].playerName} ${eraLeaders[0].era.toFixed(2)} vs ${eraLeaders[1].playerName} ${eraLeaders[1].era.toFixed(2)}`,
      p1: eraLeaders[0].playerId,
      p2: eraLeaders[1].playerId,
      p1Name: eraLeaders[0].playerName,
      p2Name: eraLeaders[1].playerName,
    });
  }
  return matchups;
}

function SuggestedMatchups({ matchups }: { matchups: Awaited<ReturnType<typeof getSuggestedMatchups>> }) {
  if (matchups.length === 0) return null;
  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ink-secondary)" }}>
        人気の比較
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {matchups.map((m) => (
          <Link
            key={m.title}
            href={`/compare?p1=${encodeURIComponent(m.p1)}&p2=${encodeURIComponent(m.p2)}`}
            className="hover-lift rounded-2xl p-4 block"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>
              {m.title}
            </div>
            <div className="text-sm font-medium tabular-nums">{m.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MetricRow({
  metric,
  a,
  b,
}: {
  metric: { key: string; label: string; definition: string; format: (v: number) => string };
  a: PlayerComparisonData;
  b: PlayerComparisonData;
}) {
  const statA = (a.stats as unknown as Record<string, number>)[metric.key];
  const statB = (b.stats as unknown as Record<string, number>)[metric.key];
  const pctA = a.percentiles?.[metric.key] ?? null;
  const pctB = b.percentiles?.[metric.key] ?? null;

  return (
    <div className="mb-5">
      <div className="mb-2 text-xs font-semibold" style={{ color: "var(--ink-secondary)" }}>
        <StatTooltip label={metric.label} definition={metric.definition} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {pctA !== null ? (
          <PercentileBar label={a.playerName} percentile={pctA} displayValue={metric.format(statA)} />
        ) : (
          <StatFallback name={a.playerName} value={metric.format(statA)} />
        )}
        {pctB !== null ? (
          <PercentileBar label={b.playerName} percentile={pctB} displayValue={metric.format(statB)} />
        ) : (
          <StatFallback name={b.playerName} value={metric.format(statB)} />
        )}
      </div>
    </div>
  );
}

function StatFallback({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-xs">
      <span style={{ color: "var(--ink-secondary)" }}>{name}</span>
      <span className="tabular-nums font-semibold" style={{ color: "var(--ink)" }}>
        {value}
      </span>
    </div>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string; p2?: string }>;
}) {
  const { p1, p2 } = await searchParams;

  const [a, b] = p1 && p2 ? await Promise.all([getPlayerComparisonData(p1), getPlayerComparisonData(p2)]) : [null, null];

  const bothFound = a && b;
  const sameType = bothFound && a.type === b.type;
  const matchups = bothFound ? [] : await getSuggestedMatchups();

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-black mb-2">選手比較</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-secondary)" }}>
        NPBの選手2人を選んで、今季1軍成績をリーグ内パーセンタイルで横並び比較します。同じ打者同士・投手同士のみ比較できます。
      </p>

      {!bothFound && (
        <>
          <CompareForm />
          {(p1 || p2) && (
            <p className="mt-4 text-sm" style={{ color: "var(--critical)" }}>
              選手が見つかりませんでした。もう一度検索して選び直してください。
            </p>
          )}
          <SuggestedMatchups matchups={matchups} />
        </>
      )}

      {bothFound && !sameType && (
        <div className="rounded-lg p-5 text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {a.playerName}は{a.type === "batting" ? "打者" : "投手"}、{b.playerName}は{b.type === "batting" ? "打者" : "投手"}
          のため比較できません。同じ打者同士・投手同士を選んでください。
          <div className="mt-4">
            <CompareForm initialP1Name={a.playerName} initialP2Name={b.playerName} />
          </div>
        </div>
      )}

      {bothFound && sameType && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            {[a, b].map((p) => (
              <Link
                key={p.playerId}
                href={`/players/${encodeURIComponent(p.playerId)}`}
                className="rounded-lg p-4 hover:opacity-80 transition-opacity"
                style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}
              >
                <div className="text-lg font-bold">{p.playerName}</div>
                <div className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  {p.teamName} ・ {p.type === "batting" ? "打者" : "投手"} ・ {p.stats.games}試合出場
                </div>
              </Link>
            ))}
          </div>

          <div className="mb-6 text-center">
            <CompareResetLink />
          </div>

          {(a.type === "batting" ? BATTING_METRICS : PITCHING_METRICS).map((metric) => (
            <MetricRow key={metric.key} metric={metric} a={a} b={b} />
          ))}

          {(!a.percentiles || !b.percentiles) && (
            <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
              ※ 規定打席・規定投球回未到達などでリーグ内パーセンタイルを算出できない項目は、実数のみを表示しています。
            </p>
          )}
        </>
      )}
    </main>
  );
}

function CompareResetLink() {
  return (
    <Link href="/compare" className="text-sm hover:underline" style={{ color: "var(--accent)" }}>
      別の選手で比較する →
    </Link>
  );
}
