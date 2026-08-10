import { prisma } from "@/lib/prisma";
import { Level } from "@prisma/client";

interface PlayerNameEntry {
  playerId: string;
  playerName: string;
}

// 記事本文向けの選手名オートリンクの候補は「今シーズン1軍で成績のある選手」に絞る。
// 全選手を対象にすると同姓同名や短い苗字の誤マッチが増えるため
export async function getActivePlayerNames(): Promise<PlayerNameEntry[]> {
  const season = new Date().getFullYear();
  const [battingRows, pitchingRows] = await Promise.all([
    prisma.playerBattingStat.findMany({
      where: { season, level: Level.ICHIGUN },
      select: { playerId: true, playerName: true },
      distinct: ["playerId"],
    }),
    prisma.playerPitchingStat.findMany({
      where: { season, level: Level.ICHIGUN },
      select: { playerId: true, playerName: true },
      distinct: ["playerId"],
    }),
  ]);

  const byId = new Map<string, string>();
  for (const row of [...battingRows, ...pitchingRows]) {
    byId.set(row.playerId, row.playerName);
  }
  return [...byId.entries()].map(([playerId, playerName]) => ({ playerId, playerName }));
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// DB上の選手名は「姓　名」を全角スペースで区切って保持しているが、記事の本文では
// スペースなしで書かれることが多い(例:「髙橋遥人」)。両方にマッチできるよう、
// 姓と名の間だけスペースの有無を許容するパターンを作る
function buildNamePattern(playerName: string): string {
  const parts = playerName.split(/[\s　]+/).filter(Boolean);
  if (parts.length <= 1) return escapeRegExp(playerName);
  return parts.map(escapeRegExp).join("[\\s\\u3000]*");
}

// 記事本文(HTML)中の選手名を選手ページへのリンクに変換する。
// 既存の<a>タグの中身・見出し(h1〜h6)は対象外にし、リンクは選手1人につき最初の1回だけに絞る
// (同じ選手名を本文中で何度もリンク化すると読みづらく、SEO的にも過剰な内部リンクになるため)
function stripSpaces(text: string): string {
  return text.replace(/[\s　]/g, "");
}

export function linkPlayerNames(bodyHtml: string, players: PlayerNameEntry[]): string {
  if (players.length === 0) return bodyHtml;

  const sorted = [...players].sort((a, b) => b.playerName.length - a.playerName.length);
  // マッチ文字列(本文中のスペース有無どちらのパターンでも)からplayerIdを引けるよう、
  // 「スペースを除いた選手名」をキーにする
  const idByStrippedName = new Map(sorted.map((p) => [stripSpaces(p.playerName), p.playerId]));
  const pattern = new RegExp(sorted.map((p) => buildNamePattern(p.playerName)).join("|"), "g");

  const linkedPlayerIds = new Set<string>();
  let skipDepth = 0; // <a>または見出しタグの内側にいる間は加算し、リンク化をスキップする

  const tokens = bodyHtml.split(/(<[^>]*>)/);
  return tokens
    .map((token) => {
      if (token.startsWith("<")) {
        const tagMatch = token.match(/^<(\/?)\s*([a-zA-Z0-9]+)/);
        const tagName = tagMatch?.[2]?.toLowerCase();
        const isClosing = tagMatch?.[1] === "/";
        if (tagName === "a" || /^h[1-6]$/.test(tagName ?? "")) {
          skipDepth += isClosing ? -1 : 1;
        }
        return token;
      }
      if (skipDepth > 0 || token.trim() === "") return token;

      return token.replace(pattern, (match) => {
        const playerId = idByStrippedName.get(stripSpaces(match));
        if (!playerId || linkedPlayerIds.has(playerId)) return match;
        linkedPlayerIds.add(playerId);
        return `<a href="/players/${playerId}">${match}</a>`;
      });
    })
    .join("");
}
