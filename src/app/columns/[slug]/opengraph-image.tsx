import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getColumnBySlug } from "@/lib/microcms";
import { themeForArticle } from "@/lib/teamTheme";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "プロ野球LAB コラム";

const COVERS_DIR = path.join(process.cwd(), "public", "covers");
const EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

function findCustomCoverDataUri(slug: string): string | null {
  for (const ext of EXTENSIONS) {
    const filePath = path.join(COVERS_DIR, `${slug}${ext}`);
    if (fs.existsSync(filePath)) {
      const base64 = fs.readFileSync(filePath).toString("base64");
      return `data:${MIME[ext]};base64,${base64}`;
    }
  }
  return null;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const column = await getColumnBySlug(slug).catch(() => null);
  const title = column?.title ?? "プロ野球LAB";
  const plainBody = column?.body.replace(/<[^>]+>/g, "") ?? "";
  const { bg, accent } = themeForArticle(slug, `${title} ${plainBody}`);

  const customCover = findCustomCoverDataUri(slug);
  if (customCover) {
    return new ImageResponse(
      <img src={customCover} alt="" width={size.width} height={size.height} style={{ objectFit: "cover" }} />,
      { ...size },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: bg,
        }}
      >
        <div style={{ width: 28, height: "100%", background: accent, display: "flex" }} />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px",
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#f5f0e6",
              lineHeight: 1.35,
              display: "flex",
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: accent, display: "flex" }} />
            <div style={{ fontSize: 30, fontWeight: 700, color: accent, display: "flex" }}>プロ野球LAB</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
