import type { PlayerSocialLinks, SocialLink } from "@/lib/playerSocialLinks";

function XIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YouTubeIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" />
    </svg>
  );
}

function FanClubIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20.5s-7.5-4.35-9.5-9.1C1.2 8.2 3 5 6.3 5c1.9 0 3.4 1 5.7 3.4C14.3 6 15.8 5 17.7 5 21 5 22.8 8.2 21.5 11.4c-2 4.75-9.5 9.1-9.5 9.1z" />
    </svg>
  );
}

function WikipediaIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h4M4 6l4 12 3-9 3 9 4-12M17 6h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PLATFORMS: {
  key: keyof PlayerSocialLinks;
  Icon: (props: { size?: number }) => React.ReactElement;
  label: string;
}[] = [
  { key: "x", Icon: XIcon, label: "X" },
  { key: "instagram", Icon: InstagramIcon, label: "Instagram" },
  { key: "youtube", Icon: YouTubeIcon, label: "YouTube" },
  { key: "fanclub", Icon: FanClubIcon, label: "Fan Club" },
  { key: "wikipedia", Icon: WikipediaIcon, label: "Wikipedia" },
];

// ランキング表の行など、スペースが限られる場所で使うコンパクト版。
// アイコンだけだと何のリンクか分かりにくいため、ユーザー名(handle)も併記する
export function PlayerSocialIcons({ links }: { links: PlayerSocialLinks | null }) {
  if (!links) return null;
  const entries = PLATFORMS.map((p) => ({ ...p, link: links[p.key] })).filter(
    (p): p is (typeof PLATFORMS)[number] & { link: SocialLink } => Boolean(p.link),
  );
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1" aria-label="選手本人のSNS">
      {entries.map(({ key, Icon, label, link }) => (
        <a
          key={key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:underline"
          style={{ color: "var(--accent)" }}
          title={label}
        >
          <Icon size={12} />
          <span className="text-xs whitespace-nowrap" style={{ color: "var(--ink-muted)" }}>
            {link.handle ?? label}
          </span>
        </a>
      ))}
    </div>
  );
}

// 選手ページ本体で使うフル版。アイコン+プラットフォーム名+ユーザー名を1つのピルに収める
export function PlayerSocialLinksRow({ links }: { links: PlayerSocialLinks | null }) {
  if (!links) return null;
  const entries = PLATFORMS.map((p) => ({ ...p, link: links[p.key] })).filter(
    (p): p is (typeof PLATFORMS)[number] & { link: SocialLink } => Boolean(p.link),
  );
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3" aria-label="選手本人のSNS">
      {entries.map(({ key, Icon, label, link }) => (
        <a
          key={key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover-lift inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={{ border: "1px solid var(--border-strong)", color: "var(--ink-secondary)" }}
        >
          <Icon />
          <span style={{ color: "var(--ink)" }}>{label}</span>
          {link.handle && <span style={{ color: "var(--ink-muted)" }}>{link.handle}</span>}
        </a>
      ))}
    </div>
  );
}
