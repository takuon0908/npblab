// DraftPickテーブルの内容をスコア付きで表示する。
// 使い方: npx tsx --env-file=.env.local scripts/draft/report.ts [teamSlug]
// teamSlugを省略すると登録済み全球団を対象にする
import { prisma } from "@/lib/prisma";
import { calcDraftPickScore } from "@/lib/draftScore";

async function main() {
  const teamSlug = process.argv[2];
  const picks = await prisma.draftPick.findMany({
    where: teamSlug ? { team: { slug: teamSlug } } : undefined,
    include: { team: true },
    orderBy: [{ teamId: "asc" }, { year: "desc" }, { round: "asc" }],
  });

  if (picks.length === 0) {
    console.log("該当するドラフト指名データがありません");
    return;
  }

  type Row = (typeof picks)[number];
  const byTeam = new Map<string, Row[]>();
  for (const p of picks) {
    const list = byTeam.get(p.team.name) ?? [];
    list.push(p);
    byTeam.set(p.team.name, list);
  }

  for (const [teamName, teamPicks] of byTeam) {
    console.log(`\n########## ${teamName} ##########`);

    const byYear = new Map<number, Row[]>();
    for (const p of teamPicks) {
      const list = byYear.get(p.year) ?? [];
      list.push(p);
      byYear.set(p.year, list);
    }

    const yearScores: { year: number; total: number; count: number }[] = [];

    for (const [year, yearPicks] of [...byYear.entries()].sort((a, b) => b[0] - a[0])) {
      console.log(`\n=== ${year}年ドラフト ===`);
      let yearTotal = 0;
      for (const p of yearPicks.sort((a, b) => a.round - b.round)) {
        const score = calcDraftPickScore(p);
        yearTotal += score;
        const roundLabel = `${p.isDevelopmental ? "育成" : ""}${p.round}位`;
        console.log(
          `  ${roundLabel.padEnd(6)} ${p.playerName.padEnd(8)} ${p.position.padEnd(6)} | 一軍出場${p.npbDebutMade ? "○" : "×"} 規定到達${p.qualifiedSeasons}回 タイトル[${p.titles || "なし"}] ${p.isActive ? "現役" : "引退/戦力外"} → ${score}点`
        );
      }
      console.log(`  年度合計: ${yearTotal}点 (${yearPicks.length}人)`);
      yearScores.push({ year, total: yearTotal, count: yearPicks.length });
    }

    const grandTotal = yearScores.reduce((s, y) => s + y.total, 0);
    console.log(`\n>>> ${teamName} 通算ドラフト力スコア: ${grandTotal}点 (対象${teamPicks.length}人)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
