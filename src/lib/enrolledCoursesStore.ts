"use client";

import { useCallback, useSyncExternalStore } from "react";
import { EnrolledCourse } from "@/types/database";

/**
 * 履修科目リスト（localStorage）の共通ストア。
 * /micro・/micro/portfolio・/micro/recommendation が同じキーを読み書きする。
 *
 * - 以前は各ページがマウント後の useEffect で読み込み setState していた
 *   （react-hooks/set-state-in-effect）。useSyncExternalStore で外部ストアとして読む形に変更。
 * - サーバーレンダー・ハイドレーション中は null（＝未読み込み）を返すため、
 *   各ページの isLoaded（読み込み前は AI 文脈の更新などを止める）の意味は従来どおり。
 * - 別タブでの変更をリアルタイムには反映しない（従来どおり）。ページを開いたとき・再レンダー時に
 *   localStorage の文字列が変わっていれば読み直す。
 */

export const ENROLLED_COURSES_STORAGE_KEY = "syllabus_enrolled_courses";

const EMPTY: EnrolledCourse[] = [];
const listeners = new Set<() => void>();

/** 最後に読み込んだ（または書き込んだ）localStorage の文字列と、そのパース結果 */
let lastRaw: string | null | undefined; // undefined = まだ一度も読んでいない
let cache: EnrolledCourse[] = EMPTY;

function readRaw(): string | null {
  try {
    return localStorage.getItem(ENROLLED_COURSES_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to load enrolled courses from localStorage", e);
    return null;
  }
}

/** パースし、同じ科目 ID の重複を取り除く（以前はポートフォリオ画面だけが行っていた自己修復） */
function parse(raw: string | null): EnrolledCourse[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const seen = new Set<string>();
    const cleaned: EnrolledCourse[] = [];
    for (const item of parsed as EnrolledCourse[]) {
      const courseId = item?.course?.id;
      if (courseId && !seen.has(courseId)) {
        seen.add(courseId);
        cleaned.push(item);
      }
    }
    return cleaned;
  } catch (e) {
    console.error("Failed to parse enrolled courses", e);
    return EMPTY;
  }
}

function getSnapshot(): EnrolledCourse[] | null {
  const raw = readRaw();
  if (raw !== lastRaw) {
    lastRaw = raw;
    cache = parse(raw);
  }
  return cache;
}

function getServerSnapshot(): EnrolledCourse[] | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 保存して購読中のコンポーネントに通知する（保存に失敗してもこのタブのメモリ上では反映する：従来どおり） */
export function saveEnrolledCourses(courses: EnrolledCourse[]) {
  cache = courses;
  try {
    const raw = JSON.stringify(courses);
    localStorage.setItem(ENROLLED_COURSES_STORAGE_KEY, raw);
    lastRaw = raw;
  } catch (e) {
    console.error("Failed to save enrolled courses", e);
    // 保存できなかった場合は、現在の localStorage の内容を「読み込み済み」とみなしてメモリ上の値を返し続ける
    lastRaw = readRaw();
  }
  listeners.forEach((l) => l());
}

/** 履修科目リストを読む。isLoaded はハイドレーション後（localStorage を読んだ後）に true になる */
export function useEnrolledCourses() {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const saveCourses = useCallback((courses: EnrolledCourse[]) => saveEnrolledCourses(courses), []);
  return {
    enrolledCourses: stored ?? EMPTY,
    isLoaded: stored !== null,
    saveCourses,
  };
}
