import fs from "node:fs";
import path from "node:path";
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
}: {
  slug: string;
  text: string;
  className?: string;
}) {
  const customSrc = findCustomCover(slug);
  if (!customSrc) {
    return <ArticleCover slug={slug} text={text} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={customSrc}
      alt=""
      className={className}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}
