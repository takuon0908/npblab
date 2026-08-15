// 母集団(pool)の中で、valueが何パーセンタイルに位置するかを算出する。
// 同値が並ぶ場合は中間順位で扱う(タイの選手同士が0/100に極端に振れないようにするため)。
// higherIsBetter=falseの指標(防御率・WHIP・K%被弾など「低いほど良い」指標)は、
// 呼び出し側で反転させず、この引数で意味を反転させて統一的に扱う
export function calcPercentile(value: number, pool: number[], higherIsBetter = true): number {
  if (pool.length <= 1) return 50;
  let below = 0;
  let equal = 0;
  for (const v of pool) {
    if (v < value) below += 1;
    else if (v === value) equal += 1;
  }
  const raw = ((below + equal / 2) / pool.length) * 100;
  return higherIsBetter ? raw : 100 - raw;
}
