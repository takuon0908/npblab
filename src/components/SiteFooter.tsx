import { prisma } from "@/lib/prisma";

function formatDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export async function SiteFooter() {
  const latest = await prisma.standingsSnapshot.aggregate({ _max: { date: true } });
  const updatedAt = latest._max.date ? formatDate(latest._max.date) : null;

  return (
    <footer className="mt-auto" style={{ borderTop: "1px solid var(--border)" }}>
      <div
        className="mx-auto max-w-4xl px-4 py-6 text-xs"
        style={{ color: "var(--ink-muted)" }}
      >
        {updatedAt && <p className="mb-1">データ最終更新: {updatedAt}</p>}
        <p>
          掲載の確率・指標は公開情報をもとにした独自の分析・試算であり、NPB公式の見解や予測ではありません。
        </p>
      </div>
    </footer>
  );
}
