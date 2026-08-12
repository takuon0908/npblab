// content-drafts/配下の下書きで、既存の公開記事(同じslug)をリライトして更新する。
// publish-drafts.tsはcreate()しかしないため、既存slugに対して使うと重複記事ができてしまう
// (2026-08-12に実際に発生した事故: fighters-farm-depthが重複作成された)。
// リライト時は必ずこちらを使うこと。
// 使い方: npx tsx --env-file=.env.local scripts/publish/update-draft.ts <ファイル名>
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

function parseDraft(raw: string, fileName: string) {
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
  const fileName = process.argv[2];
  if (!fileName) {
    console.error("使い方: npx tsx --env-file=.env.local scripts/publish/update-draft.ts <ファイル名>");
    process.exit(1);
  }

  const filePath = path.join(DRAFTS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`${fileName} が見つかりません`);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const draft = parseDraft(raw, fileName);

  const client = getClient();
  const list = await client.getList({
    endpoint: "columns",
    queries: { filters: `slug[equals]${draft.slug}`, limit: 10 },
  });

  if (list.contents.length === 0) {
    throw new Error(`slug=${draft.slug} の既存記事が見つかりません。新規記事はpublish-drafts.tsを使ってください`);
  }
  if (list.contents.length > 1) {
    throw new Error(
      `slug=${draft.slug} が複数件ヒットしました(id: ${list.contents.map((c) => c.id).join(", ")})。重複している可能性があるため、手動で確認してから実行してください`
    );
  }

  const target = list.contents[0];
  await client.update({
    endpoint: "columns",
    contentId: target.id,
    content: { title: draft.title, body: draft.body },
  });

  fs.renameSync(filePath, path.join(PUBLISHED_DIR, fileName));
  console.log(`更新しました: ${draft.title} (id=${target.id}, slug=${draft.slug})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
