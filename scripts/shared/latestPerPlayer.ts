// PlayerBattingStat/PlayerPitchingStatは日次スナップショット（@@unique([playerId, level, date])）。
// season/levelだけで絞ると同一選手の過去分まで全部拾ってしまうため、選手ごとに最新dateの1件だけを残す。
export function latestPerPlayer<T extends { playerId: string; date: Date }>(rows: T[]): T[] {
  const latest = new Map<string, T>();
  for (const row of rows) {
    const current = latest.get(row.playerId);
    if (!current || row.date > current.date) {
      latest.set(row.playerId, row);
    }
  }
  return [...latest.values()];
}
