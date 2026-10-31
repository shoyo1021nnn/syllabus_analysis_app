/**
 * 大学・学部・学科のどの階層かわからないレコード（SkillVectorRecord や、
 * それを元にした候補オブジェクト）から、階層に応じて存在しない列を安全に読むためのヘルパー。
 *
 * SkillVectorUniversity には faculty_name / department_name がないため、
 * `(rec as any).faculty_name` と書く代わりにこれらを使う（文字列以外は undefined を返す）。
 */

function readStringField(rec: unknown, key: string): string | undefined {
  if (!rec || typeof rec !== "object" || !(key in rec)) return undefined;
  const value = (rec as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

/** 学部名（大学レコードなど、列がない場合は undefined） */
export function getFacultyName(rec: unknown): string | undefined {
  return readStringField(rec, "faculty_name");
}

/** 学科名（大学・学部レコードなど、列がない場合は undefined） */
export function getDepartmentName(rec: unknown): string | undefined {
  return readStringField(rec, "department_name");
}
