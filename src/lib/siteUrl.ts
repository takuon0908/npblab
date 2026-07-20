// NEXT_PUBLIC_SITE_URLが未設定でも、Vercelが自動注入する本番ドメインにフォールバックする。
// これが無いとsitemap/robots/canonical/OGP画像が全てlocalhostを指してしまい、検索エンジンにインデックスされない
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
  "http://localhost:3000";
