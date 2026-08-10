import { prisma } from "@/lib/prisma";
import { getAllColumns, type Column } from "@/lib/microcms";

export async function getViewCounts(slugs: string[]): Promise<Record<string, number>> {
  if (slugs.length === 0) return {};
  const rows = await prisma.columnView.findMany({ where: { slug: { in: slugs } } });
  return Object.fromEntries(rows.map((r) => [r.slug, r.count]));
}

// カテゴリ・タグを問わずサイト全体の閲覧数上位を返す。記事回遊の起点として
// 「関連記事」(同カテゴリ)だけではリーチできない記事へも導線を作るため
export async function getPopularColumns(excludeSlug: string, limit = 4): Promise<(Column & { views: number })[]> {
  const contents = await getAllColumns();
  const viewCounts = await getViewCounts(contents.map((c) => c.slug));

  return contents
    .filter((c) => c.slug !== excludeSlug)
    .map((c) => ({ ...c, views: viewCounts[c.slug] ?? 0 }))
    .filter((c) => c.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export async function getViewCount(slug: string): Promise<number> {
  const row = await prisma.columnView.findUnique({ where: { slug } });
  return row?.count ?? 0;
}
