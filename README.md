This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 環境変数（`.env.local`）

| 変数 | 既定値 | 用途 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | なし | Supabase の URL（末尾の `/rest/v1` は自動除去） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | なし | Supabase の anon キー |
| `OPENAI_API_KEY` | なし | `/api/chat` が使用 |
| `CHAT_RATE_LIMIT_MAX` | `20` | `/api/chat` のレート制限：ウィンドウ内に許可する IP ごとのリクエスト数（超過時は 429） |
| `CHAT_RATE_LIMIT_WINDOW_SEC` | `60` | `/api/chat` のレート制限：ウィンドウの長さ（秒） |
| `CHAT_MAX_MESSAGES` | `40` | 1 リクエストで受け付けるメッセージ数の上限（超過時は 400） |
| `CHAT_MAX_HISTORY` | `20` | モデルに渡す直近メッセージ数（古い履歴は切り捨て） |
| `CHAT_MAX_MESSAGE_CHARS` | `4000` | ユーザーメッセージ 1 件の最大文字数（アシスタントの過去回答はその 4 倍。超過時は 400） |
| `CHAT_MAX_CONTEXT_BYTES` | `32768` | 画面文脈 `context` の JSON の最大バイト数（超過時は 400） |

`CHAT_*` はサーバー側でのみ読み込む（`src/lib/chatGuard.ts`）。レート制限はプロセスのメモリ内で数えるため、学内 VM（PM2 単一プロセス）では有効だが、Vercel のサーバーレス環境では厳密には効かない。VM では Nginx の `limit_req` も併用する（[docs/nginx-rate-limit.md](docs/nginx-rate-limit.md)）。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
