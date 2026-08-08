import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { categoryToSlug } from "@/lib/categorySlug";

// 記事は手動公開の瞬間にしか変わらないため、時間ベースのISR(revalidate)ではなく
// 公開スクリプト(scripts/publish/publish-drafts.ts)から叩くオンデマンド再生成に寄せる。
// Vercel Hobbyプランの無料ISR Writes枠を節約するのが目的
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "invalid secret" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  const category = req.nextUrl.searchParams.get("category");

  const revalidated = ["/columns", "/columns/ranking"];
  revalidatePath("/columns");
  revalidatePath("/columns/ranking");

  if (slug) {
    revalidatePath(`/columns/${slug}`);
    revalidated.push(`/columns/${slug}`);
  }
  if (category) {
    const categorySlug = categoryToSlug(category);
    if (categorySlug) {
      revalidatePath(`/columns/category/${categorySlug}`);
      revalidated.push(`/columns/category/${categorySlug}`);
    }
  }

  return NextResponse.json({ revalidated });
}
