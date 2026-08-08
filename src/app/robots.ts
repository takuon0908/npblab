import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // OGP画像生成エンドポイント・楽天ウィジェット埋め込み用HTMLはページではなく部品であり、
      // GSCの「クロール済み-インデックス未登録」に無駄に積み上がるだけなのでクロール自体を止める
      disallow: ["/api/", "/opengraph-image", "/*/opengraph-image", "/rakuten-widget.html"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
