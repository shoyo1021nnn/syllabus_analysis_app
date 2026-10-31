# CLAUDE.md

Syllabus Analysis App：卒業研究「シラバスからのLLMスキル抽出・大学間比較・学習支援」の分析結果を提示する Web アプリ。
大学・学部・学科のカリキュラムを 24 次元スキルベクトルで可視化・比較し、画面の文脈に連動した AI アシスタントと対話できる。

## 最重要ルール

1. **Next.js 16 は学習データと API・規約が異なる。** Next.js 関連のコードを書く前に `node_modules/next/dist/docs/` の該当ガイドを読み、非推奨の警告に従うこと。Vercel AI SDK（`ai` v7 / `@ai-sdk/react`）も、`node_modules` 内の型定義で現行 API を確認してから使う。
2. **卒業論文の分析結果を変えないこと。** `src/lib/vectorUtils.ts` の計算式（正規化、類似度、スキル補完、ベスト・ペア、貪欲法、個人プロファイル、科目推薦）と、各ページの既定パラメータ（L1 正規化固定、理想値 3.0 など）は、明示的な指示がない限り変更しない。計算結果に影響しうる変更をした場合は必ず報告する。
3. **日英両対応を崩さないこと。** UI 文字列はハードコードせず、`src/locales/ja.ts` と `src/locales/en.ts` の両方にキーを追加して `t('key', '日本語フォールバック')` で表示する。
4. `AGENTS.md` の `<!-- BEGIN:nextjs-agent-rules -->` 〜 `<!-- END:nextjs-agent-rules -->` ブロックは `next dev` が自動生成するため編集しない。

## コマンド

```bash
npm run dev     # 開発サーバー (http://localhost:3000)
npm run build   # 本番ビルド（変更後は必ず通ることを確認）
npm run lint    # ESLint
```

テストフレームワークは未導入。変更後は最低限 `npm run lint`（0 errors / 0 warnings を維持）と `npm run build` を実行する。

## 環境変数（`.env.local`）

| 変数 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase の URL（末尾の `/rest/v1` は `src/lib/supabase.ts` で自動除去） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon キー |
| `OPENAI_API_KEY` | `/api/chat` が使用（`@ai-sdk/openai` が自動で読み込む） |
| `CHAT_RATE_LIMIT_MAX` | `/api/chat` のレート制限：ウィンドウ内に許可する IP ごとのリクエスト数（既定 20、超過時 429） |
| `CHAT_RATE_LIMIT_WINDOW_SEC` | `/api/chat` のレート制限：ウィンドウの長さ（秒、既定 60） |
| `CHAT_MAX_MESSAGES` | 1 リクエストのメッセージ数上限（既定 40、超過時 400） |
| `CHAT_MAX_HISTORY` | モデルに渡す直近メッセージ数（既定 20。クライアントの `ChatContext` も直近 20 件だけ送る） |
| `CHAT_MAX_MESSAGE_CHARS` | ユーザーメッセージ 1 件の最大文字数（既定 4000。アシスタントの過去回答はその 4 倍、超過時 400） |
| `CHAT_MAX_CONTEXT_BYTES` | 画面文脈 `context` の JSON 最大バイト数（既定 32768、超過時 400） |

`CHAT_*` は `src/lib/chatGuard.ts` がサーバー側でのみ読む。レート制限はプロセスのメモリ内で数えるため Vercel では厳密に効かない（VM では Nginx の `limit_req` を併用、`docs/nginx-rate-limit.md`）。`NEXT_PUBLIC_` で始まる変数はビルド時に埋め込まれる。値を変えたら再ビルドが必要。Supabase 未設定・エラー時は、各ページがモックデータに切り替えて `DatabaseErrorBanner` を表示する。

## アーキテクチャ

- **クライアント主体の構成。** 各ページ（`"use client"`）がブラウザから Supabase へ直接クエリし、計算はすべて `src/lib/vectorUtils.ts` でクライアント側に都度実行する。
- **サーバー処理は API ルート 2 本のみ。**
  - `src/app/api/chat/route.ts`：システムプロンプト（システム仕様、24 スキル定義、画面文脈、回答フォーマット）を組み立て、`gpt-4o-mini` でストリーミング応答する。先頭で `src/lib/chatGuard.ts` による IP 単位のレート制限（超過時 429 ＋ `Retry-After`）と入力検証（メッセージ数・文字数・context サイズ、`user` / `assistant` 以外のロール拒否。違反時 400）を行い、モデルには直近 `CHAT_MAX_HISTORY` 件だけを渡す。
  - `src/app/api/parse-grade-pdf/route.ts`：Campusmate の成績照会 PDF を unpdf で解析し、`course_skill_vectors` と照合する（講義コード完全一致 → 下 6 桁一致 → ナンバリング一致 → 科目名部分一致）。Supabase クライアントは `src/lib/supabase.ts` の共通のもの（URL 正規化あり）を使い、未設定時は解析前に 503 を返す。エラー応答は `error`（日本語、従来互換）に加えて `code`（`db_not_configured` / `no_file` / `no_text` / `no_courses` / `processing_failed`）を返し、`GradePdfImportModal` が `modal.gradePdf.apiErrors.<code>` で表示言語に変換する。
