<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# プロジェクト概要: CurricuLens (Syllabus Analytics & AI Assistant)

大学等のシラバス・カリキュラムデータを可視化・分析し、画面の文脈に連動したAIエージェントと対話できるWebアプリケーション。

## 技術スタック
- Framework: Next.js (App Router, TypeScript)
- Styling: Tailwind CSS
- Layout: react-resizable-panels (左2/3 分析画面 : 右1/3 エージェントパネル)
- LLM / Chat: Vercel AI SDK (@ai-sdk/react, Next.js Route Handler /api/chat)
- Database: Supabase (PostgreSQL)
- Visualization: ECharts (echarts-for-react) または Cytoscape.js

## 画面構成・ルーティング
- /analytics/network: 科目・スキルの関連性ネットワーク分析
- /analytics/curriculum: カリキュラムマップ・クラスタリング表示
- /analytics/subject/[id]: 個別科目のシラバスおよび抽出スキル詳細

## アーキテクチャの重要ルール
1. どの画面でも「左2/3（分析画面）：右1/3（エージェントパネル）」の共通レイアウトを維持すること。
2. エージェントパネルには、現在のURLパスや選択中ノード（科目名・スキル名）に応じた「プリセット質問チップ」を表示すること。
3. プリセットチップをクリックすると、/api/chat 経由で即座にストリーミング回答が返ること。
