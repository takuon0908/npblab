import Image from "next/image";
import type { TeamReporter } from "@/lib/teamReporters";

// 球団ページのヒーロー内に小さく添える「担当記者」バッジ。
// マスコットキャラクターが無い球団(該当する動物がいない)では何も表示しない
export function TeamReporterBadge({ reporter }: { reporter: TeamReporter | null }) {
  if (!reporter) return null;

  return (
    <div className="flex items-center gap-2 mt-4" style={{ color: "var(--ink-secondary)" }}>
      <div
        className="flex-none overflow-hidden rounded-full"
        style={{ width: 36, height: 36, border: "1px solid var(--border-strong)" }}
      >
        <Image src={reporter.image} alt={reporter.name} width={36} height={36} style={{ objectFit: "cover", width: 36, height: 36 }} />
      </div>
      <span className="text-xs">
        担当記者: <span className="font-semibold" style={{ color: "var(--ink)" }}>{reporter.name}</span>
      </span>
    </div>
  );
}
