// playerIdは公式IDがないため teamSlug-選手名 の簡易スラッグ（同姓同名は考慮していない）
export function slugifyPlayer(playerName: string, teamSlug: string): string {
  return `${teamSlug}-${playerName.replace(/\s|　/g, "")}`;
}
