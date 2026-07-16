import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TitleCategory } from "@prisma/client";
import { Meter } from "@/components/Meter";
import { Table, Th, Td } from "@/components/Table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プロ野球タイトルレース 獲得確率ランキング",
  description:
    "本塁打王・打点王・盗塁王・最多勝・最多奪三振・最多セーブ・最多ホールドなど、NPBタイトル争いの獲得確率を日次シミュレーションで算出。現在値から最終予測値まで一目で分かります。",
  alternates: { canonical: "/titles" },
};

const CATEGORY_LABELS: Record<TitleCategory, string> = {
  [TitleCategory.BATTING_AVERAGE]: "首位打者",
  [TitleCategory.HOME_RUNS]: "本塁打王",
  [TitleCategory.RBI]: "打点王",
  [TitleCategory.STOLEN_BASES]: "盗塁王",
  [TitleCategory.WINS]: "最多勝",
  [TitleCategory.ERA]: "防御率",
  [TitleCategory.STRIKEOUTS]: "最多奪三振",
  [TitleCategory.SAVES]: "最多セーブ",
  [TitleCategory.HOLDS]: "最多ホールド",
};

// 成績の単位。打率・防御率のような比率成績は単位を付けない前提（未対応カテゴリなので実質未使用）
const CATEGORY_UNITS: Partial<Record<TitleCategory, string>> = {
  [TitleCategory.HOME_RUNS]: "本",
  [TitleCategory.RBI]: "打点",
  [TitleCategory.STOLEN_BASES]: "盗塁",
  [TitleCategory.WINS]: "勝",
  [TitleCategory.STRIKEOUTS]: "奪三振",
  [TitleCategory.SAVES]: "セーブ",
  [TitleCategory.HOLDS]: "ホールド",
};

// 打率・防御率は比率成績で規定打席/投球回の判定が必要になるため、シミュレーション未対応（TODO）
const IMPLEMENTED_CATEGORIES: TitleCategory[] = [
  TitleCategory.HOME_RUNS,
  TitleCategory.RBI,
  TitleCategory.STOLEN_BASES,
  TitleCategory.WINS,
  TitleCategory.STRIKEOUTS,
  TitleCategory.SAVES,
  TitleCategory.HOLDS,
];

async function getTitleRaces() {
  const latest = await prisma.titleRaceProbability.aggregate({ _max: { date: true } });
  if (!latest._max.date) return null;

  const rows = await prisma.titleRaceProbability.findMany({
    where: { date: latest._max.date },
    include: { team: true },
    orderBy: { probability: "desc" },
  });

  const byCategory = new Map<TitleCategory, typeof rows>();
  for (const row of rows) {
    const list = byCategory.get(row.category) ?? [];
    list.push(row);
    byCategory.set(row.category, list);
  }
  return byCategory;
}

export default async function TitlesPage() {
  const byCategory = await getTitleRaces();

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">タイトルレース</h1>

      {!byCategory ? (
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          データがありません。<code>npm run scrape</code> と <code>npm run simulate</code> を実行してください。
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 min-w-0">
          {IMPLEMENTED_CATEGORIES.map((category) => {
            const rows = (byCategory.get(category) ?? []).slice(0, 5);
            const unit = CATEGORY_UNITS[category] ?? "";
            return (
              <div key={category}>
                <h2 className="font-semibold mb-3">{CATEGORY_LABELS[category]}</h2>
                {rows.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                    データなし
                  </p>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>選手</Th>
                        <Th align="right">現在</Th>
                        <Th align="right">確率</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={row.playerId} className="hover:bg-black/[0.03]">
                          <Td>
                            <span className="text-xs mr-1.5" style={{ color: "var(--ink-muted)" }}>
                              {i + 1}
                            </span>
                            {row.playerName}
                            <Link
                              href={`/teams/${row.team.slug}`}
                              className="text-xs ml-1 hover:underline"
                              style={{ color: "var(--ink-secondary)" }}
                            >
                              ({row.team.name})
                            </Link>
                          </Td>
                          <Td align="right">
                            <div className="font-semibold text-base">
                              {row.currentValue}
                              {unit}
                            </div>
                            <div className="text-xs" style={{ color: "var(--ink-muted)" }}>
                              予測 {row.projectedValue.toFixed(1)}
                              {unit}
                            </div>
                          </Td>
                          <Td align="right">
                            <div className="inline-block w-32 align-middle">
                              <Meter value={row.probability} />
                            </div>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
