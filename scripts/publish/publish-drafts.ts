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
  return { title: fields.title, slug: fields.slug, body: body.trim() };
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

    const result = await client.create({
      endpoint: "columns",
      content: { title: draft.title, slug: draft.slug, body: draft.body },
      isDraft: false,
    });

    fs.renameSync(filePath, path.join(PUBLISHED_DIR, file));
    console.log(`公開しました: ${draft.title} (id=${result.id}, slug=${draft.slug})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
