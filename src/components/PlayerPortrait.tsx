import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

// public/players/{playerId}.{png,jpg,jpeg,webp} があれば表示する。
// 実写は著作権・肖像権の観点から使わず、CEOがAIツール等で生成した編集イラスト調の
// 似顔絵のみを想定(similar to public/authors/のパターン)。無ければ何も表示しない
const PLAYERS_DIR = path.join(process.cwd(), "public", "players");
const EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

function findPortrait(playerId: string): string | null {
  for (const ext of EXTENSIONS) {
    if (fs.existsSync(path.join(PLAYERS_DIR, `${playerId}${ext}`))) {
      return `/players/${playerId}${ext}`;
    }
  }
  return null;
}

export function PlayerPortrait({
  playerId,
  playerName,
  size = 96,
  rounded = false,
}: {
  playerId: string;
  playerName: string;
  // ランキング表の行など小さく使う場所ではsize=32程度+rounded=trueを指定する
  size?: number;
  rounded?: boolean;
}) {
  const src = findPortrait(playerId);
  if (!src) return null;

  return (
    <div
      className={`flex-none overflow-hidden ${rounded ? "rounded-full" : "rounded-none"}`}
      style={{ width: size, height: size, border: "1px solid var(--border-strong)", background: "var(--surface)" }}
    >
      <Image src={src} alt={playerName} width={size} height={size} style={{ objectFit: "cover", width: size, height: size }} />
    </div>
  );
}
