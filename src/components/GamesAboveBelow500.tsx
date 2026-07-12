// 貯金はgood(緑)、借金はcritical(赤)で色分けして表示する
export function GamesAboveBelow500({ wins, losses }: { wins: number; losses: number }) {
  const diff = wins - losses;
  if (diff === 0) return <span style={{ color: "var(--ink-secondary)" }}>貯金0</span>;
  const isPositive = diff > 0;
  return (
    <span style={{ color: isPositive ? "var(--good)" : "var(--critical)" }}>
      {isPositive ? "貯金" : "借金"}
      {Math.abs(diff)}
    </span>
  );
}
