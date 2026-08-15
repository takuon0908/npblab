// 打率・出塁率・長打率・OPS・wOBA・勝率など「通常0〜1の範囲に収まる」指標は、
// 野球の慣習として先頭の0を省略して表記する(.312、.557 など)。
// 1.000以上になった場合(OPSなどでは起こりうる)は先頭の桁も表示する
export function formatAvg(value: number, digits = 3): string {
  const fixed = value.toFixed(digits);
  return value < 1 && value >= 0 ? fixed.replace(/^0/, "") : fixed;
}
