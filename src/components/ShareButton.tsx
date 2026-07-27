// X(旧Twitter)への共有リンク。GoodButtonと横並びで馴染むよう同系のピル型ボタンにし、
// ホバー時だけ号外風のアクセントカラーを効かせる
export function ShareButton({ title, url }: { title: string; url: string }) {
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

  return (
    <a
      href={shareUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
      style={{
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "var(--ink)",
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="13"
        height="13"
        fill="currentColor"
        className="transition-colors group-hover:[color:var(--accent)]"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      <span>シェア</span>
    </a>
  );
}
