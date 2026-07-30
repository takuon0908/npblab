// 確率のような「上限に対する比率」を表す単一指標。RankBarと同じ発光スタイルで統一している
export function Meter({ value, label }: { value: number; label?: React.ReactNode }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="flex items-center gap-2">
      <div className="rank-bar-track flex-1">
        <div className="rank-bar-fill" style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--ink)" }}>
        {label ?? `${(pct * 100).toFixed(1)}%`}
      </span>
    </div>
  );
}
