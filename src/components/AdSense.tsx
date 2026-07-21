import Script from "next/script";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

// 開発中のアクセスが無効なクリック判定を招かないよう、本番ビルドでのみ読み込む
export function AdSense() {
  if (!ADSENSE_CLIENT_ID || process.env.NODE_ENV !== "production") return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
