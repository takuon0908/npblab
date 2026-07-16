import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateJa } from "@/lib/date";

const FOOTER_LINKS = [
  { href: "/games", label: "試合結果" },
  { href: "/teams", label: "球団" },
  { href: "/titles", label: "タイトルレース" },
  { href: "/prospects", label: "2軍注目選手" },
  { href: "/analysis", label: "独自指標" },
  { href: "/columns", label: "コラム" },
  { href: "/about/methodology", label: "算出方法について" },
];

export async function SiteFooter() {
  const latest = await prisma.standingsSnapshot.aggregate({ _max: { date: true } });
  const updatedAt = latest._max.date ? formatDateJa(latest._max.date) : null;

  return (
    <footer className="mt-auto" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <nav
          className="flex flex-wrap gap-x-4 gap-y-2 text-xs mb-4"
          style={{ color: "var(--ink-secondary)" }}
        >
          {FOOTER_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="text-xs" style={{ color: "var(--ink-muted)" }}>
          {updatedAt && <p className="mb-1">データ最終更新: {updatedAt}</p>}
          <p>
            掲載の確率・指標は公開情報をもとにした独自の分析・試算であり、NPB公式の見解や予測ではありません。
          </p>
        </div>
      </div>
    </footer>
  );
}
