import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { League } from "@prisma/client";
import { Table, Th, Td } from "@/components/Table";
import { calcDraftPickScore } from "@/lib/draftScore";
import { TEAM_THEME } from "@/lib/teamTheme";

// ドラフトデータは日次で変わるものではないため緩めのrevalidateでよい
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "12球団 ドラフト指名を採点 ― 通算ドラフト力ランキング",
  description:
    "セ・パ12球団の過去のドラフト指名選手を、一軍定着度・規定到達シーズン数・タイトル獲得歴で当サイト独自に採点。球団ごとの通算ドラフト力ランキングがわかります。",
  alternates: { canonical: "/draft" },
};

async function getTeamDraftSummaries() {
  const teams = await prisma.team.findMany();
  const picks = await prisma.draftPick.findMany();

  const byTeam = new Map<string, typeof picks>();
  for (const p of picks) {
    const list = byTeam.get(p.teamId) ?? [];
    list.push(p);
    byTeam.set(p.teamId, list);
  }

  return teams
    .map((team) => {
      const teamPicks = byTeam.get(team.id) ?? [];
      const total = teamPicks.reduce((s, p) => s + calcDraftPickScore(p), 0);
      return { team, pickCount: teamPicks.length, total };
    })
    .sort((a, b) => b.total - a.total);
}

export default async function DraftIndexPage() {
  const rows = await getTeamDraftSummaries();
  const central = rows.filter((r) => r.team.league === League.CENTRAL).sort((a, b) => b.total - a.total);
  const pacific = rows.filter((r) => r.team.league === League.PACIFIC).sort((a, b) => b.total - a.total);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-black mb-2">12球団 ドラフト指名を採点</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-secondary)" }}>
        過去のドラフト指名選手を、一軍定着度・規定到達シーズン数・タイトル獲得歴をもとに当サイト独自の基準で採点し、球団ごとに合計しています。指名順位による重み付けはしていません。データは球団ごとに順次追加中です。
      </p>

      <div className="grid gap-8 sm:grid-cols-2 min-w-0">
        <LeagueDraftTable title="セ・リーグ" rows={central} />
        <LeagueDraftTable title="パ・リーグ" rows={pacific} />
      </div>
    </main>
  );
}

function LeagueDraftTable({
  title,
  rows,
}: {
  title: string;
  rows: Awaited<ReturnType<typeof getTeamDraftSummaries>>;
}) {
  return (
    <div className="min-w-0">
      <h2 className="font-semibold mb-3">{title}</h2>
      <Table>
        <thead>
          <tr>
            <Th>球団</Th>
            <Th align="right">対象人数</Th>
            <Th align="right">通算スコア</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ team, pickCount, total }) => (
            <tr key={team.id} className="hover:bg-white/[0.05]">
              <Td>
                <Link
                  href={`/teams/${team.slug}/draft`}
                  className="hover:underline inline-flex items-center gap-2"
                >
                  <span
                    aria-hidden
                    className="rounded-full"
                    style={{
                      width: 9,
                      height: 9,
                      flex: "none",
                      background: TEAM_THEME[team.slug]?.accent ?? "var(--ink-muted)",
                    }}
                  />
                  {team.name}
                </Link>
              </Td>
              <Td align="right" muted>
                {pickCount > 0 ? `${pickCount}人` : "調査中"}
              </Td>
              <Td align="right">
                {pickCount > 0 ? (
                  <span className="font-semibold">{total}点</span>
                ) : (
                  <span style={{ color: "var(--ink-muted)" }}>―</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
