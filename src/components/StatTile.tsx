export function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <dt className="text-xs" style={{ color: "var(--ink-muted)" }}>
        {label}
      </dt>
      <dd className="text-xl font-semibold tabular-nums mt-1" style={{ color: "var(--ink)" }}>
        {value}
      </dd>
    </div>
  );
}
