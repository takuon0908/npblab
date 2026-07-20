import { prisma } from "@/lib/prisma";

// slugごとのGoodカウントをまとめて取得する（一覧ページでN+1にならないよう一括クエリ）
export async function getLikeCounts(slugs: string[]): Promise<Record<string, number>> {
  if (slugs.length === 0) return {};
  const rows = await prisma.columnLike.findMany({ where: { slug: { in: slugs } } });
  return Object.fromEntries(rows.map((r) => [r.slug, r.count]));
}

export async function getLikeCount(slug: string): Promise<number> {
  const row = await prisma.columnLike.findUnique({ where: { slug } });
  return row?.count ?? 0;
}
