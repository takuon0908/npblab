import type { PlayerSocialLinks } from "@/lib/playerSocialLinks";

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

// ランキング表の行など、スペースが限られる場所で使うアイコンのみの簡易版。
// ラベル文字は付けず、アイコンの色でリンクだと分かるようにしている
export function PlayerSocialIcons({ links }: { links: PlayerSocialLinks | null }) {
  if (!links || (!links.x && !links.instagram)) return null;

  return (
    <span className="inline-flex items-center gap-1 ml-1.5" aria-label="選手本人のSNS">
      {links.x && (
        <a
          href={links.x}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex hover:opacity-70"
          style={{ color: "var(--accent)" }}
          title="X"
        >
          <XIcon size={13} />
        </a>
      )}
      {links.instagram && (
        <a
          href={links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex hover:opacity-70"
          style={{ color: "var(--accent)" }}
          title="Instagram"
        >
          <InstagramIcon size={13} />
        </a>
      )}
    </span>
  );
}

// 本人確認が取れている選手だけ、公式サイト等へのリンクと同じ並びでSNSアイコンを表示する
export function PlayerSocialLinksRow({ links }: { links: PlayerSocialLinks | null }) {
  if (!links || (!links.x && !links.instagram)) return null;

  return (
    <div className="flex gap-2 mt-3" aria-label="選手本人のSNS">
      {links.x && (
        <a
          href={links.x}
          target="_blank"
          rel="noopener noreferrer"
          className="hover-lift inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={{ border: "1px solid var(--border-strong)", color: "var(--ink-secondary)" }}
        >
          <XIcon />X
        </a>
      )}
      {links.instagram && (
        <a
          href={links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="hover-lift inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={{ border: "1px solid var(--border-strong)", color: "var(--ink-secondary)" }}
        >
          <InstagramIcon />
          Instagram
        </a>
      )}
    </div>
  );
}
