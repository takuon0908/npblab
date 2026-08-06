import type { TeamSocialLinks, TeamSocialLink } from "@/lib/teamSocialLinks";

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" />
    </svg>
  );
}

function FanClubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20.5s-7.5-4.35-9.5-9.1C1.2 8.2 3 5 6.3 5c1.9 0 3.4 1 5.7 3.4C14.3 6 15.8 5 17.7 5 21 5 22.8 8.2 21.5 11.4c-2 4.75-9.5 9.1-9.5 9.1z" />
    </svg>
  );
}

const PLATFORMS: {
  key: keyof TeamSocialLinks;
  Icon: () => React.ReactElement;
  label: string;
}[] = [
  { key: "x", Icon: XIcon, label: "X" },
  { key: "instagram", Icon: InstagramIcon, label: "Instagram" },
  { key: "youtube", Icon: YouTubeIcon, label: "YouTube" },
  { key: "fanclub", Icon: FanClubIcon, label: "ファンクラブ" },
];

// 球団カラーは黄系(明るい)〜紺・赤系(暗い)まで幅広いため、背景の輝度に応じて
// 文字色を白/濃紺で自動的に切り替える(固定色だと一部の球団で読めなくなるため)
function readableTextColor(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "#f5f0e6";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 140 ? "#0d1a26" : "#f5f0e6";
}

// 球団ヒーローパネル向けのリッチな表示。球団カラーで塗りつぶした
// ボタンにして、選手個人ページの控えめなアウトラインピルより存在感を出す
export function TeamSocialLinksRow({ links, accentColor }: { links: TeamSocialLinks | null; accentColor: string }) {
  if (!links) return null;
  const entries = PLATFORMS.map((p) => ({ ...p, link: links[p.key] })).filter(
    (p): p is (typeof PLATFORMS)[number] & { link: TeamSocialLink } => Boolean(p.link),
  );
  if (entries.length === 0) return null;
  const textColor = readableTextColor(accentColor);

  return (
    <div className="flex flex-wrap gap-2 mt-4" aria-label="球団公式SNS">
      {entries.map(({ key, Icon, label, link }) => (
        <a
          key={key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover-lift inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold"
          style={{ background: accentColor, color: textColor }}
        >
          <Icon />
          {label}
        </a>
      ))}
    </div>
  );
}
