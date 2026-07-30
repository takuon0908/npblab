// ランキング表の数値の下に添える発光バー。0〜1のratioを渡すと、その割合ぶん光って伸びる。
// 「首位=100%」ではなく「このリストの中でどれくらい強いか」を表すため、呼び出し側で
// 確率(0〜1)や、リスト内トップ値との比率を渡す想定。
export function RankBar({ ratio, widthClassName = "w-14" }: { ratio: number; widthClassName?: string }) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0)) * 100;
  return (
    <div className={`rank-bar-track ${widthClassName}`} aria-hidden>
      <div className="rank-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
