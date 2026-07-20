"use client";

import { useEffect } from "react";

const SESSION_KEY_PREFIX = "npblab:viewed:";

// 記事ページに埋め込む見えないコンポーネント。マウント時に一度だけ閲覧数をインクリメントする。
// 同じタブでの再訪問(戻る/リロード)による重複カウントはsessionStorageで防ぐ
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `${SESSION_KEY_PREFIX}${slug}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");

    fetch("/api/columns/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {
      // 計測できなくても閲覧体験には影響しないので握りつぶす
    });
  }, [slug]);

  return null;
}