- **レイアウト。** `analytics` / `macro` / `micro` / `universities` の各 `layout.tsx` が、共通ヘッダーと `react-resizable-panels` による左 67%（分析画面）：右 33%（`AgentPanel`）の分割を持つ。新しい画面でもこの構成を維持する。
- **チャット履歴はルートで保持する。** `src/app/layout.tsx` の `ChatProvider`（`src/context/ChatContext.tsx`）が AI SDK の `Chat` インスタンスを 1 つだけ持ち、`AgentPanel` は `useChat({ chat })` で共有する。セクション layout が再マウントされても履歴は残る（メモリのみ。再読み込みで消える）。`Chat` には固定 `id` を渡すこと（省略すると構築時の `Math.random()` で Next.js 16 のプリレンダーが失敗する）。クライアントも `prepareSendMessagesRequest` で直近 20 件だけ送る。画面文脈（`AnalyticsProvider`）は従来どおり各セクション layout に置く。
- **`.or()` に値を埋め込むときは `src/lib/postgrestFilter.ts`（`ilikeContains` など）を通す。** 値をそのまま連結すると `,` `( )` を含む入力でクエリが壊れる。
- **React の state の書き方（`npm run lint` を 0 件に保つ）。** `useEffect` の中で同期的に `setState` しない。
  - 大学フィルターの state は表示ラベルではなく `src/lib/univFilter.ts` の `ALL_UNIVERSITIES` か大学名で持ち、`SearchableSelect` には `univSelectProps()` で渡す。
  - 操作に応じた state の連動（レベル変更でフィルターを戻す等）はイベントハンドラで行う。データや URL クエリから初期値を決める処理は、変化を検知してレンダー中に 1 度だけ調整する（各分析ページの `appliedInit` 参照）。
  - localStorage など外部の値は `useSyncExternalStore` で読む（`enrolledCoursesStore.ts`、`LanguageContext.tsx`）。
- **DB エラー表示。** 各ページは文言を組み立てず、`DbErrorInfo`（`src/lib/dbError.ts` のキー＋引数）を `DatabaseErrorBanner` の `error` に渡す。文言は `dbError.<key>` で表示言語に変換される。

### ルーティング

| パス | 内容 |
|---|---|
| `/` | ポータル（エージェントなし） |
| `/universities` | 大学 → 学部 → 学科の基本情報ディレクトリ |
| `/analytics` | ハブ。`/clustering`（PCA 散布図）、`/similarity`（類似度ランキング）、`/radar_chart`（レーダー比較） |
| `/macro` | ハブ。`/skill_complementation`（スキル補完検索）、`/best_pair`（ベスト・ペア検索）、`/greedy_team`（貪欲法チーム編成） |
| `/micro` | ハブ。`/portfolio`（履修・スキルポートフォリオ、PDF 取り込み）、`/recommendation`（不足スキル補完・科目推薦） |

### ディレクトリ

```
src/
  app/              ページ・レイアウト・API ルート
  components/       AgentPanel, ActionCards, MarkdownMessage, SearchableSelect, AcademicUnitInfo* など
  components/charts RadarChart, ClusterScatterPlot, SimilarityRanking, RadarLegend, DualChartExportButton
  components/micro  GradePdfImportModal
  context/          AnalyticsContext（画面文脈）, ChatContext（チャット履歴の共有）, LanguageContext（ja/en）, AcademicUnitModalContext
  lib/              vectorUtils.ts（全計算ロジック）, supabase.ts, chartExportUtils.ts（PNG 出力）,
                    courseCandidates.ts（推薦候補の全件取得）, chatGuard.ts（/api/chat の検証・レート制限）, dbError.ts,
                    univFilter.ts（大学フィルター）, enrolledCoursesStore.ts（履修リストの共通ストア）,
                    recordFields.ts（階層混在レコードの列アクセス）, postgrestFilter.ts（.or() のエスケープ）
  locales/          ja.ts, en.ts
  types/            database.ts（DB 型）, actions.ts（AI アクション型）
docs/               nginx-rate-limit.md（学内 VM の Nginx limit_req 設定例）
```

## データモデル（Supabase）

