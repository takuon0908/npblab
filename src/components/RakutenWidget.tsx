// 楽天アフィリエイトのジャンル自動マッチウィジェット。
// rakuten_widget.js は document.write でiframeを注入する古い実装のため、
// Next.js内に直接スクリプトを置いても描画されない。専用の静的HTML(public/rakuten-widget.html)を
// 別iframeとして読み込むことで、document.writeが問題なく動く環境を用意している。
export function RakutenWidget({ pageUrl }: { pageUrl: string }) {
  const src = `/rakuten-widget.html?url=${encodeURIComponent(pageUrl)}`;
  return (
    <iframe
      src={src}
      width={468}
      height={160}
      style={{ border: "none", maxWidth: "100%", display: "block", margin: "20px 0" }}
      loading="lazy"
      title="楽天市場のおすすめ商品"
    />
  );
}
