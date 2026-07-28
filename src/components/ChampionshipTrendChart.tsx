"use client";

import { useMemo, useRef, useState } from "react";
import { CountUpNumber } from "@/components/CountUpNumber";

interface TrendPoint {
  date: string; // "YYYY-MM-DD"
  probability: number; // 0〜1
}

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 200;
const PADDING_X = 6;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 8;

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 優勝確率の推移を折れ線グラフで見せる目玉ビジュアル。ホバーでその日の値をツールチップ表示する
export function ChampionshipTrendChart({
  data,
  accentColor,
}: {
  data: TrendPoint[];
  accentColor: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const innerWidth = VIEW_WIDTH - PADDING_X * 2;
  const innerHeight = VIEW_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const points = useMemo(() => {
    return data.map((d, i) => {
      const pct = Math.max(0, Math.min(1, d.probability));
      const x = data.length === 1 ? PADDING_X : PADDING_X + (innerWidth * i) / (data.length - 1);
      const y = PADDING_TOP + innerHeight * (1 - pct);
      return { x, y, ...d };
    });
  }, [data, innerWidth, innerHeight]);

  if (data.length < 2) return null;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const last = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const tooltipOnLeft = hovered ? hovered.x > VIEW_WIDTH * 0.65 : false;

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const relX = ((e.clientX - rect.left) / rect.width) * VIEW_WIDTH;
    let nearestIndex = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    });
    setHoverIndex(nearestIndex);
  }

  function handlePointerLeave() {
    setHoverIndex(null);
  }

  const gridRatios = [0, 0.5, 1];

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 min-w-0">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="block w-full h-auto"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {gridRatios.map((ratio) => {
            const y = PADDING_TOP + innerHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={PADDING_X}
                  x2={VIEW_WIDTH - PADDING_X}
                  y1={y}
                  y2={y}
                  style={{ stroke: "var(--border)" }}
                  strokeWidth={1}
                />
                <text x={PADDING_X} y={y - 3} fontSize={9} style={{ fill: "var(--ink-muted)" }}>
                  {Math.round(ratio * 100)}%
                </text>
              </g>
            );
          })}

          <path
            d={linePath}
            fill="none"
            style={{ stroke: accentColor }}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <circle cx={last.x} cy={last.y} r={4} style={{ fill: accentColor }} />

          {hovered && (
            <>
              <line
                x1={hovered.x}
                x2={hovered.x}
                y1={PADDING_TOP}
                y2={VIEW_HEIGHT - PADDING_BOTTOM}
                style={{ stroke: "var(--ink-muted)" }}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle
                cx={hovered.x}
                cy={hovered.y}
                r={4}
                style={{ fill: "var(--surface)", stroke: accentColor }}
                strokeWidth={2}
              />
            </>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 z-10 rounded-none px-2 py-1 text-xs whitespace-nowrap"
            style={{
              left: `${(hovered.x / VIEW_WIDTH) * 100}%`,
              transform: tooltipOnLeft ? "translateX(-100%)" : "translateX(0)",
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              color: "var(--ink)",
            }}
          >
            <div style={{ color: "var(--ink-muted)" }}>{formatShortDate(hovered.date)}</div>
            <div className="font-semibold tabular-nums">{(hovered.probability * 100).toFixed(1)}%</div>
          </div>
        )}
      </div>

      <div className="flex flex-none flex-col items-end justify-center">
        <span className="text-[10px]" style={{ color: "var(--ink-muted)" }}>
          最新
        </span>
        <span className="text-2xl font-bold tabular-nums sm:text-3xl" style={{ color: accentColor }}>
          <CountUpNumber value={last.probability * 100} decimals={1} suffix="%" />
        </span>
      </div>
    </div>
  );
}
