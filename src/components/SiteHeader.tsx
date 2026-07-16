import Link from "next/link";

const NAV = [
  { href: "/teams", label: "球団" },
  { href: "/titles", label: "タイトルレース" },
  { href: "/prospects", label: "2軍注目選手" },
  { href: "/columns", label: "コラム" },
];

export function SiteHeader() {
  return (
    <header style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="mx-auto max-w-4xl px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:py-4">
        <Link href="/" className="font-semibold tracking-tight whitespace-nowrap">
          プロ野球LAB
        </Link>
        <nav
          className="flex gap-3 text-xs overflow-x-auto sm:gap-5 sm:text-sm"
          style={{ color: "var(--ink-secondary)" }}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap hover:opacity-70 transition-opacity"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
