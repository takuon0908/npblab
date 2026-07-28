// 楽天アフィリエイトのジャンル自動マッチウィジェット。
// rakuten_widget.js は document.write でiframeを注入する古い実装のため、
// Next.js内に直接スクリプトを置いても描画されない。専用の静的HTML(public/rakuten-widget.html)を
// 別iframeとして読み込むことで、document.writeが問題なく動く環境を用意している。
// iframeの中身(468x160px)は楽天側の仕様で変更できないため、号外デザインに馴染むよう外側を額縁で囲っている。
export function RakutenWidget({ pageUrl }: { pageUrl: string }) {
  const src = `/rakuten-widget.html?url=${encodeURIComponent(pageUrl)}`;
  return (
    <div
      className="rounded-none"
      style={{ border: "1px solid var(--border-strong)", background: "var(--surface)", maxWidth: 494, margin: "20px 0" }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="text-xs font-semibold" style={{ color: "var(--ink)" }}>
          おすすめグッズ
        </span>
        <span
          className="text-[10px] leading-none px-1.5 py-0.5"
          style={{ color: "var(--ink-muted)", border: "1px solid var(--border)" }}
        >
          PR
        </span>
      </div>
      <div className="p-3 flex justify-center">
        <iframe
          src={src}
          width={468}
          height={160}
          style={{ border: "none", maxWidth: "100%", display: "block" }}
          loading="lazy"
          title="楽天市場のおすすめ商品"
        />
      </div>
    </div>
  );
}
