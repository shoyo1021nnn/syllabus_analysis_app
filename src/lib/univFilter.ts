/**
 * 大学フィルター（学部・学科レベルで「どの大学の組織から選ぶか」）の共通処理。
 *
 * state には表示用のラベル（'全ての大学' / 'All Universities'）ではなく、
 * 言語に依存しない値を持つ：
 *   - ALL_UNIVERSITIES（空文字）… 全大学
 *   - それ以外 … 大学名（university_name。DB の値なので言語に依存しない）
 * ラベルは表示時にだけ t('common.allUniversities') で作る。これにより、言語切替時に
 * state を書き換える effect や、日英両方のラベルとの比較が不要になる。
 */

export const ALL_UNIVERSITIES = "";

export type UnivFilterValue = string;

interface HasUniversity {
  id: string;
  university_name: string;
}

/** フィルターを適用した一覧（大学レベル、または全大学のときは元の一覧をそのまま返す） */
export function filterByUniversity<T extends HasUniversity>(
  list: T[],
  filter: UnivFilterValue,
  level: string
): T[] {
  if (level === "university" || filter === ALL_UNIVERSITIES) return list;
  return list.filter((d) => d.university_name === filter);
}

/** フィルター変更後も選択中の ID を保てるか。保てなければ先頭の ID を返す（一覧が空なら現状維持） */
export function keepOrFirstId<T extends HasUniversity>(list: T[], currentId: string): string {
  if (list.length === 0 || list.some((d) => d.id === currentId)) return currentId;
  return list[0].id;
}

/**
 * 選択された対象がフィルター外の大学なら、フィルターを全大学に戻す
 * （URL クエリなどで対象を直接指定したときに、選択肢から外れないようにする）
 */
export function filterForTarget(
  filter: UnivFilterValue,
  target: HasUniversity | undefined
): UnivFilterValue {
  if (!target || filter === ALL_UNIVERSITIES || filter === target.university_name) return filter;
  return ALL_UNIVERSITIES;
}

/**
 * SearchableSelect に渡す props を作る。
 * options の先頭は表示言語の「全ての大学」ラベルで、選ばれたら ALL_UNIVERSITIES に戻す。
 */
export function univSelectProps(
  universityNames: string[],
  filter: UnivFilterValue,
  allLabel: string,
  onChange: (value: UnivFilterValue) => void
) {
  return {
    options: [allLabel, ...universityNames],
    value: filter === ALL_UNIVERSITIES ? allLabel : filter,
    onChange: (selected: string) => onChange(selected === allLabel ? ALL_UNIVERSITIES : selected),
  };
}
