// ランキング/一覧系ページで共通利用するテーブルの外枠。
// 横に長い表はoverflow-x-autoでスクロールさせる（npb.jp等の慣習にならう）。
// スクロールできること自体が伝わりにくい（見切れているだけに見える）ため、右端にフェードを重ねている
export function Table({
  children,
  fixedLayout = false,
}: {
  children: React.ReactNode;
  // <colgroup>で列幅を明示指定するテーブル用。table-layout:autoのままだと
  // colgroupの幅は単なるヒントに過ぎず、sticky列やCJKの折り返しやすさと組み合わさると
  // 実際の列幅が指定値を無視して極端に縮むことがあるため、fixedで指定値を強制する
  fixedLayout?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden min-w-0"
      style={{ border: "1px solid var(--border)", borderRadius: 16, background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="overflow-x-auto [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[var(--page)]">
        <table
          className="w-full text-sm border-collapse"
          style={fixedLayout ? { tableLayout: "fixed" } : undefined}
        >
          {children}
        </table>
      </div>
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-8"
        style={{ background: "linear-gradient(to right, transparent, var(--surface))" }}
      />
    </div>
  );
}

export function Th({
  children,
  align = "left",
  sticky = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  // 列数が多く横スクロールする表で、先頭列(選手名など行の identity)を
  // スクロールしても常に見える位置に固定する。背景を不透明にしないと
  // スクロールで流れる他列の文字が透けて重なって見えてしまうため明示的に塗る
  sticky?: boolean;
}) {
  return (
    <th
      className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${align === "right" ? "text-right" : "text-left"} ${sticky ? "sticky left-0 z-10" : ""}`}
      style={{ color: "var(--ink-muted)", borderBottom: "1px solid var(--border)", background: "var(--page)" }}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  muted = false,
  sticky = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  muted?: boolean;
  sticky?: boolean;
}) {
  return (
    <td
      className={`px-3 py-2 tabular-nums whitespace-nowrap ${align === "right" ? "text-right" : "text-left"} ${sticky ? "sticky left-0 z-10" : ""}`}
      style={{ color: muted ? "var(--ink-secondary)" : "var(--ink)", background: sticky ? "var(--surface)" : undefined }}
    >
      {children}
    </td>
  );
}
