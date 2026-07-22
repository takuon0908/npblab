export function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="rounded-none p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border-strong)" }}
    >
      <dt className="text-xs" style={{ color: "var(--ink-muted)" }}>
        {label}
      </dt>
      <dd className="text-xl font-semibold mt-1" style={{ color: "var(--ink)" }}>
        {value}
      </dd>
    </div>
  );
}
