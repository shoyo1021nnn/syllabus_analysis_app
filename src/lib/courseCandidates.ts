import { supabase } from "@/lib/supabase";
import { CourseSkillVector } from "@/types/database";

/** Supabase (PostgREST) の既定の最大返却行数に合わせた 1 ページの件数 */
const PAGE_SIZE = 1000;

/**
 * フィルタ条件ごとの取得結果キャッシュ（モジュールスコープ＝ブラウザのタブが生きている間保持）。
 * Promise を保持するため、同じ条件の同時リクエストも 1 回の取得にまとめられる。
 */
const candidateCache = new Map<string, Promise<CourseSkillVector[]>>();

export interface CandidateFilter {
  /** "すべて" のときは undefined */
  faculty?: string;
  /** "すべて" のときは undefined */
  semester?: string;
}

async function fetchAllPages(filter: CandidateFilter): Promise<CourseSkillVector[]> {
  const all: CourseSkillVector[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase
      .from("course_skill_vectors")
      .select("*")
      .eq("is_zero_vector", false)
      // range() のページングで重複・欠落が起きないよう、一意キーで並び順を固定する
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (filter.faculty) {
      query = query.eq("faculty_name", filter.faculty);
    }
    if (filter.semester) {
      query = query.ilike("semester", `%${filter.semester}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    const rows = (data || []) as CourseSkillVector[];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

/**
 * フィルタ条件に合う推薦候補科目（is_zero_vector = false）を全件取得する。
 * 結果は条件ごとにキャッシュし、失敗した場合はキャッシュから外して再試行できるようにする。
 */
export function fetchCandidateCourses(filter: CandidateFilter): Promise<CourseSkillVector[]> {
  const key = JSON.stringify([filter.faculty ?? null, filter.semester ?? null]);
  const cached = candidateCache.get(key);
  if (cached) return cached;

  const promise = fetchAllPages(filter).catch((err) => {
    candidateCache.delete(key);
    throw err;
  });
  candidateCache.set(key, promise);
  return promise;
}
