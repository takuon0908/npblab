const USER_AGENT = "Mozilla/5.0";

// 通信が固まった場合に無限待機しないよう15秒でタイムアウトする
export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`fetch failed: ${url} (${res.status})`);
  return res.text();
}
