import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 「誰が押したか」はクライアント側のlocalStorageで管理し、このAPIはslugごとの合計カウントを
// 増減するだけ。ユーザー登録が無いサイトのため多重押下の完全な防止はできない前提
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const action = body?.action === "unlike" ? "unlike" : "like";

  if (!slug || slug.length > 100) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }

  const count = await prisma.$transaction(async (tx) => {
    const existing = await tx.columnLike.findUnique({ where: { slug } });
    const current = existing?.count ?? 0;
    const next = Math.max(0, current + (action === "like" ? 1 : -1));
    await tx.columnLike.upsert({
      where: { slug },
      create: { slug, count: next },
      update: { count: next },
    });
    return next;
  });

  return NextResponse.json({ slug, count });
}
