import { NextResponse, type NextRequest } from "next/server";
import { categoryToSlug } from "@/lib/categorySlug";

// 旧URL /columns?category=... を新URL /columns/category/{slug} へ308リダイレクトする
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname !== "/columns") return NextResponse.next();

  const category = searchParams.get("category");
  if (!category) return NextResponse.next();

  const slug = categoryToSlug(category);
  if (!slug) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/columns/category/${slug}`;
  url.searchParams.delete("category");
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: "/columns",
};
