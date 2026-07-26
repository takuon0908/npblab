import type { AffiliateProduct } from "@/lib/affiliateProducts";

// eslint-disable-next-line @next/next/no-img-element -- 外部(Amazon)ホスト画像のためnext/imageのドメイン許可設定を避けて素の<img>を使用
export function AmazonProductCard({ product }: { product: AffiliateProduct }) {
  return (
    <a
      href={`https://www.amazon.co.jp/dp/${product.asin}?tag=npblab-22`}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="amazon-product-card"
    >
      <img src={product.imageUrl} alt={product.title} loading="lazy" />
      <span>
        <span className="amazon-product-card-title">{product.title}</span>
        <span className="amazon-product-card-cta">Amazonで見る →</span>
      </span>
    </a>
  );
}
