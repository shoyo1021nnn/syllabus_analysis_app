/**
 * PostgREST の論理フィルタ文字列（supabase-js の `.or()` / `.and()` に渡す文字列）に
 * ユーザー入力などの任意の値を安全に埋め込むためのヘルパー。
 *
 * `.or()` の文字列では `,` `(` `)` `.` `:` が構文上の区切りとして解釈されるため、
 * 値をそのまま埋め込むと「線形代数(1)」「A,B」のような入力でクエリが壊れる。
 * PostgREST は値をダブルクォートで囲むと中の記号を区切りとして扱わず、
 * クォート内では `\` と `"` をバックスラッシュでエスケープする。
 * （supabase-js 自身も `.in()` で同じ記法を使っている）
 *
 * 注意：`ilike` の `%` / `_`（および PostgREST で `%` と同じ意味の `*`）は
 * クォート内でもワイルドカードとして働く。ここではその挙動は変えない。
 */
export function quotePostgrestValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * `column.ilike."%value%"` 形式の部分一致条件を組み立てる。
 * 複数列を `.or()` で OR 検索するときは、これを `,` で連結して渡す。
 */
export function ilikeContains(column: string, value: string): string {
  return `${column}.ilike.${quotePostgrestValue(`%${value}%`)}`;
}

/** `column.ilike."%value"` 形式の後方一致条件を組み立てる */
export function ilikeEndsWith(column: string, value: string): string {
  return `${column}.ilike.${quotePostgrestValue(`%${value}`)}`;
}
