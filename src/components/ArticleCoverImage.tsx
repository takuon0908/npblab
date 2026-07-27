import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { ArticleCover } from "./ArticleCover";

// public/covers/{slug}.{png,jpg,jpeg,webp} を用意すればその画像を優先表示する。
// 無ければ従来通りArticleCoverが球団カラーからSVGを自動生成する
const COVERS_DIR = path.join(process.cwd(), "public", "covers");
const EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

function findCustomCover(slug: string): string | null {
  for (const ext of EXTENSIONS) {
    if (fs.existsSync(path.join(COVERS_DIR, `${slug}${ext}`))) {
      return `/covers/${slug}${ext}`;
    }
  }
  return null;
}

export function ArticleCoverImage({
  slug,
  text,
  className,
  priority,
  title,
  category,
  tags,
}: {
  slug: string;
  text: string;
  className?: string;
  // ファーストビューに表示される画像(記事ヘッダー・一覧のトップ記事)ではtrueにし、LCPを改善する
  priority?: boolean;
  // 指定するとAI生成カバー画像の上に見出しを重ねて表示する(サムネイル用途では文字が潰れるため指定しない)
  title?: string;
  // 記事のcategory/tags。指定すると本文中の言及より優先して球団カラーの判定に使う
  category?: string[];
  tags?: string;
}) {
  const customSrc = findCustomCover(slug);
  if (!customSrc) {
    return <ArticleCover slug={slug} text={text} className={className} category={category} tags={tags} />;
  }

  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <Image
        src={customSrc}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 700px"
        style={{ objectFit: "cover" }}
        priority={priority}
      />
      {title && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            background: "linear-gradient(to top, rgba(22,21,19,0.85) 0%, rgba(22,21,19,0.35) 45%, rgba(22,21,19,0) 70%)",
          }}
        >
          <p
            style={{
              margin: 0,
              padding: "20px",
              color: "#f5f0e6",
              fontFamily: "var(--font-shippori-mincho)",
              fontWeight: 700,
              fontSize: "clamp(1rem, 2.2vw, 1.5rem)",
              lineHeight: 1.5,
              textWrap: "balance",
            }}
          >
            {title}
          </p>
        </div>
      )}
    </div>
  );
}
