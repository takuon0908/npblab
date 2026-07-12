import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Prisma CLIは.env.localを自動で読まないため明示的にロードする
config({ path: ".env.local" });

// Supabaseのpgbouncer(トランザクションモード)はDDLに向かないため、
// prisma migrate等のCLI操作はセッションモードのDIRECT_URLを使う。
// アプリ実行時（src/lib/prisma.ts、scripts/*）は引き続きDATABASE_URL（プーリング）を使う
const cliUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!cliUrl) {
  throw new Error("DIRECT_URL/DATABASE_URLが設定されていません（.env.localを確認、Supabaseの接続文字列が必要）");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: cliUrl,
  },
});
