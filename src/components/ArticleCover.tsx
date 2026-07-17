import { themeForArticle } from "@/lib/teamTheme";

// 記事のカバーイラスト。写真素材を使わず、記事本文で言及されている球団のチームカラーを
// 使ってSVGを生成する（該当球団が無ければタイトル/slugからの決定的な配色にフォールバック）。
// ダイアゴナルなカラーブロック＋縫い目ボールのアイコンで、スポーツブック的な力強いタッチにしている

export function ArticleCover({
  slug,
  text,
  className,
}: {
  slug: string;
  text: string;
  className?: string;
}) {
  const { bg, accent } = themeForArticle(slug, text);
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
