// A8.net静的バナー広告。RakutenWidget(document.write方式でiframeが必要)と違い、
// <a><img></a>+計測用1x1画像だけの単純な構成なので追加のiframeは不要。
// クリック計測用のURL・画像URLはA8管理画面で発行されたコードをそのまま使うこと(改変すると計測が壊れる)。
export function A8Banner() {
  return (
    <div
      className="rounded-none"
      style={{ border: "1px solid var(--border-strong)", background: "var(--surface)", maxWidth: 320, margin: "20px 0" }}
    >
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="text-xs font-semibold" style={{ color: "var(--ink)" }}>
          おすすめ
        </span>
        <span
          className="text-[10px] leading-none px-1.5 py-0.5"
          style={{ color: "var(--ink-muted)", border: "1px solid var(--border)" }}
        >
          PR
        </span>
      </div>
      <div className="p-3 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- A8計測タグは素の<img>である必要がある(next/imageだとURLが書き換わり計測が壊れる) */}
        <a href="https://px.a8.net/svt/ejp?a8mat=4BA4TD+GE0L9U+461Y+6DRLT" rel="nofollow" target="_blank">
          <img
            style={{ border: 0 }}
            width={300}
            height={250}
            alt="プロ野球見るならスカパー！"
            src="https://www27.a8.net/svt/bgt?aid=260813281991&wid=001&eno=01&mid=s00000019447001072000&mc=1"
          />
        </a>
        {/* eslint-disable-next-line @next/next/no-img-element -- A8の1x1計測ピクセル */}
        <img
          style={{ border: 0, position: "absolute" }}
          width={1}
          height={1}
          alt=""
          src="https://www10.a8.net/0.gif?a8mat=4BA4TD+GE0L9U+461Y+6DRLT"
        />
      </div>
    </div>
  );
}
