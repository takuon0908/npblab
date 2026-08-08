import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Table, Th, Td } from "@/components/Table";
import { TEAM_THEME } from "@/lib/teamTheme";

// データは1日1回(日次パイプライン)しか更新されないため24時間に緩めている(Supabase egress/Vercel ISR Writes対策)
export const revalidate = 86400;

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
  // 先制した試合の数・そのうち勝った数
  scoredFirstGames: number;
  scoredFirstWins: number;
  // 6回終了時点でリードしていた試合の数・そのうち逃げ切った(勝った)数
  ledAfter6Games: number;
  ledAfter6Wins: number;
}

// 先攻(away)は各回の表、後攻(home)は各回の裏に攻撃するため、
// 回を追って先に得点した方が「先制」チーム
function whoScoredFirst(homeInnings: number[], awayInnings: number[]): "home" | "away" | null {
  const len = Math.max(homeInnings.length, awayInnings.length);
  for (let i = 0; i < len; i++) {
    if ((awayInnings[i] ?? 0) > 0) return "away";
    if ((homeInnings[i] ?? 0) > 0) return "home";
  }
  return null;
}

function leaderAfter6(homeInnings: number[], awayInnings: number[]): "home" | "away" | "tie" | null {
  if (homeInnings.length < 6 || awayInnings.length < 6) return null; // 6回に達していない試合は対象外
  const homeSum = homeInnings.slice(0, 6).reduce((a, b) => a + b, 0);
  const awaySum = awayInnings.slice(0, 6).reduce((a, b) => a + b, 0);
  if (homeSum > awaySum) return "home";
  if (awaySum > homeSum) return "away";
  return "tie";
}

async function getInningTendency(): Promise<TeamInningStats[]> {
  const teams = await prisma.team.findMany();
  const games = await prisma.game.findMany({
    where: { isFinished: true, homeInnings: { isEmpty: false } },
    select: {
      homeTeamId: true,
      awayTeamId: true,
      homeInnings: true,
      awayInnings: true,
      homeScore: true,
      awayScore: true,
    },
  });

  const statsByTeam = new Map<string, TeamInningStats>(
    teams.map((t) => [
      t.id,
      {
        teamId: t.id,
        teamName: t.name,
        teamSlug: t.slug,
        games: 0,
        scored: new Array(10).fill(0),
        allowed: new Array(10).fill(0),
        scoredFirstGames: 0,
        scoredFirstWins: 0,
        ledAfter6Games: 0,
        ledAfter6Wins: 0,
      },
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
    const homeWon = (g.homeScore ?? 0) > (g.awayScore ?? 0);
    const awayWon = (g.awayScore ?? 0) > (g.homeScore ?? 0);

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

    const firstScorer = whoScoredFirst(g.homeInnings, g.awayInnings);
    if (firstScorer === "home" && home) {
      home.scoredFirstGames++;
      if (homeWon) home.scoredFirstWins++;
    } else if (firstScorer === "away" && away) {
      away.scoredFirstGames++;
      if (awayWon) away.scoredFirstWins++;
    }

    const leader6 = leaderAfter6(g.homeInnings, g.awayInnings);
    if (leader6 === "home" && home) {
      home.ledAfter6Games++;
      if (homeWon) home.ledAfter6Wins++;
    } else if (leader6 === "away" && away) {
      away.ledAfter6Games++;
      if (awayWon) away.ledAfter6Wins++;
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
      <h1 className="text-2xl font-black mb-2">イニング別 得点・失点傾向</h1>
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

      <section className="mb-12">
        <h2 className="font-semibold mb-3">先制した試合の勝率</h2>
        <p className="text-xs mb-3" style={{ color: "var(--ink-secondary)" }}>
          その試合で先に得点したチームが、最終的に勝ったかどうかの割合。
        </p>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>球団</Th>
                <Th align="right">先制試合数</Th>
                <Th align="right">うち勝利</Th>
                <Th align="right">先制勝率</Th>
              </tr>
            </thead>
            <tbody>
              {[...sorted]
                .sort((a, b) => average(b.scoredFirstWins, b.scoredFirstGames) - average(a.scoredFirstWins, a.scoredFirstGames))
                .map((t) => (
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
                    <Td align="right">{t.scoredFirstGames}</Td>
                    <Td align="right">{t.scoredFirstWins}</Td>
                    <Td align="right">
                      <span className="font-semibold">
                        {(average(t.scoredFirstWins, t.scoredFirstGames) * 100).toFixed(1)}%
                      </span>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-semibold mb-3">6回終了時にリードしていた試合の逃げ切り率</h2>
        <p className="text-xs mb-3" style={{ color: "var(--ink-secondary)" }}>
          6回終了時点でリードしていた試合を、最後まで守り切って勝てた割合。低いほど終盤(継投)で崩れやすい傾向がある。
        </p>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>球団</Th>
                <Th align="right">6回リード試合数</Th>
                <Th align="right">うち逃げ切り</Th>
                <Th align="right">逃げ切り率</Th>
              </tr>
            </thead>
            <tbody>
              {[...sorted]
                .sort((a, b) => average(b.ledAfter6Wins, b.ledAfter6Games) - average(a.ledAfter6Wins, a.ledAfter6Games))
                .map((t) => (
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
                    <Td align="right">{t.ledAfter6Games}</Td>
                    <Td align="right">{t.ledAfter6Wins}</Td>
                    <Td align="right">
                      <span className="font-semibold">
                        {(average(t.ledAfter6Wins, t.ledAfter6Games) * 100).toFixed(1)}%
                      </span>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </div>
      </section>

      <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
        本ページの数値は当サイトが試合ごとの回別得点をnpb.jp公式のボックススコアから集計した独自試算であり、NPB公式の発表数値ではない。ホームチームが9回裏の攻撃を行わずに勝利した試合(サヨナラ等)は、その回の得点を「0」として扱っているため、特にホームゲームが多い/接戦に強い球団は9回の平均得点がやや低めに出る傾向がある点に留意されたい。「6回終了時にリードしていた試合」は、6回まで完了した試合のみを対象としている。
      </p>
    </main>
  );
}
