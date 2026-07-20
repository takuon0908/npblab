// どの記事にGoodを押したかはアカウント基盤が無いためブラウザのlocalStorageにのみ保存する
const STORAGE_KEY = "npblab:likedColumns";

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSet(set: Set<string>): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function hasLiked(slug: string): boolean {
  return readSet().has(slug);
}

// トグル後の状態(true=いいね済み)を返す
export function toggleLiked(slug: string): boolean {
  const set = readSet();
  const next = !set.has(slug);
  if (next) {
    set.add(slug);
  } else {
    set.delete(slug);
  }
  writeSet(set);
  return next;
}
