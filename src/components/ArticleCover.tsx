// 記事のカバーイラスト。写真素材を使わず、slugから決定的に選んだ配色でSVGを生成する。
// ダイアゴナルなカラーブロック＋縫い目ボールのアイコンで、スポーツブック的な力強いタッチにしている
const PALETTES = [
  { bg: "#12181f", accent: "#22c55e" },
  { bg: "#1a1210", accent: "#f97316" },
  { bg: "#0f1729", accent: "#3b82f6" },
  { bg: "#1a0f14", accent: "#ef4444" },
  { bg: "#160f1a", accent: "#a855f7" },
  { bg: "#141a12", accent: "#eab308" },
];

function pickPalette(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length];
}

export function ArticleCover({ slug, className }: { slug: string; className?: string }) {
  const { bg, accent } = pickPalette(slug);
  const gradId = `cover-fade-${slug}`;

  return (
    <svg
      viewBox="0 0 400 225"
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0" />
          <stop offset="1" stopColor={accent} stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <rect width="400" height="225" fill={bg} />
      <polygon points="230,0 400,0 400,225 120,225" fill={`url(#${gradId})`} />
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={40 + i * 26}
          y1="0"
          x2={-40 + i * 26}
          y2="225"
          stroke="#ffffff"
          strokeOpacity="0.05"
          strokeWidth="10"
        />
      ))}
      <g transform="translate(300,112)">
        <circle r="46" fill="#f5f0e6" />
        <path
          d="M -30 -30 A 46 46 0 0 0 -30 30"
          fill="none"
          stroke={bg}
          strokeWidth="2.5"
          strokeDasharray="4 4"
        />
        <path
          d="M 30 -30 A 46 46 0 0 1 30 30"
          fill="none"
          stroke={bg}
          strokeWidth="2.5"
          strokeDasharray="4 4"
        />
      </g>
    </svg>
  );
}
