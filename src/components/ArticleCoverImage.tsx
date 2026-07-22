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
}: {
  slug: string;
  text: string;
  className?: string;
  // ファーストビューに表示される画像(記事ヘッダー・一覧のトップ記事)ではtrueにし、LCPを改善する
  priority?: boolean;
}) {
  const customSrc = findCustomCover(slug);
  if (!customSrc) {
    return <ArticleCover slug={slug} text={text} className={className} />;
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
    </div>
  );
}
