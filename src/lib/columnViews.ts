import { prisma } from "@/lib/prisma";

export async function getViewCounts(slugs: string[]): Promise<Record<string, number>> {
  if (slugs.length === 0) return {};
  const rows = await prisma.columnView.findMany({ where: { slug: { in: slugs } } });
  return Object.fromEntries(rows.map((r) => [r.slug, r.count]));
}

export async function getViewCount(slug: string): Promise<number> {
  const row = await prisma.columnView.findUnique({ where: { slug } });
  return row?.count ?? 0;
}
