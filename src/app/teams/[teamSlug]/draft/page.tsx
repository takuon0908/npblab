import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Table, Th, Td } from "@/components/Table";
import { calcDraftPickScore } from "@/lib/draftScore";

export const revalidate = 86400;

export async function generateStaticParams() {
  const teams = await prisma.team.findMany({ select: { slug: true } });
  return teams.map((team) => ({ teamSlug: team.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}): Promise<Metadata> {
  const { teamSlug } = await params;
  const team = await prisma.team.findUnique({ where: { slug: teamSlug } });
  if (!team) return {};

  return {
    title: `${team.name} ドラフト指名を採点 ― 通算ドラフト力`,
    description: `${team.name}が過去のドラフトで指名した選手を、一軍定着度・規定到達シーズン数・タイトル獲得歴で当サイト独自に採点。年度別・通算のドラフト力がわかります。`,
    alternates: { canonical: `/teams/${teamSlug}/draft` },
  };
}

async function getDraftData(teamId: string) {
  const picks = await prisma.draftPick.findMany({
    where: { teamId },
    orderBy: [{ year: "desc" }, { round: "asc" }],
  });

  const byYear = new Map<number, typeof picks>();
  for (const p of picks) {
    const list = byYear.get(p.year) ?? [];
    list.push(p);
    byYear.set(p.year, list);
  }

  const years = [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, yearPicks]) => ({
      year,
      // 支配下1位→…と並べたあとに、育成1位→…を続ける(支配下・育成が指名順位だけで
      // 混ざって表示されると分かりにくいため)
      picks: yearPicks.sort((a, b) => {
        if (a.isDevelopmental !== b.isDevelopmental) return a.isDevelopmental ? 1 : -1;
        return a.round - b.round;
      }),
      total: yearPicks.reduce((s, p) => s + calcDraftPickScore(p), 0),
    }));

  const grandTotal = years.reduce((s, y) => s + y.total, 0);

  return { years, grandTotal, pickCount: picks.length };
}

export default async function TeamDraftPage({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  const team = await prisma.team.findUnique({ where: { slug: teamSlug } });
  if (!team) notFound();

  const { years, grandTotal, pickCount } = await getDraftData(team.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
        <Link href={`/teams/${team.slug}`} className="hover:underline" style={{ color: "var(--accent)" }}>
          {team.name}
        </Link>
      </p>
      <h1 className="text-2xl font-black mb-2">{team.name} ドラフト指名を採点</h1>
      <p className="text-sm mb-2" style={{ color: "var(--ink-secondary)" }}>
        過去のドラフト指名選手を、一軍定着・規定到達シーズン数・タイトル獲得歴をもとに当サイト独自の基準で採点しています。指名順位による重み付けはしていないので、下位指名の「掘り出し物」は指名順位と見比べて判断してください。
      </p>

      {pickCount === 0 ? (
        <div
          className="mt-8 rounded-lg p-6 text-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink-muted)" }}
        >
          この球団のドラフトデータはまだ調査中です。準備でき次第公開します。
        </div>
      ) : (
        <>
          <div
            className="mt-6 mb-10 rounded-lg p-5"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
          >
            <p className="text-xs mb-1" style={{ color: "var(--ink-muted)" }}>
              通算ドラフト力スコア(対象{pickCount}人)
            </p>
            <p className="text-3xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 900, color: "var(--accent)" }}>
              {grandTotal}
              <span className="text-base ml-1" style={{ color: "var(--ink-muted)" }}>
                点
              </span>
            </p>
          </div>

          {years.map(({ year, picks, total }) => (
            <section key={year} className="mb-10">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                  {year}年ドラフト
                </h2>
                <span className="text-sm" style={{ color: "var(--ink-muted)" }}>
                  年度合計 <span style={{ color: "var(--accent)", fontWeight: 700 }}>{total}点</span>
                </span>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th>順位</Th>
                    <Th>選手</Th>
                    <Th>ポジション</Th>
                    <Th align="right">一軍出場</Th>
                    <Th align="right">規定到達</Th>
                    <Th>タイトル</Th>
                    <Th align="right">スコア</Th>
                  </tr>
                </thead>
                <tbody>
                  {picks.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 align-top" style={{ color: "var(--ink-secondary)" }}>
                        {p.isDevelopmental ? `育成${p.round}位` : `${p.round}位`}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div style={{ fontWeight: 700 }}>{p.playerName}</div>
                        <div className="text-xs" style={{ color: "var(--ink-muted)" }}>
                          {p.previousAffiliation ?? "―"}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top" style={{ color: "var(--ink-secondary)" }}>
                        {p.position}
                      </td>
                      <td className="px-3 py-2 align-top text-right">{p.npbDebutMade ? "○" : "×"}</td>
                      <td className="px-3 py-2 align-top text-right" style={{ color: "var(--ink-secondary)" }}>
                        {p.qualifiedSeasons}回
                      </td>
                      <td className="px-3 py-2 align-top text-sm" style={{ color: "var(--ink-secondary)" }}>
                        {p.titles || "―"}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        <span style={{ fontWeight: 700, color: "var(--accent)" }}>{calcDraftPickScore(p)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </section>
          ))}

          <p className="text-xs mt-4" style={{ color: "var(--ink-muted)" }}>
            スコアは一軍出場+10点、規定打席/規定投球回到達シーズン1回につき+20点、タイトル・表彰歴1件につき+30点で算出した当サイト独自の試算です。NPB公式の評価ではありません。通算成績は執筆時点のスナップショットであり、以後の活躍によって変動します。
          </p>
        </>
      )}
    </main>
  );
}
