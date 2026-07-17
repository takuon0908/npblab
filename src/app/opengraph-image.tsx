import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "プロ野球LAB";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#12181f",
          padding: "0 90px",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, color: "#22c55e", display: "flex", marginBottom: 20 }}>
          NPB DATA LAB
        </div>
        <div style={{ fontSize: 76, fontWeight: 700, color: "#f5f0e6", display: "flex", marginBottom: 28 }}>
          プロ野球LAB
        </div>
        <div style={{ fontSize: 32, color: "#c8cdd2", display: "flex" }}>
          優勝確率・タイトル獲得確率をモンテカルロシミュレーションで毎日更新
        </div>
      </div>
    ),
    { ...size },
  );
}
