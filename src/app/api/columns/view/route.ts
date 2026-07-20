import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 記事詳細ページの表示時にクライアント(ViewTracker)から呼ばれる。
// 同一タブでの重複カウントはsessionStorage側で防止する前提のシンプルなインクリメント
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";

  if (!slug || slug.length > 100) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }

  const row = await prisma.columnView.upsert({
    where: { slug },
    create: { slug, count: 1 },
    update: { count: { increment: 1 } },
  });

  return NextResponse.json({ slug, count: row.count });
}
