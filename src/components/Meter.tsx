// 確率のような「上限に対する比率」を表す単一指標。palette.mdのsequential blueをtrack/fillに使う
export function Meter({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 flex-1 rounded-full"
        style={{ background: "var(--accent-track)" }}
      >
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${pct * 100}%`, background: "var(--accent)" }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--ink)" }}>
        {label ?? `${(pct * 100).toFixed(1)}%`}
      </span>
    </div>
  );
}
