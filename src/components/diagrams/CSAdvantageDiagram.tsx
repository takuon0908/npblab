// CSファイナルステージのアドバンテージ判定を示す図解。外部画像を使わず、
// サイトのCSS変数(--accent等)をそのまま使えるインラインSVGとして描画することで
// 画像生成コスト無しに記事へ解説図を追加できる
export function CSAdvantageDiagram() {
  return (
    <svg
      viewBox="0 0 640 380"
      role="img"
      aria-label="CSファイナルステージのアドバンテージ判定フロー図。対戦相手の勝率が5割未満、またはリーグ優勝チームとのゲーム差が10以上のいずれかに該当する場合は2勝アドバンテージ、どちらも該当しない場合は従来通り1勝アドバンテージとなる"
      style={{ width: "100%", height: "auto" }}
    >
      <defs>
        <marker id="csArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ink-muted)" />
        </marker>
      </defs>

      {/* Box1: start */}
      <rect x="170" y="16" width="300" height="52" rx="8" fill="var(--surface)" stroke="var(--border-strong)" />
      <text x="320" y="48" textAnchor="middle" fill="var(--ink)" fontSize="15" fontWeight="700">
        ファイナルステージ進出
      </text>

      <line x1="320" y1="68" x2="320" y2="98" stroke="var(--ink-muted)" strokeWidth="2" markerEnd="url(#csArrow)" />

      {/* Box2: condition */}
      <rect x="90" y="100" width="460" height="98" rx="8" fill="var(--surface-2)" stroke="var(--border-strong)" />
      <text x="320" y="126" textAnchor="middle" fill="var(--ink)" fontSize="14" fontWeight="700">
        対戦相手(ファーストステージ勝者)が
      </text>
      <text x="320" y="150" textAnchor="middle" fill="var(--accent)" fontSize="14" fontWeight="700">
        ① 勝率5割未満 　または　 ② 10ゲーム差以上
      </text>
      <text x="320" y="174" textAnchor="middle" fill="var(--ink-secondary)" fontSize="13">
        のどちらかに該当するか？
      </text>

      {/* branches */}
      <line x1="220" y1="198" x2="150" y2="248" stroke="var(--ink-muted)" strokeWidth="2" markerEnd="url(#csArrow)" />
      <line x1="420" y1="198" x2="480" y2="248" stroke="var(--ink-muted)" strokeWidth="2" markerEnd="url(#csArrow)" />
      <text x="150" y="230" textAnchor="middle" fill="var(--accent)" fontSize="13" fontWeight="700">
        該当する
      </text>
      <text x="480" y="230" textAnchor="middle" fill="var(--ink-muted)" fontSize="13" fontWeight="700">
        該当しない
      </text>

      {/* Box3a: 2-win (highlighted) */}
      <rect x="20" y="252" width="270" height="112" rx="8" fill="var(--accent-track)" stroke="var(--accent)" strokeWidth="2" />
      <text x="155" y="284" textAnchor="middle" fill="var(--accent)" fontSize="17" fontWeight="800">
        2勝アドバンテージ
      </text>
      <text x="155" y="308" textAnchor="middle" fill="var(--ink)" fontSize="13">
        最大7試合・5勝先取
      </text>
      <text x="155" y="328" textAnchor="middle" fill="var(--ink-secondary)" fontSize="12">
        (2026年からの新ルール)
      </text>

      {/* Box3b: 1-win (muted) */}
      <rect x="350" y="252" width="270" height="112" rx="8" fill="var(--surface)" stroke="var(--border-strong)" />
      <text x="485" y="284" textAnchor="middle" fill="var(--ink)" fontSize="17" fontWeight="800">
        1勝アドバンテージ
      </text>
      <text x="485" y="308" textAnchor="middle" fill="var(--ink-secondary)" fontSize="13">
        最大6試合・4勝先取
      </text>
      <text x="485" y="328" textAnchor="middle" fill="var(--ink-muted)" fontSize="12">
        (従来通り)
      </text>
    </svg>
  );
}
