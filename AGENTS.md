<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# プロジェクト概要: Syllabus Analysis App

大学・学部・学科のシラバスから抽出した 24 次元スキルベクトル（知識 12 ＋ 汎用 12）を可視化・比較し、画面の文脈に連動した AI アシスタントと対話できる Web アプリ（卒業研究の成果物）。

**詳細なルール・アーキテクチャ・計算ロジックは [CLAUDE.md](CLAUDE.md) を参照すること。** 特に次の 3 点は必ず守る。

1. Next.js 16 / AI SDK v7 は現行のドキュメント・型定義を確認してから書く。
2. `src/lib/vectorUtils.ts` の計算式と各ページの既定パラメータ（卒業論文の分析結果に関わる）を変えない。
3. UI 文字列は `src/locales/ja.ts` / `en.ts` の両方にキーを追加し、`t('key', '日本語フォールバック')` で表示する。

## 技術スタック
- Next.js 16（App Router, TypeScript）、Tailwind CSS v4
- react-resizable-panels（左 67% 分析画面：右 33% エージェントパネル）
- Vercel AI SDK（`ai` v7 / `@ai-sdk/react`、`/api/chat` で `gpt-4o-mini` をストリーミング）
- Supabase（PostgreSQL、ブラウザから直接クエリ）
- ECharts（`echarts-for-react`）

## 画面構成・ルーティング
| パス | 内容 |
|---|---|
| `/` | ポータル（エージェントなし） |
| `/universities` | 大学 → 学部 → 学科の基本情報ディレクトリ |
| `/analytics` | スキルベクトル分析：`/clustering`・`/similarity`・`/radar_chart` |
| `/macro` | マクロな学習支援：`/skill_complementation`・`/best_pair`・`/greedy_team` |
| `/micro` | ミクロな学習支援：`/portfolio`・`/recommendation` |

## アーキテクチャの重要ルール
1. `/` 以外の画面は「左 2/3（分析画面）：右 1/3（エージェントパネル）」の共通レイアウトを維持する（各セクションの `layout.tsx`）。
2. 各ページは `setAnalyticsContext` で画面文脈とプリセット質問チップ（日英）を共有し、エージェントパネルに表示する。
3. プリセットチップをクリックすると、`/api/chat` 経由で即座にストリーミング回答が返る。チャット履歴はルートの `ChatProvider` で保持し、セクションを移動しても残る。
