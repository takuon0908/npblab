<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# プロ野球LAB — プロジェクト概要

NPB(プロ野球)のデータを独自分析するアフィリエイトブログ。優勝確率・タイトル獲得確率・2軍→1軍換算などをMonte Carloシミュレーションで算出し、日次更新する想定。

## 本番環境

- サイト: https://npblab.vercel.app （Vercel）
- リポジトリ: https://github.com/takuon0908/npblab
- DB: Supabase (Postgres)。`DATABASE_URL`はpgbouncerプーリング接続(port 6543)、`DIRECT_URL`はセッションモード(port 5432、マイグレーション専用)
- コラムCMS: microCMS（サービスドメイン`t230hpy6je`、エンドポイント`columns`。フィールドは`title`/`slug`/`body`で完全一致必須）

## アーキテクチャ

- `src/app/`: Next.js App Router のページ（`/teams`, `/titles`, `/prospects`, `/columns`, `/analysis`, `/about/methodology`）。全て`export const dynamic = "force-dynamic"`でDBを都度読む
- `src/lib/prisma.ts`: Prismaクライアントのシングルトン（`@prisma/adapter-pg`使用）
- `src/lib/whatif.ts`: 補強What-Ifシミュレーション（既存の`simulateLeagueChampionship`を再利用）
- `src/components/`: `Table`/`Th`/`Td`（ランキング表の共通部品）、`Meter`（確率バー）、`StatTile`、`GamesAboveBelow500`（貯金/借金の色分け表示）
- `scripts/scraper/`: npb.jpから順位表・試合日程・タイトルリーダーズ・1軍/2軍個人成績をスクレイピングしDBにupsert（`npm run scrape`）
- `scripts/simulation/`: log5法によるモンテカルロで優勝確率・タイトル獲得確率を算出（`npm run simulate`）
- `scripts/analytics/`: ピタゴラス勝率・Eloパワーランキング・直近成績・スカウティングレポート文章を自動生成（`npm run analyze`）
- `scripts/prospects/`: 2軍成績を1軍換算する独自ランキング（`npm run prospects`）

## 重要な注意点

- **Vercelのビルドキャッシュ問題**: `npm install`がスキップされると`prisma generate`が走らずビルド失敗する。`package.json`の`build`スクリプト自体に`prisma generate &&`を仕込んで回避済み
- **npb.jp利用規約**: フッターに二次利用・無断転載禁止の明記あり。事実データの「情報解析」目的として続行中（ユーザー了承済み、著作権法上のグレーゾーンという認識）
- **打率・防御率のタイトルは未実装**: 比率成績のため規定打席/投球回の判定ロジックが別途必要（TODO）
- **npb.jpのDOM構造**: 1軍/2軍でカラム構成が違う（2軍投手にホールド列が無い等）。ヘッダーラベル文字列から列位置を引く方式で吸収（`scripts/scraper/parse.ts`の`buildHeaderIndex`）
- **投球回表記**: 「6.1」は6回1/3（実数の小数ではない、野球独自表記）。降板時0アウトは"+"という特殊表記

## 未着手（次のステップ）

1. GitHub Actionsで日次パイプライン自動化（scrape→simulate→analyze→prospects）— 元々のゴールだが未着手
2. `NEXT_PUBLIC_SITE_URL`をVercel環境変数に追加（デプロイ後ドメイン確定後の設定）
3. OGP画像生成、Search Console登録
4. 打率・防御率のタイトルレース対応

## 詳しい経緯

作業ログはObsidian Vault `04_Projects/野球を科学するサイト.md` に日付ごとに記録している。判断の理由や試行錯誤の詳細はそちらを参照。
