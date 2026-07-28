"use client";

import { useEffect, useState } from "react";

// 0から実際の値まで一瞬でカウントアップする軽量アニメーション。requestAnimationFrameベースで外部ライブラリは使わない
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUpNumber({
  value,
  decimals = 1,
  durationMs = 700,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  durationMs?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frameId: number;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      setDisplay(value * easeOutCubic(progress));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, durationMs]);

  return (
    <span className="tabular-nums">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
