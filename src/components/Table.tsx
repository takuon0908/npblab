// ランキング/一覧系ページで共通利用するテーブルの外枠。
// 横に長い表はoverflow-x-autoでスクロールさせる（npb.jp等の慣習にならう）。
// スクロールできること自体が伝わりにくい（見切れているだけに見える）ため、右端にフェードを重ねている
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative rounded-none min-w-0"
      style={{ border: "1px solid var(--border-strong)", background: "var(--surface)" }}
    >
      <div className="overflow-x-auto rounded-none">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 rounded-r-lg"
        style={{ background: "linear-gradient(to right, transparent, var(--surface))" }}
      />
    </div>
  );
}

export function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`}
      style={{ color: "var(--ink-muted)", borderBottom: "1px solid var(--border)" }}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  muted = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  muted?: boolean;
}) {
  return (
    <td
      className={`px-3 py-2 tabular-nums whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`}
      style={{ color: muted ? "var(--ink-secondary)" : "var(--ink)" }}
    >
      {children}
    </td>
  );
}
