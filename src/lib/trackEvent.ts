declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// アフィリエイトリンクのクリックをGA4イベントとして送る。
// ページビューだけでは「見られた」までしか分からず、「実際にクリックされたか」が
// 商品選定・記事優先度づけの判断材料にならないため、クリック単位で計測する
export function trackAffiliateClick(platform: "amazon" | "rakuten", itemName: string, articleSlug: string): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "affiliate_click", {
    platform,
    item_name: itemName,
    article_slug: articleSlug,
  });
}
