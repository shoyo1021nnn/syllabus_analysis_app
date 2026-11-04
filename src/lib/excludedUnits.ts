import { HierarchyLevel } from "@/types/database";
import { getFacultyName } from "@/lib/recordFields";

/**
 * 学部の単位の分析から除く科目群（大学名 → 学部名）。
 * 抽出が一部だけなので学部として比べない。分析用リポジトリ config.EXCLUDED_FACULTIES と同じ。
 */
export const EXCLUDED_FACULTIES: Readonly<Record<string, readonly string[]>> = {
  "青山学院大学": ["青山スタンダード科目"],
};

/** 学部の単位のときだけ、EXCLUDED_FACULTIES の行を除く（学科・大学の単位はそのまま返す） */
export function dropExcludedFaculties<T extends { university_name: string }>(
  records: T[],
  level: HierarchyLevel
): T[] {
  if (level !== "faculty") return records;
  return records.filter((rec) => {
    const faculty = getFacultyName(rec);
    return !(faculty && EXCLUDED_FACULTIES[rec.university_name]?.includes(faculty));
  });
}
