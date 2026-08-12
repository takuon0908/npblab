import { TEAM_THEME } from "@/lib/teamTheme";

interface ZoneTeam {
  name: string;
  themeSlug?: keyof typeof TEAM_THEME;
}

const ZONES: { label: string; teams: ZoneTeam[] }[] = [
  {
    label: "東地区",
    teams: [
      { name: "楽天", themeSlug: "eagles" },
      { name: "オイシックス新潟" },
      { name: "ヤクルト", themeSlug: "swallows" },
      { name: "ロッテ", themeSlug: "marines" },
      { name: "日本ハム", themeSlug: "fighters" },
    ],
  },
  {
    label: "中地区",
    teams: [
      { name: "西武", themeSlug: "lions" },
      { name: "巨人", themeSlug: "giants" },
      { name: "DeNA", themeSlug: "baystars" },
      { name: "くふうハヤテ静岡" },
      { name: "中日", themeSlug: "dragons" },
    ],
  },
  {
    label: "西地区",
    teams: [
      { name: "オリックス", themeSlug: "buffaloes" },
      { name: "阪神", themeSlug: "tigers" },
      { name: "広島", themeSlug: "carp" },
      { name: "ソフトバンク", themeSlug: "hawks" },
    ],
  },
];

const ZONE_WIDTH = 196;
const ZONE_GAP = 16;
const ROW_HEIGHT = 34;

// ファーム3地区制の球団振り分けを示す図解。外部画像を使わず、既存のTEAM_THEMEを
// そのまま流用してチームカラーのドットを添えたインラインSVGとして描画する
export function FarmZoneDiagram() {
  const maxTeams = Math.max(...ZONES.map((z) => z.teams.length));
  const height = 56 + maxTeams * ROW_HEIGHT + 16;

  return (
    <svg
      viewBox={`0 0 ${ZONE_WIDTH * 3 + ZONE_GAP * 2} ${height}`}
      role="img"
      aria-label="ファーム3地区制の球団振り分け図。東地区は楽天・オイシックス新潟・ヤクルト・ロッテ・日本ハムの5球団、中地区は西武・巨人・DeNA・くふうハヤテ静岡・中日の5球団、西地区はオリックス・阪神・広島・ソフトバンクの4球団"
      style={{ width: "100%", height: "auto" }}
    >
      {ZONES.map((zone, zi) => {
        const x = zi * (ZONE_WIDTH + ZONE_GAP);
        return (
          <g key={zone.label}>
            <rect x={x} y={0} width={ZONE_WIDTH} height={height} rx="8" fill="var(--surface)" stroke="var(--border-strong)" />
            <rect x={x} y={0} width={ZONE_WIDTH} height={40} rx="8" fill="var(--accent-track)" />
            <rect x={x} y={24} width={ZONE_WIDTH} height={16} fill="var(--accent-track)" />
            <text x={x + ZONE_WIDTH / 2} y={26} textAnchor="middle" fill="var(--accent)" fontSize="15" fontWeight="800">
              {zone.label}（{zone.teams.length}球団）
            </text>
            {zone.teams.map((team, ti) => {
              const rowY = 56 + ti * ROW_HEIGHT;
              return (
                <g key={team.name}>
                  <circle
                    cx={x + 24}
                    cy={rowY}
                    r="6"
                    fill={team.themeSlug ? TEAM_THEME[team.themeSlug].accent : "var(--ink-muted)"}
                  />
                  <text x={x + 40} y={rowY + 5} fill="var(--ink)" fontSize="13.5">
                    {team.name}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
