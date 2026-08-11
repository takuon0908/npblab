"use client";

import type { RakutenProduct } from "@/lib/rakutenProducts";
import { trackAffiliateClick } from "@/lib/trackEvent";

// eslint-disable-next-line @next/next/no-img-element -- 外部(楽天)ホスト画像のためnext/imageのドメイン許可設定を避けて素の<img>を使用
export function RakutenProductCard({ product, articleSlug }: { product: RakutenProduct; articleSlug: string }) {
  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="amazon-product-card"
      onClick={() => trackAffiliateClick("rakuten", product.title, articleSlug)}
    >
      <img src={product.imageUrl} alt={product.title} loading="lazy" />
      <span>
        <span className="amazon-product-card-title">{product.title}</span>
        <span className="amazon-product-card-price">{product.price}</span>
        <span className="amazon-product-card-cta">楽天市場で見る →</span>
      </span>
    </a>
  );
}
