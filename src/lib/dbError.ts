/**
 * 画面に表示する DB（Supabase）エラーの種類。
 * 各ページは文言を組み立てずに「キー＋引数」を DatabaseErrorBanner に渡し、
 * バナー側で t('dbError.<key>') により表示言語の文言へ変換する。
 */
export type DbErrorKey =
  | "notConfigured"
  | "notConfiguredMock"
  | "fetchFailed"
  | "clusteringFetchFailed"
  | "tableEmpty"
  | "networkError";

export interface DbErrorInfo {
  key: DbErrorKey;
  /** 文言中の {detail} / {table} などに埋め込む値 */
  params?: Record<string, string>;
}

/** ロケールにキーが見つからない場合の日本語フォールバック（ja.ts の dbError と同じ内容） */
export const DB_ERROR_FALLBACK_JA: Record<DbErrorKey, string> = {
  notConfigured:
    "Supabaseの接続設定（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）が未設定または無効です。",
  notConfiguredMock: "Supabaseの接続設定が未設定のため、モックデータで表示しています。",
  fetchFailed: "データベースからのデータ取得に失敗しました: {detail}",
  clusteringFetchFailed: "クラスタリング実行履歴の取得に失敗しました: {detail}",
  tableEmpty: "テーブル「{table}」にデータが存在しません。",
  networkError: "データベース通信エラーが発生しました: {detail}",
};

/** catch した例外などから、エラー詳細として表示する文字列を取り出す */
export function errorDetail(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

/** {name} 形式のプレースホルダーを置換する */
export function fillParams(template: string, params?: Record<string, string>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in params ? params[name] : m
  );
}
