// PlayerBattingStat/PlayerPitchingStatは日次スナップショットなので、選手ごとに最新date分だけ残す
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
