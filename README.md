# Syllabus Analysis App

大学・学部・学科のシラバスから LLM で抽出した **24 次元スキルベクトル**（知識スキル A-1〜A-12 ＋ 汎用スキル B-1〜B-12）を可視化・比較し、画面の文脈に連動した AI アシスタントと対話できる Web アプリです。卒業研究「シラバスからの LLM スキル抽出・大学間比較・学習支援」の分析結果を提示するために作られています。

- **スキルベクトル分析**：PCA ＋ K-means のクラスタリング散布図、類似度ランキング、レーダーチャート比較
- **マクロな学習支援**：組織間のスキル補完検索、ベスト・ペア検索、貪欲法によるチーム編成
- **ミクロな学習支援**：個人の履修・スキルポートフォリオ（成績照会 PDF の取り込み対応）、不足スキルを補う科目推薦
- **AI アシスタント**：各画面の右 1/3 に表示。画面の選択状態に応じたプリセット質問チップから、ストリーミングで回答
- UI は日本語・英語に対応

## 技術スタック

Next.js 16（App Router, TypeScript）／ Tailwind CSS v4 ／ react-resizable-panels ／ Vercel AI SDK v7（`gpt-4o-mini`）／ Supabase（PostgreSQL）／ ECharts

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

## ローカルでの起動

前提：Node.js 22 以上、npm。

```bash
git clone https://github.com/shoyo1021nnn/syllabus_analysis_app.git
cd syllabus_analysis_app
npm ci                 # package-lock.json どおりに依存関係をインストール
# .env.local を作成し、上の環境変数を設定する
npm run dev            # http://localhost:3000
```

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー（ビルド後） |
| `npm run lint` | ESLint |

Supabase が未設定またはエラーの場合、各ページはモックデータに切り替えて接続エラーのバナーを表示します。

## ページ構成

| パス | 内容 |
|---|---|
| `/` | ポータル（各セクションへの入口） |
| `/universities` | 大学 → 学部 → 学科の基本情報ディレクトリ |
| `/analytics` | スキルベクトル分析のハブ |
| `/analytics/clustering` | PCA 散布図による K-means クラスタリング表示 |
| `/analytics/similarity` | 基準学科との類似度ランキング（コサイン類似度など） |
| `/analytics/radar_chart` | 2 つの学科のスキル構成比をレーダーチャートで比較 |
| `/macro` | マクロな学習支援のハブ |
| `/macro/skill_complementation` | 不足スキルを補完できるパートナー組織の検索 |
| `/macro/best_pair` | 1 対 1 で最大のシナジーを生む組み合わせの検索 |
| `/macro/greedy_team` | 貪欲法による多人数チーム編成シミュレーション |
| `/micro` | ミクロな学習支援のハブ |
| `/micro/portfolio` | 履修科目の登録とスキル累積レーダーチャート |
| `/micro/recommendation` | 不足スキルを補う科目の推薦と履修シミュレーション |
| `/api/chat` | AI アシスタントのストリーミング API |
| `/api/parse-grade-pdf` | 成績照会 PDF の解析と科目照合 API |

`/` 以外の画面は、左 2/3 が分析画面、右 1/3 が AI アシスタントの共通レイアウトです。

## Supabase のテーブル

| テーブル | 内容 | 主な列 |
|---|---|---|
| `skill_vector_university` | 大学単位のスキルベクトル | `university_name`, `subject_count`, `knowledge_vector`（12次元）, `general_vector`（12次元）, `website_url` |
| `skill_vector_faculty` | 学部単位のスキルベクトル | 上記 ＋ `faculty_name` |
| `skill_vector_department` | 学科単位のスキルベクトル | 上記 ＋ `faculty_name`, `department_name` |
| `clustering_runs` | クラスタリングの実行結果（アプリ外で事前計算） | `level`, `rank`（シルエットスコア順位 1〜5）, `k`, `silhouette_score`, `pc1_ratio`, `pc2_ratio` |
| `clustering_points` | 各学科の PCA 座標とクラスタ番号 | `run_id`, `department_id`, `pca_x`, `pca_y`, `cluster_id` |
| `course_skill_vectors` | 九州大学の科目単位のスキル（約 5,900 科目） | `course_code`, `course_name`, `faculty_name`, `semester`, `credits`, `a_1_…`〜`b_12_…`（24 列、各 0〜9）, `knowledge_vector`, `general_vector`, `is_zero_vector` |

アプリは読み取りのみです。履修リストはブラウザの localStorage に保存し、DB には書き込みません。`university_name` に `gpt-` を含む実験用レコードと、`is_zero_vector = true` の科目は画面側で除外します。

## デプロイ

Vercel と学内 VM（Ubuntu 24.04 / Node.js 22 / PM2 / Nginx）で動かしています。VM の Nginx では、PDF アップロード用の `client_max_body_size 20M` と、AI ストリーミング用の `proxy_buffering off` が必須です。`/api/chat` のレート制限の設定例は [docs/nginx-rate-limit.md](docs/nginx-rate-limit.md) を参照してください。

## 開発者向け

コーディング規約、計算ロジックの前提（変更禁止事項）、AI アシスタントの実装規約は [CLAUDE.md](CLAUDE.md) にまとめています。
