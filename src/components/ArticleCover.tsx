import { themeForArticle } from "@/lib/teamTheme";

// 記事のカバーイラスト。写真素材を使わず、記事本文で言及されている球団のチームカラーを
// 使ってSVGを生成する（該当球団が無ければタイトル/slugからの決定的な配色にフォールバック）。
// 構図・アイコンはslugと本文キーワードから決定的に選ぶため、同じ記事は常に同じ見た目になる一方、
// 記事ごとにダイアゴナルの向き・アイコンの種類・位置にバリエーションが出るようにしている

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

type Motif = "ball" | "glove" | "bat" | "strikezone";

function pickMotif(text: string): Motif {
  if (/グローブ|グラブ|捕手|キャッチャー/.test(text)) return "glove";
  if (/バット|素振り|スイング/.test(text)) return "bat";
  if (/ストライク|ボール判定|審判|ルール/.test(text)) return "strikezone";
  return "ball";
}

function BallIcon({ bg }: { bg: string }) {
  return (
    <g>
      <circle r="46" fill="#f5f0e6" />
      <path d="M -30 -30 A 46 46 0 0 0 -30 30" fill="none" stroke={bg} strokeWidth="2.5" strokeDasharray="4 4" />
      <path d="M 30 -30 A 46 46 0 0 1 30 30" fill="none" stroke={bg} strokeWidth="2.5" strokeDasharray="4 4" />
    </g>
  );
}

function GloveIcon({ bg }: { bg: string }) {
  return (
    <g>
      <path
        d="M -34 30 Q -40 -10 -18 -34 Q 0 -50 20 -34 Q 38 -18 32 10 L 30 34 Q 0 44 -34 30 Z"
        fill="#f5f0e6"
      />
      {[-14, 0, 14].map((x) => (
        <line key={x} x1={x} y1="-30" x2={x} y2="10" stroke={bg} strokeWidth="2" strokeDasharray="3 4" />
      ))}
    </g>
  );
}

function BatIcon({ bg }: { bg: string }) {
  return (
    <g transform="rotate(-30)">
      <rect x="-6" y="-52" width="12" height="34" rx="6" fill="#f5f0e6" />
      <rect x="-4" y="-16" width="8" height="60" rx="4" fill="#f5f0e6" />
      <line x1="0" y1="-2" x2="0" y2="40" stroke={bg} strokeWidth="1.5" strokeDasharray="3 5" opacity="0.6" />
    </g>
  );
}

function StrikeZoneIcon({ bg }: { bg: string }) {
  return (
    <g>
      <rect x="-30" y="-38" width="60" height="76" rx="2" fill="none" stroke="#f5f0e6" strokeWidth="4" />
      <path d="M -34 46 L 34 46 L 34 58 L 0 70 L -34 58 Z" fill="#f5f0e6" opacity="0.85" />
      <circle cx="-46" cy="-46" r="9" fill="#f5f0e6" opacity="0.9" stroke={bg} strokeWidth="1" strokeDasharray="2 3" />
    </g>
  );
}

const MOTIF_ICONS: Record<Motif, (props: { bg: string }) => React.ReactElement> = {
  ball: BallIcon,
  glove: GloveIcon,
  bat: BatIcon,
  strikezone: StrikeZoneIcon,
};

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
  const dotId = `cover-dots-${slug}`;

  const seed = hashString(slug);
  const flip = seed % 2 === 1; // ダイアゴナルとアイコンの左右を反転
  const iconY = 70 + (seed % 3) * 40; // 縦位置を3パターンで変化
  const Motif = MOTIF_ICONS[pickMotif(text)];

  const iconX = flip ? 100 : 300;
  const diagonalPoints = flip ? "0,0 170,0 280,225 0,225" : "230,0 400,0 400,225 120,225";

  return (
    <svg
      viewBox="0 0 400 225"
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1={flip ? "1" : "0"} y1="0" x2={flip ? "0" : "1"} y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0" />
          <stop offset="1" stopColor={accent} stopOpacity="0.95" />
        </linearGradient>
        <pattern id={dotId} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="#ffffff" fillOpacity="0.06" />
        </pattern>
      </defs>
      <rect width="400" height="225" fill={bg} />
      <rect width="400" height="225" fill={`url(#${dotId})`} />
      <polygon points={diagonalPoints} fill={`url(#${gradId})`} />
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
      <g transform={`translate(${iconX},${iconY})`}>
        <Motif bg={bg} />
      </g>
    </svg>
  );
}
