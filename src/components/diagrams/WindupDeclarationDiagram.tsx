// 「ワインドアップ宣言制」の旧ルール/新ルールを対比する図解。外部画像を使わず、
// サイトのCSS変数をそのまま使えるインラインSVGとして描画する
export function WindupDeclarationDiagram() {
  return (
    <svg
      viewBox="0 0 640 300"
      role="img"
      aria-label="投手の始動動作ルールの新旧比較図。投手が『ワインドアップで投げる』と事前に審判へ伝えても、足の置き方がセットポジション風に見えた場合、旧ルールではボークと判定されることがあったが、2026年からの新ルールでは宣言通りワインドアップとして扱われる"
      style={{ width: "100%", height: "auto" }}
    >
      <defs>
        <marker id="wdArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ink-muted)" />
        </marker>
      </defs>

      {/* shared premise */}
      <rect x="120" y="14" width="400" height="56" rx="8" fill="var(--surface)" stroke="var(--border-strong)" />
      <text x="320" y="38" textAnchor="middle" fill="var(--ink)" fontSize="13.5" fontWeight="700">
        投手「ワインドアップで投げます」と審判に事前申告
      </text>
      <text x="320" y="58" textAnchor="middle" fill="var(--ink-secondary)" fontSize="12">
        (実際の足の置き方はセットポジション風に見える)
      </text>

      <line x1="220" y1="70" x2="160" y2="100" stroke="var(--ink-muted)" strokeWidth="2" markerEnd="url(#wdArrow)" />
      <line x1="420" y1="70" x2="480" y2="100" stroke="var(--ink-muted)" strokeWidth="2" markerEnd="url(#wdArrow)" />

      {/* Old rule column */}
      <text x="160" y="98" textAnchor="middle" fill="var(--ink-muted)" fontSize="13" fontWeight="700">
        〜2025年(旧ルール)
      </text>
      <rect x="30" y="106" width="260" height="66" rx="8" fill="var(--surface)" stroke="var(--border-strong)" />
      <text x="160" y="132" textAnchor="middle" fill="var(--ink)" fontSize="13">
        判定基準は「足の置き方」のみ
      </text>
      <text x="160" y="152" textAnchor="middle" fill="var(--ink-secondary)" fontSize="12">
        申告は判定に影響しない
      </text>
      <line x1="160" y1="172" x2="160" y2="200" stroke="var(--ink-muted)" strokeWidth="2" markerEnd="url(#wdArrow)" />
      <rect x="20" y="204" width="280" height="80" rx="8" fill="var(--critical-soft)" stroke="var(--critical)" strokeWidth="2" />
      <text x="160" y="234" textAnchor="middle" fill="var(--critical)" fontSize="16" fontWeight="800">
        ボークと判定される
      </text>
      <text x="160" y="256" textAnchor="middle" fill="var(--ink-secondary)" fontSize="12">
        ことがあった
      </text>
      <text x="160" y="274" textAnchor="middle" fill="var(--ink-muted)" fontSize="11">
        (2025年3月・バウアー投手の例)
      </text>

      {/* New rule column */}
      <text x="480" y="98" textAnchor="middle" fill="var(--accent)" fontSize="13" fontWeight="700">
        2026年〜(新ルール)
      </text>
      <rect x="350" y="106" width="260" height="66" rx="8" fill="var(--surface)" stroke="var(--border-strong)" />
      <text x="480" y="132" textAnchor="middle" fill="var(--ink)" fontSize="13">
        事前申告があれば
      </text>
      <text x="480" y="152" textAnchor="middle" fill="var(--ink-secondary)" fontSize="12">
        申告通りに扱われる
      </text>
      <line x1="480" y1="172" x2="480" y2="200" stroke="var(--ink-muted)" strokeWidth="2" markerEnd="url(#wdArrow)" />
      <rect x="340" y="204" width="280" height="80" rx="8" fill="var(--accent-track)" stroke="var(--accent)" strokeWidth="2" />
      <text x="480" y="234" textAnchor="middle" fill="var(--accent)" fontSize="16" fontWeight="800">
        ワインドアップとして
      </text>
      <text x="480" y="256" textAnchor="middle" fill="var(--ink)" fontSize="13">
        扱われる(ボークなし)
      </text>
      <text x="480" y="274" textAnchor="middle" fill="var(--ink-muted)" fontSize="11">
        (規則5.07(a)(1)③原注)
      </text>
    </svg>
  );
}
