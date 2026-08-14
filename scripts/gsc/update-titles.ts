// サーチコンソールのデータで「表示回数は多いがCTRが低い」と判明したページのtitleだけを更新する。
// bodyは一切変更しない(メタディスクリプションはbodyの冒頭から自動生成されるため、
// 本文を変えると読者向けの導入文まで変わってしまう。titleフィールドのみを直接更新する)
import { createClient } from "microcms-js-sdk";

function getClient() {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;
  if (!serviceDomain || !apiKey) throw new Error("MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY が設定されていません");
  return createClient({ serviceDomain, apiKey });
}

// 各タイトルの変更理由はコミットメッセージ・チャット報告を参照。
// 共通の考え方: 検索結果でタイトルが途中で切れる際、既存タイトルは冒頭の
// 「野球のルール入門：」というシリーズ接頭辞が実質的な検索キーワード
// (「新ルール」「サスペンデッドゲーム」等)より先に来てしまい、肝心な部分が
// 切れて表示されにくくなっていた。検索されているキーワードを前方に出す形に組み替える
const TITLE_UPDATES: Record<string, string> = {
  "rules-basics-intentional-walk": "申告敬遠とは何か ― なぜ4球投げなくてよくなったのか【野球のルール入門】",
};

async function main() {
  const client = getClient();
  for (const [slug, newTitle] of Object.entries(TITLE_UPDATES)) {
    const list = await client.getList({ endpoint: "columns", queries: { filters: `slug[equals]${slug}`, limit: 1 } });
    if (list.contents.length === 0) {
      console.warn(`スキップ: slug=${slug} が見つかりません`);
      continue;
    }
    const target = list.contents[0];
    console.log(`旧: ${target.title}`);
    console.log(`新: ${newTitle}`);
    await client.update({ endpoint: "columns", contentId: target.id, content: { title: newTitle } });
    console.log(`更新しました: slug=${slug} (id=${target.id})\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
