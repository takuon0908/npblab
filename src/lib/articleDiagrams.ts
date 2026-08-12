import type { ComponentType } from "react";
import { CSAdvantageDiagram } from "@/components/diagrams/CSAdvantageDiagram";
import { FarmZoneDiagram } from "@/components/diagrams/FarmZoneDiagram";
import { WindupDeclarationDiagram } from "@/components/diagrams/WindupDeclarationDiagram";

// 記事本文に埋め込む解説図解。microCMSのAPI経由でbody(リッチテキスト)に<img>タグを含めても
// 保存時に除去されてしまうため、コード側でセクション見出しの直後に挿入する。
// afterSection は本文中のh2見出しの何番目の直後に挿入するか(1始まり)。
// 画像ファイル(src)を置く方式と、外部画像を使わず費用ゼロで描画できるSVGコンポーネント方式の
// どちらかを指定する(componentを指定した場合はsrc/altは不要)
export interface ArticleDiagram {
  src?: string;
  alt?: string;
  component?: ComponentType;
  afterSection: number;
}

export const ARTICLE_DIAGRAMS: Record<string, ArticleDiagram[]> = {
  "increase-pitching-velocity-guide": [
    {
      src: "/columns/diagrams/increase-pitching-velocity-guide-kinetic-chain.jpg",
      alt: "運動連鎖によるエネルギー伝達と、胸郭の開き(ヒップ・ショルダー・セパレーション)の比較図解",
      afterSection: 1,
    },
    {
      src: "/columns/diagrams/increase-pitching-velocity-guide-training-tools.jpg",
      alt: "加重ボールトレーニングやバイオメカニクス計測など、球速アップに使われる主なトレーニングツールの図解",
      afterSection: 2,
    },
    {
      src: "/columns/diagrams/increase-pitching-velocity-guide-mobility.jpg",
      alt: "肩甲骨・股関節の可動域チェックと、部位別トレーニングの図解",
      afterSection: 3,
    },
    {
      src: "/columns/diagrams/increase-pitching-velocity-guide-data.jpg",
      alt: "球速と回転数の相関、下半身出力と球速の相関、トレーニングによる出力向上の推移を示すグラフ",
      afterSection: 4,
    },
  ],
  "rules-basics-cs-new-rule-2026": [{ component: CSAdvantageDiagram, afterSection: 2 }],
  "rules-basics-farm-3zone-2026": [{ component: FarmZoneDiagram, afterSection: 3 }],
  "rules-basics-windup-declaration-2026": [{ component: WindupDeclarationDiagram, afterSection: 2 }],
};

export function getArticleDiagrams(slug: string): ArticleDiagram[] {
  return ARTICLE_DIAGRAMS[slug] ?? [];
}
