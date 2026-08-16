declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// GA4への汎用イベント送信。ページビューだけでは「見られた」までしか分からず、
// 「実際に何をクリック/操作したか」が施策の効果測定・優先度づけの材料にならないため、
// 収益・エンゲージメントに直結する操作はすべてイベント単位で計測する
function send(eventName: string, params: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}

export function trackAffiliateClick(platform: "amazon" | "rakuten" | "a8", itemName: string, articleSlug: string): void {
  send("affiliate_click", { platform, item_name: itemName, article_slug: articleSlug });
}

export function trackShareClick(contentType: "player" | "team" | "column", title: string): void {
  send("share_click", { platform: "x", content_type: contentType, title });
}

export function trackArticleLike(slug: string, action: "like" | "unlike"): void {
  send("article_like", { slug, action });
}

export function trackCompareSubmit(playerType: "batting" | "pitching", player1: string, player2: string): void {
  send("compare_submit", { player_type: playerType, player1, player2 });
}

export function trackFavoriteTeamSelect(teamSlug: string | null): void {
  send("favorite_team_select", { team_slug: teamSlug ?? "(none)" });
}

export function trackContactSubmit(): void {
  send("contact_submit", {});
}

export function trackSearchSelect(resultType: "player" | "team" | "column", query: string): void {
  send("search_select", { result_type: resultType, query });
}
