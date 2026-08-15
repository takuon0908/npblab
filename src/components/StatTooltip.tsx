// 指標名にホバーすると定義とリーグ平均が出るツールチップ。
// JSのstateを持たず、Tailwindのgroup-hoverだけで開閉させているのでサーバーコンポーネントのまま使える
export function StatTooltip({
  label,
  definition,
  leagueAvg,
}: {
  label: React.ReactNode;
  definition: string;
  leagueAvg?: string;
}) {
  return (
    <span className="group relative inline-block cursor-help">
      <span
        className="border-b border-dotted"
        style={{ borderColor: "var(--ink-muted)" }}
      >
        {label}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-56 max-w-[80vw] rounded-lg p-3 text-xs leading-relaxed group-hover:block"
        style={{ background: "var(--ink)", color: "#ffffff", boxShadow: "var(--shadow-md)" }}
      >
        {definition}
        {leagueAvg && (
          <>
            <br />
            <span style={{ color: "#cbd5e1" }}>リーグ平均: {leagueAvg}</span>
          </>
        )}
        <span
          aria-hidden
          className="absolute left-3 top-full"
          style={{
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid var(--ink)",
          }}
        />
      </span>
    </span>
  );
}
