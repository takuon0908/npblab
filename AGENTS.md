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

## チーム体制（コンテンツ運用会社）

- **CEO（ユーザー）**: 方針決定・最終承認。デザイン/優先順位の好みなど「人にしか判断できないこと」の担当
- **Claude Code（自分＝ボス）**: 技術実装全般（データ基盤・UI・QA・デプロイ）＋サブエージェント陣の指揮・成果物の取りまとめ
- **`seo-strategist`**（`.claude/agents/seo-strategist.md`）: 何を書くか＝ネタ出し・SEO戦略の提案。実行はせず選択肢を提示するのみ
- **`growth-strategist`**（`.claude/agents/growth-strategist.md`）: 集めたアクセスをどう収益化・回遊させるか＝広告/アフィリエイト戦略・内部導線・計測状況の提案。実行（アカウント開設・契約）はしない
- **`researcher`**（`.claude/agents/researcher.md`）: 記事の元になる事実・数字の裏取り、背景調査。記事は書かない
- **ライター陣**（それぞれ得意分野・キャラクターが違う。案件に応じてボスが使い分ける）
  - `content-writer`（`.claude/agents/content-writer.md`）: 汎用ライター。特定のキャラが不要な記事全般
  - `writer-stats`（`.claude/agents/writer-stats.md`）: データ・数字重視。確率の変動やセイバーメトリクス系の記事
  - `writer-passion`（`.claude/agents/writer-passion.md`）: 熱血・応援目線。逆転劇やドラマ性のある記事
  - `writer-goods`（`.claude/agents/writer-goods.md`）: グッズ・観戦アイテム・商品紹介系（アフィリエイト導線を意識）
  - `writer-baseball-otaku`（`.claude/agents/writer-baseball-otaku.md`）: 戦術・技術論・球史比較など「野球の中身」に踏み込む記事
  - `writer-sports-science`（`.claude/agents/writer-sports-science.md`）: バイオメカニクス・スポーツ科学視点、独自指標の科学的な解説
  - `writer-caster`（`.claude/agents/writer-caster.md`）: 実況風のライブ感・速報性重視の記事
- **`editor`**（`.claude/agents/editor.md`）: ライター陣の下書きをCEOに見せる前に品質チェック（事実確認・転記チェック・文体チェック）。自分では書かない・公開しない
- **`developer`**（`.claude/agents/developer.md`）: ボスから渡されたスコープ明確な実装タスクを担当。設計判断・デプロイ・pushはしない

### ワークフロー

1. `seo-strategist`がネタ案を複数提示 → CEOが選ぶ（または自由に指示）
2. `researcher`が事実・数字を裏取りして調査メモを作る
3. ボスが記事のキャラに合うライターを選んで執筆依頼（`content-drafts/`に下書き保存）
4. `editor`が下書きをレビュー（事実確認・文体チェック）
5. CEOが最終確認 → OKならmicroCMS管理画面に手動で入稿（自動公開はしない）
6. コード修正・小機能追加が必要な場合は`developer`に依頼、ボスが最終レビュー
7. `growth-strategist`が定期的にPV・収益化状況を棚卸しし、改善案をCEOに提示（実行は伴わない）

## 未着手（次のステップ）

1. **アクセス解析(GA4等)が未導入 — 最優先**: `src/app/layout.tsx`にトラッキングコードが一切無く、現状PVを計測できていない。CEOにGA4プロパティ作成を依頼し、測定IDを受け取り次第、実装側で組み込む
2. 収益化手段が未導入（広告・アフィリエイトの契約ゼロ）: `growth-strategist`が選択肢を整理予定。ASP登録・AdSense審査申請等はCEOの作業が必要
3. GitHub Actionsで日次パイプライン自動化（scrape→simulate→analyze→prospects）— Secrets設定・動作確認まで完了。以前スクレイパーが20分タイムアウトでキャンセルされる不具合があったが、fetchタイムアウト追加+並列化で解消（実測2分程度）
4. `NEXT_PUBLIC_SITE_URL`をVercel環境変数に追加（デプロイ後ドメイン確定後の設定、`https://npblab.vercel.app`）
5. OGP画像生成、Search Console登録
6. 打率・防御率のタイトルレース対応

## 詳しい経緯

作業ログはObsidian Vault `04_Projects/野球を科学するサイト.md` に日付ごとに記録している。判断の理由や試行錯誤の詳細はそちらを参照。
