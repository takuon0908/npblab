import { createClient } from "microcms-js-sdk";

// microCMSサービス作成前でもビルドが通るよう、チェックは呼び出し時に行う
function getClient() {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;
  if (!serviceDomain || !apiKey) {
    throw new Error("MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY が設定されていません（.env.localを確認）");
  }
  return createClient({ serviceDomain, apiKey });
}

// コラム/分析記事のコンテンツ型（microCMS側のスキーマと対応させる）
export interface Column {
  id: string;
  title: string;
  slug: string;
  body: string; // リッチエディタのHTML
  publishedAt: string;
  updatedAt: string;
  category?: string[]; // 複数選択フィールド。未設定記事は空配列
  tags?: string; // テキストフィールド（カンマ区切りで複数タグを表現）。未入力の記事はキー自体が無い
}

// カテゴリの固定リスト（microCMS側のセレクト肢と合わせる）
export const CATEGORIES = [
  "NPBデータ分析",
  "選手フィーチャー",
  "ペナントレース速報",
  "野球理論（科学的検証）",
  "ルール・基礎知識",
  "体づくり・怪我予防",
  "用具選び",
  "アマチュア野球",
] as const;

// tagsフィールド(カンマ区切りの文字列)をトリム済みの配列に変換する
export function parseTags(tags?: string): string[] {
  if (!tags) return [];
  return tags
    .split(/[,、]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function getColumns(limit = 20, category?: string, tag?: string, offset = 0) {
  const filters = [
    category ? `category[contains]${category}` : null,
    tag ? `tags[contains]${tag}` : null,
  ]
    .filter(Boolean)
    .join("[and]");

  return getClient().getList<Column>({
    endpoint: "columns",
    queries: {
      limit,
      offset,
      orders: "-publishedAt",
      ...(filters ? { filters } : {}),
    },
  });
}

// getColumnsは1回のリクエストにつき最大100件までしか返さないため、
// 公開済みコラムが100本を超えた場合に漏れが出ないようoffsetでページングして全件取得する
export async function getAllColumns(category?: string, tag?: string) {
  const pageSize = 100;
  let offset = 0;
  const all: Column[] = [];
  for (;;) {
    const { contents, totalCount } = await getColumns(pageSize, category, tag, offset);
    all.push(...contents);
    offset += pageSize;
    if (offset >= totalCount || contents.length === 0) break;
  }
  return all;
}

// リッチエディタが本文中の引用符等をHTMLエンティティとして保存することがあり、
// タグを取り除いただけでは "&quot;改革&quot;" のような生の文字列が残ってしまうため、
// meta descriptionや本文冒頭の抜粋を作る前にデコードしておく
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

// meta descriptionをHTML本文から生成する。単純な文字数カットだと文の途中で
// 切れて読みにくくなるため、「。」の文境界を優先して150字前後に収める
export function excerptForMeta(bodyHtml: string, maxLength = 150): string {
  const text = decodeHtmlEntities(bodyHtml.replace(/<[^>]+>/g, "")).trim();
  if (text.length <= maxLength) return text;

  const sentences = text.split("。");
  let result = "";
  for (const sentence of sentences) {
    const candidate = result ? `${result}。${sentence}` : sentence;
    if (candidate.length > maxLength) break;
    result = candidate;
  }
  if (result) return `${result}。`;
  // 最初の一文だけでmaxLengthを超える場合は文字数で打ち切る
  return `${text.slice(0, maxLength)}…`;
}

// 記事本文のh2見出しから目次(TOC)用の一覧を作る。microCMSのリッチエディタはh2に
// 既にユニークなid("ha9513ebe96"等)を振っているため、それを再利用する(無ければ生成する)
export function withHeadingAnchors(bodyHtml: string): { html: string; headings: { id: string; text: string }[] } {
  const headings: { id: string; text: string }[] = [];
  let index = 0;
  const html = bodyHtml.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (_match, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const existingId = attrs.match(/\bid="([^"]+)"/)?.[1];
    const id = existingId ?? `section-${index}`;
    headings.push({ id, text });
    index += 1;
    return existingId ? `<h2${attrs}>${inner}</h2>` : `<h2${attrs} id="${id}">${inner}</h2>`;
  });
  return { html, headings };
}

// <table>を横スクロール用のラッパーdivで包む。表自体にoverflow-x/display:blockを
// 直接当てると、テーブルの内部グリッド(行・セル)が中身の幅に縮んでラッパーの右側に
// 余白ができてしまう(display:blockにした時点でtableの「幅を100%にする」効果が
// 内部グリッドに伝わらなくなるため)。ラッパー側で横スクロールを担当させ、
// <table>自体はwidth:100%の通常のtable表示のままにしておくのが安全
export function wrapTables(bodyHtml: string): string {
  return bodyHtml.replace(/<table>[\s\S]*?<\/table>/g, (match) => `<div class="table-scroll">${match}</div>`);
}

// 記事本文をh2見出しの境界でセクションに分割する。図解画像をmicroCMSのbody(リッチテキスト)に
// 直接埋め込めない(API経由の<img>は保存時に除去される)ため、指定セクションの直後にReactコンポーネント
// として画像を挿入できるようにするための下準備。戻り値のsegments[0]は最初のh2より前の導入部、
// segments[N]はN番目(1始まり)のh2から次のh2の直前までの本文
export function splitBodyIntoSections(bodyHtml: string): string[] {
  const h2Regex = /<h2[^>]*>/g;
  const starts: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = h2Regex.exec(bodyHtml))) starts.push(match.index);

  const segments: string[] = [];
  let prev = 0;
  for (const start of starts) {
    segments.push(bodyHtml.slice(prev, start));
    prev = start;
  }
  segments.push(bodyHtml.slice(prev));
  return segments;
}

export async function getColumnBySlug(slug: string) {
  const res = await getClient().getList<Column>({
    endpoint: "columns",
    queries: { filters: `slug[equals]${slug}`, limit: 1 },
  });
  return res.contents[0] ?? null;
}
