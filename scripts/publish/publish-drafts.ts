// content-drafts/配下の下書きをmicroCMSに公開する
// 使い方: npx tsx --env-file=.env.local scripts/publish/publish-drafts.ts [対象ファイル名...]
// 引数なしの場合はcontent-drafts/直下の全.mdファイル(published/配下を除く)が対象

import fs from "node:fs";
import path from "node:path";
import { createClient } from "microcms-js-sdk";

const DRAFTS_DIR = path.join(process.cwd(), "content-drafts");
const PUBLISHED_DIR = path.join(DRAFTS_DIR, "published");

function getClient() {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;
  if (!serviceDomain || !apiKey) {
    throw new Error("MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY が設定されていません（.env.localを確認）");
  }
  return createClient({ serviceDomain, apiKey });
}

interface ParsedDraft {
  title: string;
  slug: string;
  body: string;
}

// microCMSのcategoryが必須フィールドのため、slugのパターンから自動でカテゴリを割り当てる。
// 該当しない場合はNPBデータ分析にフォールバックする
const CATEGORY_RULES: [RegExp, string][] = [
  [/^(pitching-myth|pitching-velocity|batting-myth|tactics|fielding-basics|baserunning-basics|mental-science)-/, "野球理論（科学的検証）"],
  [/^rules-basics-/, "ルール・基礎知識"],
  [/^injury-prevention-/, "体づくり・怪我予防"],
  [/^gear-guide-/, "用具選び"],
  [/^skyperfectv-/, "用具選び"],
  [/^npb-viewing-guide-/, "用具選び"],
  [/^pennant-race-/, "ペナントレース速報"],
  [/^(satoh|murakami|taira)-/, "選手フィーチャー"],
  [/^mlb-japanese-/, "選手フィーチャー"],
  [/^amateur-baseball-/, "アマチュア野球"],
];

function inferCategory(slug: string): string {
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(slug)) return category;
  }
  return "NPBデータ分析";
}

function parseDraft(raw: string, fileName: string): ParsedDraft {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${fileName}: frontmatterが見つかりません`);
  const [, frontmatter, body] = match;

  const fields: Record<string, string> = {};
  for (const line of frontmatter.split("\n")) {
    const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (m) fields[m[1]] = m[2];
  }
  if (!fields.title || !fields.slug) {
    throw new Error(`${fileName}: frontmatterにtitle/slugが必要です`);
  }
  const trimmedBody = body.trim();
  if (/<\/?content>/.test(trimmedBody) || trimmedBody.includes("下書き")) {
    throw new Error(`${fileName}: 本文に不審なタグ(</content>等)や「下書き」という文言が残っています。公開前に確認してください`);
  }
  return { title: fields.title, slug: fields.slug, body: trimmedBody };
}

async function main() {
  const targets = process.argv.slice(2);
  fs.mkdirSync(PUBLISHED_DIR, { recursive: true });

  const files =
    targets.length > 0
      ? targets
      : fs.readdirSync(DRAFTS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md");

  if (files.length === 0) {
    console.log("公開対象の下書きがありません");
    return;
  }

  const client = getClient();

  for (const file of files) {
    const filePath = path.join(DRAFTS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`スキップ: ${file} が見つかりません`);
      continue;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const draft = parseDraft(raw, file);

    const category = inferCategory(draft.slug);
    const result = await client.create({
      endpoint: "columns",
      content: { title: draft.title, slug: draft.slug, body: draft.body, category: [category] },
      isDraft: false,
    });

    fs.renameSync(filePath, path.join(PUBLISHED_DIR, file));
    console.log(`公開しました: ${draft.title} (id=${result.id}, slug=${draft.slug})`);

    await triggerRevalidate(draft.slug, category);
  }
}

// 記事系ページはrevalidateをかなり長く取っている(Vercel無料枠のISR Writes節約のため)ので、
// 公開直後に本番サイトへ反映させるにはこのオンデマンド呼び出しが必須
async function triggerRevalidate(slug: string, category: string) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    console.warn("REVALIDATE_SECRET未設定のため、本番反映まで最大24時間かかります(.env.localを確認)");
    return;
  }
  try {
    const url = `https://www.npblab.com/api/revalidate?secret=${encodeURIComponent(secret)}&slug=${encodeURIComponent(slug)}&category=${encodeURIComponent(category)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log("本番サイトのキャッシュを即時更新しました");
  } catch (err) {
    console.warn("revalidate呼び出しに失敗しました(反映まで時間がかかる可能性):", (err as Error).message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
