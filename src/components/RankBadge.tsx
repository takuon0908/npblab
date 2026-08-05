// ランキング表の順位を目立たせるバッジ。1位は塗りつぶし、2〜3位は縁取り、
// 4位以降は控えめな枠線のみにして「上位ほど目立つ」階層を作る
export function RankBadge({ rank }: { rank: number }) {
  const isFirst = rank === 1;
  const isPodium = rank <= 3;

  return (
    <span
      className="flex-none flex items-center justify-center font-black tabular-nums"
      style={{
        width: 26,
        height: 26,
        fontSize: isFirst ? "0.95rem" : "0.8rem",
        background: isFirst ? "var(--accent)" : isPodium ? "var(--accent-track)" : "transparent",
        color: isFirst ? "#1a1208" : isPodium ? "var(--accent)" : "var(--ink-muted)",
        border: isPodium ? "none" : "1px solid var(--border)",
      }}
    >
      {rank}
    </span>
  );
}
