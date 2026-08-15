// リーグ内でのパーセンタイル(0-100)を色付きバーで示す。配色は5段階
// (elite/great/aboveavg/belowavg/poor)で、数値が高いほど暖色に寄せている
function percentileColor(percentile: number): string {
  if (percentile >= 90) return "var(--percentile-elite)";
  if (percentile >= 70) return "var(--percentile-great)";
  if (percentile >= 50) return "var(--percentile-aboveavg)";
  if (percentile >= 30) return "var(--percentile-belowavg)";
  return "var(--percentile-poor)";
}

export function PercentileBar({
  label,
  percentile,
  displayValue,
}: {
  label: React.ReactNode;
  percentile: number;
  displayValue: string;
}) {
  const clamped = Math.max(0, Math.min(100, percentile));
  const color = percentileColor(clamped);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1 text-xs">
        <span style={{ color: "var(--ink-secondary)" }}>{label}</span>
        <span className="tabular-nums font-semibold" style={{ color: "var(--ink)" }}>
          {displayValue}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative h-2 flex-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width]"
            style={{ width: `${clamped}%`, background: color }}
          />
        </div>
        <span
          className="w-7 flex-none text-right text-xs font-bold tabular-nums"
          style={{ color }}
        >
          {Math.round(clamped)}
        </span>
      </div>
    </div>
  );
}