- `skill_vector_department` / `skill_vector_faculty` / `skill_vector_university`：`knowledge_vector`（A 群 12 次元）、`general_vector`（B 群 12 次元）、`subject_count`、`website_url`。`university_name` に `gpt-` を含む実験用レコードは画面側で除外する。
- `clustering_runs` / `clustering_points`：PCA と K-means は**アプリ外で事前計算**した結果。runs はシルエットスコア順位 `rank`（1〜5）、`k`、PC1/PC2 寄与率を持つ。アプリは読むだけ。
- `course_skill_vectors`：九州大学の科目単位のスキル（`a_1_…`〜`b_12_…` の 24 列。3 回抽出の合計で各 0〜9）、`knowledge_vector` / `general_vector`、`is_zero_vector`（true の科目は検索・推薦から除外）。
- 型定義は `src/types/database.ts`。スキルの定義（コードと日英名称）は `vectorUtils.ts` の `KNOWLEDGE_SKILLS` / `GENERAL_SKILLS` が唯一の正とする。

## 計算ロジックの要点（変更禁止の前提）

- 類似度ランキングとレーダーチャートは **L1 正規化（構成比 %）で固定**。
- マクロ支援の「理想ベクトル」は、全次元 3.0 の一様ベクトルを L1 正規化したもの（＝スキルの均等さを測る基準）。
- スキル補完の `synergy` は (sim_A + 最大値結合の理想達成度) / 2。
- ミクロ支援の個人プロファイルは、履修科目ベクトルの単純合計（案 B）。履修リストは localStorage（キー `syllabus_enrolled_courses`）に保存し、DB には書き込まない。読み書きは必ず `src/lib/enrolledCoursesStore.ts` の `useEnrolledCourses()` を通す（各ページで localStorage を直接読まない）。
- 弱みスキルは `calculatePersonalSkillProfile` の昇順ソートの下位 4 件（同点はスキル定義順で先頭が残る）。推薦画面はこの選び方を変えず、境界と同点で表示外のスキルがあれば注記と一覧を表示するだけにしている。履修 0 件のときは推薦を計算せず、ポートフォリオへの案内を出す。
- 科目推薦の候補は `src/lib/courseCandidates.ts` が `.order('id').range()` の 1,000 件単位ページングで、フィルタ条件に合う全件（学部「すべて」で約 5,900 件）を取得し、条件ごとにモジュールスコープでキャッシュする。`.limit()` で件数を絞らないこと（評価対象が欠ける）。
- 貪欲法チーム編成の目標閾値：画面の初期値は 0.90（選択肢 0.85 / 0.90 / 0.93 / 0.95）。`runGreedyTeamBuild` の既定値 0.95 は省略時のフォールバックで、変更しない。`topReinforcedSkills` はスキルコード（`{ code, delta }`）で持ち、表示時に `getSkillName(code, language)` で名前に変換する。

## AI アシスタントの規約

- 各ページは `useAnalyticsContext().setAnalyticsContext({...})` で以下を共有する。新しいページを追加するときも同じように実装する。
  - `pageTitle`、`pagePath`
  - `primaryTarget` / `compareTarget`
  - `summaryText`
  - `details`：AI が読むための数値データ（上位スキルの % など）
  - `presetQuestions`：日英それぞれのチップ文言
- `AgentPanel` は `context` と `language` を body に付けて `/api/chat` に送る。
- `/api/chat` は回答末尾に ```` ```analysis-actions ```` 形式の JSON 配列を出力させる。`MarkdownMessage` がこれを検知して `ActionCards` として描画し、クリックで `targetPage?params` に遷移する。
- 遷移先のページは、クエリ（`primaryId` / `compareId` / `primaryDept` / `primaryUniv` / `compareDept` / `compareUniv` / `dept` / `univ` など）から初期対象を選択する。新しい遷移先を追加するときは、`/api/chat` のプロンプト内の `targetPage` 一覧と、受け側ページのクエリ処理を両方更新する。
- システムプロンプトの 24 スキル一覧は `KNOWLEDGE_SKILLS` / `GENERAL_SKILLS` と一致させる。

## スタイル・実装の慣習

- TypeScript と React 関数コンポーネントで書く。スタイルは Tailwind CSS v4、グラフは ECharts（`echarts-for-react`）、アイコンは `lucide-react`。
- 配色：基準対象は teal `#009688`、比較・パートナーは `#e0532b`、合成・補完後は `#059669`。セクションの色は analytics が teal、macro が orange、micro が indigo。
- 表示ラベルは `【大学名】 学科名` 形式（各ページの `formatLabel`）。
- コード内のコメントは日本語でよい。

## デプロイ

- Vercel と、学内 VM（Ubuntu 24.04、Node.js 22、PM2、Nginx）の両方で動かしている。VM の更新手順は「GitHub に push → VM 上の `deploy.sh`（git pull → build → pm2 restart）」。
- VM の Nginx では、PDF アップロードのための `client_max_body_size 20M` と、AI ストリーミングのための `proxy_buffering off` が必須。これらを前提とする変更（アップロードサイズ、ストリーミング形式）には注意する。

## コミット

- 形式は `type(scope): 日本語の説明`（例：`feat(radar): レーダーチャートの全画面表示を追加`）。type は feat / fix / refactor / docs / chore など。
- 課題や機能ごとにコミットを分ける。
