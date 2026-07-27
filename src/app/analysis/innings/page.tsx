import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Table, Th, Td } from "@/components/Table";
import { TEAM_THEME } from "@/lib/teamTheme";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "イニング別 得点・失点傾向",
  description:
    "各球団の1〜9回・延長ごとの平均得点・平均失点を独自集計。序盤型か終盤型か、リリーフ陣が強いか粘れないかといった傾向を可視化。",
  alternates: { canonical: "/analysis/innings" },
};

const INNING_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "延長"];
const EXTRA_INNING_INDEX = 9; // 9回(index 8)より後ろは全部「延長」バケットにまとめる

interface TeamInningStats {
  teamId: string;
  teamName: string;
  teamSlug: string;
  games: number;
  scored: number[]; // index 0-9(延長)
  allowed: number[];
}

async function getInningTendency(): Promise<TeamInningStats[]> {
  const teams = await prisma.team.findMany();
  const games = await prisma.game.findMany({
    where: { isFinished: true, homeInnings: { isEmpty: false } },
    select: { homeTeamId: true, awayTeamId: true, homeInnings: true, awayInnings: true },
  });

  const statsByTeam = new Map<string, TeamInningStats>(
    teams.map((t) => [
      t.id,
      { teamId: t.id, teamName: t.name, teamSlug: t.slug, games: 0, scored: new Array(10).fill(0), allowed: new Array(10).fill(0) },
    ])
  );

  function addInnings(target: number[], innings: number[]) {
    innings.forEach((runs, i) => {
      const bucket = i >= EXTRA_INNING_INDEX ? EXTRA_INNING_INDEX : i;
      target[bucket] += runs;
    });
  }

  for (const g of games) {
    const home = statsByTeam.get(g.homeTeamId);
    const away = statsByTeam.get(g.awayTeamId);
    if (home) {
      home.games++;
      addInnings(home.scored, g.homeInnings);
      addInnings(home.allowed, g.awayInnings);
    }
    if (away) {
      away.games++;
      addInnings(away.scored, g.awayInnings);
      addInnings(away.allowed, g.homeInnings);
    }
  }

  return Array.from(statsByTeam.values()).filter((t) => t.games > 0);
}

function average(total: number, games: number): number {
  return games > 0 ? total / games : 0;
}

function heatColor(value: number, max: number, positive: boolean): string {
  if (max <= 0) return "transparent";
  const ratio = Math.min(1, value / max);
  const color = positive ? "34,197,94" : "239,68,68"; // good(緑) / critical(赤)
  return `rgba(${color},${(ratio * 0.35).toFixed(2)})`;
}

export default async function InningsAnalysisPage() {
  const stats = await getInningTendency();

  const maxScored = Math.max(...stats.flatMap((t) => t.scored.map((v, i) => average(v, t.games))));
  const maxAllowed = Math.max(...stats.flatMap((t) => t.allowed.map((v, i) => average(v, t.games))));

  const sorted = [...stats].sort((a, b) => b.games - a.games);

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">イニング別 得点・失点傾向</h1>
      <p className="text-sm mb-10" style={{ color: "var(--ink-secondary)" }}>
        今シーズンの全試合を回ごとに分解し、球団別の平均得点・平均失点を独自に集計。序盤に強いのか終盤に強いのか、リリーフ陣が終盤に踏ん張れているかといった傾向が見える。「延長」は10回以降の合計。
      </p>

      <section className="mb-12">
        <h2 className="font-semibold mb-3">回別 平均得点(自チームが挙げた点)</h2>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>球団</Th>
                {INNING_LABELS.map((label) => (
                  <Th key={label} align="right">
                    {label}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.teamId}>
                  <Td>
                    <Link href={`/teams/${t.teamSlug}`} className="hover:underline inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="rounded-full"
                        style={{ width: 8, height: 8, flex: "none", background: TEAM_THEME[t.teamSlug]?.accent ?? "var(--ink-muted)" }}
                      />
                      {t.teamName}
                    </Link>
                  </Td>
                  {t.scored.map((total, i) => {
                    const avg = average(total, t.games);
                    return (
                      <Td key={i} align="right">
                        <span
                          className="inline-block px-1.5 py-0.5 tabular-nums"
                          style={{ background: heatColor(avg, maxScored, true) }}
                        >
                          {avg.toFixed(2)}
                        </span>
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-semibold mb-3">回別 平均失点(相手に与えた点)</h2>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>球団</Th>
                {INNING_LABELS.map((label) => (
                  <Th key={label} align="right">
                    {label}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.teamId}>
                  <Td>
                    <Link href={`/teams/${t.teamSlug}`} className="hover:underline inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="rounded-full"
                        style={{ width: 8, height: 8, flex: "none", background: TEAM_THEME[t.teamSlug]?.accent ?? "var(--ink-muted)" }}
                      />
                      {t.teamName}
                    </Link>
                  </Td>
                  {t.allowed.map((total, i) => {
                    const avg = average(total, t.games);
                    return (
                      <Td key={i} align="right">
                        <span
                          className="inline-block px-1.5 py-0.5 tabular-nums"
                          style={{ background: heatColor(avg, maxAllowed, false) }}
                        >
                          {avg.toFixed(2)}
                        </span>
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>

      <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
        本ページの数値は当サイトが試合ごとの回別得点をnpb.jp公式のボックススコアから集計した独自試算であり、NPB公式の発表数値ではない。ホームチームが9回裏の攻撃を行わずに勝利した試合(サヨナラ等)は、その回の得点を「0」として扱っているため、特にホームゲームが多い/接戦に強い球団は9回の平均得点がやや低めに出る傾向がある点に留意されたい。
      </p>
    </main>
  );
}
