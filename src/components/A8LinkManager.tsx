import Script from "next/script";

const A8_CONFIG_ID = process.env.NEXT_PUBLIC_A8_CONFIG_ID;

// 開発中のアクセスがA8.netの計測に混ざらないよう、本番ビルドでのみ読み込む
export function A8LinkManager() {
  if (!A8_CONFIG_ID || process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script src="https://statics.a8.net/a8link/a8linkmgr.js" strategy="afterInteractive" />
      <Script id="a8linkmgr-init" strategy="afterInteractive">
        {`
          a8linkmgr({
            "config_id": "${A8_CONFIG_ID}"
          });
        `}
      </Script>
    </>
  );
}
