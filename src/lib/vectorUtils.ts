import {
  MetricType,
  NormalizationType,
  SimilarityCandidate,
  SimilarityScoreItem,
  SkillDefinition,
  VectorTarget,
  CourseSkillVector,
  EnrolledCourse,
  PersonalSkillProfile,
  SkillItemScore,
  CourseRecommendationItem,
} from '@/types/database';

// ==========================================
// 1. スキル定義・ラベル定数
// ==========================================

export const KNOWLEDGE_SKILLS: SkillDefinition[] = [
  { code: 'A-1', category: 'knowledge', nameJa: '教育学', nameEn: 'Education' },
  { code: 'A-2', category: 'knowledge', nameJa: '人文学', nameEn: 'Humanities' },
  { code: 'A-3', category: 'knowledge', nameJa: '芸術', nameEn: 'Arts' },
  { code: 'A-4', category: 'knowledge', nameJa: '社会科学・ジャーナリズム・情報学', nameEn: 'Social Sciences, Journalism & Informatics' },
  { code: 'A-5', category: 'knowledge', nameJa: 'ビジネス・管理・法律', nameEn: 'Business, Administration & Law' },
  { code: 'A-6', category: 'knowledge', nameJa: '自然科学・数学・統計学', nameEn: 'Natural Sciences, Math & Statistics' },
  { code: 'A-7', category: 'knowledge', nameJa: '情報通信技術(ICT)', nameEn: 'ICT' },
  { code: 'A-8', category: 'knowledge', nameJa: '技術・製造・建築', nameEn: 'Engineering, Manufacturing & Construction' },
  { code: 'A-9', category: 'knowledge', nameJa: 'ハードウェア操作・マテリアルハンドリング', nameEn: 'Hardware Operation & Material Handling' },
  { code: 'A-10', category: 'knowledge', nameJa: '農業・林業・水産業・獣医学', nameEn: 'Agriculture, Forestry, Fisheries & Veterinary' },
  { code: 'A-11', category: 'knowledge', nameJa: '保健・福祉', nameEn: 'Health & Welfare' },
  { code: 'A-12', category: 'knowledge', nameJa: 'サービス', nameEn: 'Services' },
];

export const GENERAL_SKILLS: SkillDefinition[] = [
  { code: 'B-1', category: 'general', nameJa: '共同作業・コミュニケーション力', nameEn: 'Teamwork & Communication' },
  { code: 'B-2', category: 'general', nameJa: '批判的・論理的思考力', nameEn: 'Critical & Logical Thinking' },
  { code: 'B-3', category: 'general', nameJa: '言語運用・グローバル力', nameEn: 'Language & Global Competence' },
  { code: 'B-4', category: 'general', nameJa: '倫理観', nameEn: 'Ethics' },
  { code: 'B-5', category: 'general', nameJa: '自己管理能力・自律的成長', nameEn: 'Self-Management & Autonomous Growth' },
  { code: 'B-6', category: 'general', nameJa: '問題解決力', nameEn: 'Problem Solving' },
  { code: 'B-7', category: 'general', nameJa: '状況適応力', nameEn: 'Adaptability' },
  { code: 'B-8', category: 'general', nameJa: '創造性', nameEn: 'Creativity' },
  { code: 'B-9', category: 'general', nameJa: '表現力', nameEn: 'Expressiveness & Presentation' },
  { code: 'B-10', category: 'general', nameJa: '情報処理能力・デジタルリテラシー', nameEn: 'Info Processing & Digital Literacy' },
  { code: 'B-11', category: 'general', nameJa: 'コンピュータ活用能力', nameEn: 'Computer skills' },
  { code: 'B-12', category: 'general', nameJa: 'リーダーシップ・マネジメントスキル', nameEn: 'Leadership & Management' },
];

export const ALL_SKILLS: SkillDefinition[] = [...KNOWLEDGE_SKILLS, ...GENERAL_SKILLS];

// ==========================================
// 2. 基本ベクトル演算
// ==========================================

/** 内積 (Dot Product) */
export function dotProduct(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/** L2ノルム（ユークリッドノルム） */
export function vectorNorm(a: number[]): number {
  let sumSq = 0;
  for (let i = 0; i < a.length; i++) {
    sumSq += a[i] * a[i];
  }
  return Math.sqrt(sumSq);
}

/** L1ノルム（マンハッタンノルム） */
export function vectorL1Norm(a: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i]);
  }
  return sum;
}

/** コサイン類似度 (Cosine Similarity) */
export function cosineSimilarity(a: number[], b: number[]): number {
  const normA = vectorNorm(a);
  const normB = vectorNorm(b);
  if (normA === 0 || normB === 0) return 0;
  const dot = dotProduct(a, b);
  const sim = dot / (normA * normB);
  // 浮動小数点誤差による [-1, 1] 外れを防ぐ
  return Math.max(-1, Math.min(1, sim));
}

/** ユークリッド距離 (Euclidean Distance) */
export function euclideanDistance(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let sumSq = 0;
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sumSq += diff * diff;
  }
  return Math.sqrt(sumSq);
}

/** 谷本係数 (Tanimoto Coefficient) */
export function tanimotoCoefficient(a: number[], b: number[], eps: number = 1e-9): number {
  const dot = dotProduct(a, b);
  const normASq = a.reduce((sum, v) => sum + v * v, 0);
  const normBSq = b.reduce((sum, v) => sum + v * v, 0);
  const denom = normASq + normBSq - dot + eps;
  if (denom <= 0) return 0;
  return dot / denom;
}

/** L1正規化 (総和が1になるように変換) */
export function normalizeL1(v: number[]): number[] {
  const norm = vectorL1Norm(v);
  if (norm === 0) return [...v];
  return v.map((x) => x / norm);
}

/** L2正規化 (ベクトルの長さが1になるように変換) */
export function normalizeL2(v: number[]): number[] {
  const norm = vectorNorm(v);
  if (norm === 0) return [...v];
  return v.map((x) => x / norm);
}

/** ベクトル結合 (12D + 12D -> 24D) */
export function combineVectors(knowledge: number[], general: number[]): number[] {
  return [...knowledge, ...general];
}

/** 指定の正規化を適用 */
export function applyNormalization(v: number[], normType: NormalizationType): number[] {
  if (normType === 'l1') return normalizeL1(v);
  if (normType === 'l2') return normalizeL2(v);
  return [...v];
}

// ==========================================
// 3. 類似度ランキング算出
// ==========================================

export interface RankingOptions {
  excludeSelfId?: string;
  topN?: number;
  normalization?: NormalizationType;
}

/**
 * 基準ベクトルと候補群の類似度を計算し、ランキング順にソートして返す
 */
export function calculateSimilarityRanking(
  targetVector: number[],
  candidates: SimilarityCandidate[],
  metric: MetricType = 'cosine',
  options: RankingOptions = {}
): SimilarityScoreItem[] {
  const { excludeSelfId, topN, normalization = 'none' } = options;

  const normalizedTarget = applyNormalization(targetVector, normalization);

  const scored: Array<{
    id: string;
    label: string;
    university_name: string;
    faculty_name?: string;
    department_name?: string;
    subject_count?: number;
    website_url?: string | null;
    score: number;
  }> = [];

  for (const item of candidates) {
    if (excludeSelfId && item.id === excludeSelfId) {
      continue;
    }

    const normalizedCandidate = applyNormalization(item.vector, normalization);
    let score = 0;

    switch (metric) {
      case 'cosine':
        score = cosineSimilarity(normalizedTarget, normalizedCandidate);
        break;
      case 'dot':
        score = dotProduct(normalizedTarget, normalizedCandidate);
        break;
      case 'euclidean':
        score = euclideanDistance(normalizedTarget, normalizedCandidate);
        break;
      case 'tanimoto':
        score = tanimotoCoefficient(normalizedTarget, normalizedCandidate);
        break;
    }

    scored.push({
      id: item.id,
      label: item.label,
      university_name: item.university_name,
      faculty_name: item.faculty_name,
      department_name: item.department_name,
      subject_count: item.subject_count,
      website_url: item.website_url,
      score,
    });
  }

  // ソート: ユークリッド距離は小さいほど近い（昇順）、それ以外は大きいほど類似（降順）
  if (metric === 'euclidean') {
    scored.sort((a, b) => a.score - b.score);
  } else {
    scored.sort((a, b) => b.score - a.score);
  }

  // topN で絞り込み
  const limited = topN ? scored.slice(0, topN) : scored;

  return limited.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

// ==========================================
// 4. ECharts レーダーチャート用データ整形
// ==========================================

export interface RadarIndicator {
  name: string;
  max?: number;
}

/**
 * レーダーチャート用の軸（インジケーター）リストを生成
 */
export function getRadarIndicators(
  target: VectorTarget,
  options?: { max?: number; language?: 'ja' | 'en' | 'both' }
): RadarIndicator[] {
  const { max, language = 'both' } = options || {};

  let skills: SkillDefinition[] = [];
  if (target === 'knowledge') {
    skills = KNOWLEDGE_SKILLS;
  } else if (target === 'general') {
    skills = GENERAL_SKILLS;
  } else {
    skills = ALL_SKILLS;
  }

  return skills.map((skill) => {
    let name = '';
    if (language === 'en') {
      name = `${skill.code}\n${skill.nameEn}`;
    } else {
      name = `${skill.code}\n${skill.nameJa}`;
    }

    return {
      name,
      ...(max !== undefined ? { max } : {}),
    };
  });
}

// ==========================================
// 5. マクロな学習支援用 ベクトル演算・アルゴリズム
// ==========================================

/** 要素ごとの最大値結合 (Max Pooling) */
export function elementwiseMax(a: number[], b: number[]): number[] {
  const len = Math.max(a.length, b.length);
  const res = new Array(len);
  for (let i = 0; i < len; i++) {
    res[i] = Math.max(a[i] ?? 0, b[i] ?? 0);
  }
  return res;
}

/** 要素ごとの平均値結合 (Mean Pooling) */
export function elementwiseMean(a: number[], b: number[]): number[] {
  const len = Math.max(a.length, b.length);
  const res = new Array(len);
  for (let i = 0; i < len; i++) {
    res[i] = ((a[i] ?? 0) + (b[i] ?? 0)) / 2;
  }
  return res;
}

/** 複数ベクトルの結合 (max または mean) */
export function combineMultipleVectors(vectors: number[][], method: 'max' | 'mean'): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const res = new Array(dim).fill(0);
  if (method === 'max') {
    for (let d = 0; d < dim; d++) {
      let maxVal = -Infinity;
      for (let i = 0; i < vectors.length; i++) {
        const val = vectors[i][d] ?? 0;
        if (val > maxVal) maxVal = val;
      }
      res[d] = maxVal === -Infinity ? 0 : maxVal;
    }
  } else {
    for (let d = 0; d < dim; d++) {
      let sum = 0;
      for (let i = 0; i < vectors.length; i++) {
        sum += vectors[i][d] ?? 0;
      }
      res[d] = sum / vectors.length;
    }
  }
  return res;
}

/** 理想ベクトルを生成 (指定次元すべてを指定値または均等値) */
export function createIdealVector(dim: number, value: number = 3.0, normalization: NormalizationType = 'none'): number[] {
  const raw = new Array(dim).fill(value);
  return applyNormalization(raw, normalization);
}

/** 2ベクトル間の類似度/指標計算ヘルパー */
export function computeMetric(a: number[], b: number[], metric: MetricType = 'cosine'): number {
  switch (metric) {
    case 'cosine':
      return cosineSimilarity(a, b);
    case 'tanimoto':
      return tanimotoCoefficient(a, b);
    case 'dot':
      return dotProduct(a, b);
    case 'euclidean':
      return euclideanDistance(a, b);
    default:
      return cosineSimilarity(a, b);
  }
}

// ------------------------------------------
// 5-1. スキル補完検索 (Skill Complementation)
// ------------------------------------------

export interface SkillComplementationItem {
  id: string;
  label: string;
  university_name: string;
  faculty_name?: string;
  department_name?: string;
  sim_A: number;
  sim_B: number;
  sim_ALL: number;
  gap_score: number;
  ideal_attainment_max: number;
  ideal_attainment_mean: number;
  sort_score: number;
  rank: number;
  candidate_vector_A: number[];
  candidate_vector_B: number[];
}

export type ComplementationApproach =
  | 'synergy'       // 専門一致・汎用相補 (sim_A + gap_score または ideal_max)
  | 'gap'           // ギャップ補填特化
  | 'ideal_max'     // 最大値結合での理想達成度
  | 'ideal_mean'    // 平均値結合での理想達成度
  | 'dissimilar_b'; // 汎用スキル相補（汎用類似度が低く相補的）

export function calculateSkillComplementation(
  target: { id: string; vector_A: number[]; vector_B: number[] },
  candidates: Array<{
    id: string;
    label: string;
    university_name: string;
    faculty_name?: string;
    department_name?: string;
    vector_A: number[];
    vector_B: number[];
  }>,
  options: {
    metric?: MetricType;
    normalization?: NormalizationType;
    approach?: ComplementationApproach;
    idealValue?: number;
    topN?: number;
  } = {}
): SkillComplementationItem[] {
  const {
    metric = 'cosine',
    normalization = 'l1',
    approach = 'synergy',
    idealValue = 3.0,
    topN = 20,
  } = options;

  const tVecA = applyNormalization(target.vector_A, normalization);
  const tVecB = applyNormalization(target.vector_B, normalization);
  const tVecALL = applyNormalization(combineVectors(target.vector_A, target.vector_B), normalization);

  const idealB = createIdealVector(target.vector_B.length, idealValue, normalization);

  // ギャップベクトル: max(0, ideal - target)
  const gapVecB = idealB.map((val, idx) => Math.max(0, val - (tVecB[idx] ?? 0)));

  const scored: Array<Omit<SkillComplementationItem, 'rank' | 'sort_score'> & { sort_score: number }> = [];

  for (const cand of candidates) {
    if (cand.id === target.id) continue;

    const cVecA = applyNormalization(cand.vector_A, normalization);
    const cVecB = applyNormalization(cand.vector_B, normalization);
    const cVecALL = applyNormalization(combineVectors(cand.vector_A, cand.vector_B), normalization);

    const sim_A = computeMetric(tVecA, cVecA, metric);
    const sim_B = computeMetric(tVecB, cVecB, metric);
    const sim_ALL = computeMetric(tVecALL, cVecALL, metric);

    // ギャップスコア
    const gap_score = computeMetric(gapVecB, cVecB, metric);

    // 最大値結合 & 平均値結合ベクトルの理想達成度
    const maxCombinedB = applyNormalization(elementwiseMax(tVecB, cVecB), normalization);
    const meanCombinedB = applyNormalization(elementwiseMean(tVecB, cVecB), normalization);

    const ideal_attainment_max = computeMetric(maxCombinedB, idealB, metric);
    const ideal_attainment_mean = computeMetric(meanCombinedB, idealB, metric);

    let sort_score = 0;
    switch (approach) {
      case 'synergy':
        // 専門一致(sim_A)と汎用相補(ideal_attainment_max または gap_score)の総合調和
        sort_score = (sim_A + ideal_attainment_max) / 2;
        break;
      case 'gap':
        sort_score = gap_score;
        break;
      case 'ideal_max':
        sort_score = ideal_attainment_max;
        break;
      case 'ideal_mean':
        sort_score = ideal_attainment_mean;
        break;
      case 'dissimilar_b':
        // 汎用スキル類似度が低い（非類似）ほど相補的
        sort_score = 1 - sim_B;
        break;
    }

    scored.push({
      id: cand.id,
      label: cand.label,
      university_name: cand.university_name,
      faculty_name: cand.faculty_name,
      department_name: cand.department_name,
      sim_A,
      sim_B,
      sim_ALL,
      gap_score,
      ideal_attainment_max,
      ideal_attainment_mean,
      sort_score,
      candidate_vector_A: cVecA,
      candidate_vector_B: cVecB,
    });
  }

  scored.sort((a, b) => b.sort_score - a.sort_score);

  const limited = topN ? scored.slice(0, topN) : scored;
  return limited.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

// ------------------------------------------
// 5-2. ベスト・ペア検索 (Best Pair Search)
// ------------------------------------------

export interface BestPairItem {
  id: string;
  label: string;
  university_name: string;
  faculty_name?: string;
  department_name?: string;
  pair_score: number;
  baseline_score: number;
  improvement: number; // 向上度 (pair_score - baseline_score)
  combined_vector: number[];
  candidate_vector: number[];
  rank: number;
}

export function calculateBestPairs(
  target: { id: string; vector: number[] },
  candidates: Array<{
    id: string;
    label: string;
    university_name: string;
    faculty_name?: string;
    department_name?: string;
    vector: number[];
  }>,
  options: {
    combineMethod?: 'max' | 'mean';
    metric?: MetricType;
    normalization?: NormalizationType;
    idealValue?: number;
    topN?: number;
  } = {}
): BestPairItem[] {
  const {
    combineMethod = 'max',
    metric = 'cosine',
    normalization = 'l1',
    idealValue = 3.0,
    topN = 20,
  } = options;

  const tVec = applyNormalization(target.vector, normalization);
  const idealVec = createIdealVector(target.vector.length, idealValue, normalization);
  const baseline_score = computeMetric(tVec, idealVec, metric);

  const scored: Array<Omit<BestPairItem, 'rank'>> = [];

  for (const cand of candidates) {
    if (cand.id === target.id) continue;

    const cVec = applyNormalization(cand.vector, normalization);
    const rawCombined =
      combineMethod === 'max'
        ? elementwiseMax(tVec, cVec)
        : elementwiseMean(tVec, cVec);

    const combined_vector = applyNormalization(rawCombined, normalization);
    const pair_score = computeMetric(combined_vector, idealVec, metric);
    const improvement = pair_score - baseline_score;

    scored.push({
      id: cand.id,
      label: cand.label,
      university_name: cand.university_name,
      faculty_name: cand.faculty_name,
      department_name: cand.department_name,
      pair_score,
      baseline_score,
      improvement,
      combined_vector,
      candidate_vector: cVec,
    });
  }

  scored.sort((a, b) => b.pair_score - a.pair_score);

  const limited = topN ? scored.slice(0, topN) : scored;
  return limited.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

// ------------------------------------------
// 5-3. チーム編成支援 (Greedy Team Build)
// ------------------------------------------

export interface GreedyTeamStep {
  step: number;
  addedMember: {
    id: string;
    label: string;
    university_name: string;
    faculty_name?: string;
    department_name?: string;
    vector: number[];
  };
  teamScore: number;
  improvement: number;
  teamVector: number[];
  topReinforcedSkills: Array<{ name: string; delta: number }>;
}

export interface GreedyTeamResult {
  initialMember: { id: string; label: string; vector: number[] };
  teamMembers: Array<{ id: string; label: string; university_name: string; vector: number[] }>;
  finalTeamVector: number[];
  steps: GreedyTeamStep[];
  reachedThreshold: boolean;
  baselineScore: number;
  finalScore: number;
}

export function runGreedyTeamBuild(
  initialTarget: {
    id: string;
    label: string;
    university_name: string;
    vector: number[];
  },
  candidates: Array<{
    id: string;
    label: string;
    university_name: string;
    faculty_name?: string;
    department_name?: string;
    vector: number[];
  }>,
  options: {
    searchMode?: 'team_size' | 'threshold';
    targetTeamSize?: number; // 例: 4人
    targetThreshold?: number; // 例: 0.9 (スコア基準)
    combineMethod?: 'max' | 'mean';
    metric?: MetricType;
    normalization?: NormalizationType;
    idealValue?: number;
    skillDefinitions?: SkillDefinition[];
  } = {}
): GreedyTeamResult {
  const {
    searchMode = 'team_size',
    targetTeamSize = 4,
    // 既定値 0.95 は options.targetThreshold が省略されたときのみ使うフォールバック。
    // /macro/greedy_team は常に値を渡す（画面の初期値は 0.90、選択肢は 0.85 / 0.90 / 0.93 / 0.95）。
    // 卒業論文の分析条件に関わるため、この既定値は変更しない。
    targetThreshold = 0.95,
    combineMethod = 'max',
    metric = 'cosine',
    normalization = 'l1',
    idealValue = 3.0,
    skillDefinitions = ALL_SKILLS,
  } = options;

  const initVec = applyNormalization(initialTarget.vector, normalization);
  const idealVec = createIdealVector(initialTarget.vector.length, idealValue, normalization);
  const baselineScore = computeMetric(initVec, idealVec, metric);

  const team = [initialTarget];
  let currentTeamVectors = [initVec];
  let currentCombinedVector = [...initVec];
  let currentScore = baselineScore;

  const remaining = candidates.filter((c) => c.id !== initialTarget.id);
  const steps: GreedyTeamStep[] = [];
  let reachedThreshold = currentScore >= targetThreshold;

  const maxSteps = searchMode === 'team_size' ? targetTeamSize - 1 : 8;

  for (let s = 1; s <= maxSteps; s++) {
    if (searchMode === 'threshold' && reachedThreshold) break;
    if (remaining.length === 0) break;

    let bestCandIndex = -1;
    let bestScore = -Infinity;
    let bestCombinedVec: number[] = [];

    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      const candVec = applyNormalization(cand.vector, normalization);
      const testVectors = [...currentTeamVectors, candVec];
      const testCombined = applyNormalization(combineMultipleVectors(testVectors, combineMethod), normalization);
      const score = computeMetric(testCombined, idealVec, metric);

      if (score > bestScore) {
        bestScore = score;
        bestCandIndex = i;
        bestCombinedVec = testCombined;
      }
    }

    if (bestCandIndex === -1 || bestScore <= currentScore) {
      // これ以上向上しない場合
      break;
    }

    const selected = remaining.splice(bestCandIndex, 1)[0];
    const prevVector = [...currentCombinedVector];
    const prevScore = currentScore;

    team.push(selected);
    currentTeamVectors.push(applyNormalization(selected.vector, normalization));
    currentCombinedVector = bestCombinedVec;
    currentScore = bestScore;

    // スキルの伸び代が大きい上位3項目を計算
    const deltas = currentCombinedVector.map((v, idx) => ({
      name: skillDefinitions[idx]?.nameJa || `Skill ${idx + 1}`,
      delta: v - (prevVector[idx] ?? 0),
    }));
    deltas.sort((a, b) => b.delta - a.delta);

    steps.push({
      step: s,
      addedMember: {
        id: selected.id,
        label: selected.label,
        university_name: selected.university_name,
        faculty_name: selected.faculty_name,
        department_name: selected.department_name,
        vector: applyNormalization(selected.vector, normalization),
      },
      teamScore: currentScore,
      improvement: currentScore - prevScore,
      teamVector: currentCombinedVector,
      topReinforcedSkills: deltas.slice(0, 3),
    });

    if (currentScore >= targetThreshold) {
      reachedThreshold = true;
      if (searchMode === 'threshold') break;
    }
  }

  return {
    initialMember: {
      id: initialTarget.id,
      label: initialTarget.label,
      vector: initVec,
    },
    teamMembers: team.map((t) => ({
      id: t.id,
      label: t.label,
      university_name: t.university_name,
      vector: applyNormalization(t.vector, normalization),
    })),
    finalTeamVector: currentCombinedVector,
    steps,
    reachedThreshold,
    baselineScore,
    finalScore: currentScore,
  };
}

// ==========================================
// 8. ミクロな学習支援（個人向け）計算ロジック（案B: 累積加算方式）
// ==========================================

/**
 * 履修科目のリストから、学生個人の24次元累積スキルプロファイルを算出する（案B）
 */
export function calculatePersonalSkillProfile(enrolledCourses: EnrolledCourse[]): PersonalSkillProfile {
  const cumulativeKnowledge = new Array(12).fill(0);
  const cumulativeGeneral = new Array(12).fill(0);
  let totalCredits = 0;

  for (const item of enrolledCourses) {
    const course = item.course;
    const cred = typeof course.credits === 'number' && !isNaN(course.credits) ? course.credits : (course.credits ? Number(course.credits) : 2.0);
    totalCredits += cred;

    const kVec = Array.isArray(course.knowledge_vector) && course.knowledge_vector.length === 12
      ? course.knowledge_vector
      : [
          course.a_1_education || 0, course.a_2_humanities || 0, course.a_3_arts || 0,
          course.a_4_social_sciences || 0, course.a_5_business || 0, course.a_6_natural_sciences || 0,
          course.a_7_ict || 0, course.a_8_engineering || 0, course.a_9_hardware_operation || 0,
          course.a_10_agriculture_forestry || 0, course.a_11_health_welfare || 0, course.a_12_services || 0
        ];

    const gVec = Array.isArray(course.general_vector) && course.general_vector.length === 12
      ? course.general_vector
      : [
          course.b_1_teamwork || 0, course.b_2_critical || 0, course.b_3_language || 0,
          course.b_4_ethics || 0, course.b_5_self_management || 0, course.b_6_problem_solving || 0,
          course.b_7_adaptability || 0, course.b_8_creativity || 0, course.b_9_expressiveness || 0,
          course.b_10_info_processing || 0, course.b_11_computer_skills || 0, course.b_12_leadership || 0
        ];

    for (let i = 0; i < 12; i++) {
      cumulativeKnowledge[i] += Number(kVec[i]) || 0;
      cumulativeGeneral[i] += Number(gVec[i]) || 0;
    }
  }

  // 24スキルすべてのスコアリストを作成
  const allSkillScores: SkillItemScore[] = [
    ...KNOWLEDGE_SKILLS.map((s, idx) => ({
      code: s.code,
      category: 'knowledge' as const,
      nameJa: s.nameJa,
      nameEn: s.nameEn,
      score: cumulativeKnowledge[idx],
    })),
    ...GENERAL_SKILLS.map((s, idx) => ({
      code: s.code,
      category: 'general' as const,
      nameJa: s.nameJa,
      nameEn: s.nameEn,
      score: cumulativeGeneral[idx],
    })),
  ];

  // スコア順にソート
  const sortedDesc = [...allSkillScores].sort((a, b) => b.score - a.score);
  const sortedAsc = [...allSkillScores].sort((a, b) => a.score - b.score);

  // 強み: スコアが0より大きい上位3項目（なければ空）
  const strengths = sortedDesc.filter((s) => s.score > 0).slice(0, 4);

  // 弱点: スコアが低い下位項目（0または相対的に低い上位3〜4項目）
  const weaknesses = sortedAsc.slice(0, 4);

  return {
    cumulativeKnowledgeVector: cumulativeKnowledge,
    cumulativeGeneralVector: cumulativeGeneral,
    totalCredits: Math.round(totalCredits * 10) / 10,
    courseCount: enrolledCourses.length,
    strengths,
    weaknesses,
  };
}

/**
 * 不足スキルを補完する科目を推薦・ランキングする
 */
export function recommendCoursesForPersonalGaps(
  profile: PersonalSkillProfile,
  candidateCourses: CourseSkillVector[],
  enrolledCourseIds: Set<string>,
  options: {
    facultyFilter?: string;
    semesterFilter?: string;
    targetCategory?: 'all' | 'knowledge' | 'general';
    topN?: number;
  } = {}
): CourseRecommendationItem[] {
  const { facultyFilter, semesterFilter, targetCategory = 'all', topN = 10 } = options;

  // 候補科目から履修済みを除外・異常フラグ（is_zero_vector）を除外
  let filtered = candidateCourses.filter(
    (c) => !enrolledCourseIds.has(c.id) && !c.is_zero_vector
  );

  if (facultyFilter && facultyFilter !== 'all') {
    filtered = filtered.filter((c) => c.faculty_name === facultyFilter);
  }
  if (semesterFilter && semesterFilter !== 'all') {
    filtered = filtered.filter((c) => c.semester && c.semester.includes(semesterFilter));
  }

  // 不足スキルのコード一覧
  const weakCodes = new Set(
    profile.weaknesses
      .filter((w) => {
        if (targetCategory === 'knowledge') return w.category === 'knowledge';
        if (targetCategory === 'general') return w.category === 'general';
        return true;
      })
      .map((w) => w.code)
  );

  const recommendations: CourseRecommendationItem[] = [];

  for (const course of filtered) {
    const kVec = Array.isArray(course.knowledge_vector) && course.knowledge_vector.length === 12
      ? course.knowledge_vector
      : [
          course.a_1_education || 0, course.a_2_humanities || 0, course.a_3_arts || 0,
          course.a_4_social_sciences || 0, course.a_5_business || 0, course.a_6_natural_sciences || 0,
          course.a_7_ict || 0, course.a_8_engineering || 0, course.a_9_hardware_operation || 0,
          course.a_10_agriculture_forestry || 0, course.a_11_health_welfare || 0, course.a_12_services || 0
        ];

    const gVec = Array.isArray(course.general_vector) && course.general_vector.length === 12
      ? course.general_vector
      : [
          course.b_1_teamwork || 0, course.b_2_critical || 0, course.b_3_language || 0,
          course.b_4_ethics || 0, course.b_5_self_management || 0, course.b_6_problem_solving || 0,
          course.b_7_adaptability || 0, course.b_8_creativity || 0, course.b_9_expressiveness || 0,
          course.b_10_info_processing || 0, course.b_11_computer_skills || 0, course.b_12_leadership || 0
        ];

    // この科目が持つ24スキル一覧
    const courseSkills: Array<{ code: string; nameJa: string; nameEn?: string; value: number }> = [
      ...KNOWLEDGE_SKILLS.map((s, idx) => ({ code: s.code, nameJa: s.nameJa, nameEn: s.nameEn, value: Number(kVec[idx]) || 0 })),
      ...GENERAL_SKILLS.map((s, idx) => ({ code: s.code, nameJa: s.nameJa, nameEn: s.nameEn, value: Number(gVec[idx]) || 0 })),
    ];

    // 不足スキルに対する補填スコア合計
    let gapGainSum = 0;
    const targetedSkills: Array<{ code: string; nameJa: string; nameEn?: string; gain: number }> = [];

    for (const cs of courseSkills) {
      if (weakCodes.has(cs.code) && cs.value > 0) {
        gapGainSum += cs.value;
        targetedSkills.push({
          code: cs.code,
          nameJa: cs.nameJa,
          nameEn: cs.nameEn,
          gain: cs.value,
        });
      }
    }

    // 科目全体の強みスキル（スコア6以上、またはトップスキル）も合わせて記録
    const strongSkillsInCourse = courseSkills
      .filter((cs) => cs.value >= 5 && !targetedSkills.some((ts) => ts.code === cs.code))
      .sort((a, b) => b.value - a.value)
      .slice(0, 2);

    for (const sc of strongSkillsInCourse) {
      targetedSkills.push({
        code: sc.code,
        nameJa: sc.nameJa,
        nameEn: sc.nameEn,
        gain: sc.value,
      });
    }

    // 適合スコアの算出: 弱点スキルの補填度を重視しつつ、科目全体のスキル合計値も加味
    // 弱点スキル獲得量(最大4項目 * 9 = 36点満点)を80%重み、全体スキル強度(216点満点)を20%重み
    const totalCourseSkillSum = courseSkills.reduce((acc, curr) => acc + curr.value, 0);
    const gapScoreNormalized = Math.min(100, Math.round((gapGainSum / 18) * 100)); // 18点以上で100点
    const totalScoreNormalized = Math.min(100, Math.round((totalCourseSkillSum / 36) * 100));

    // 弱点補填が1つでもある場合を大幅優遇
    const matchScore = gapGainSum > 0
      ? Math.round(gapScoreNormalized * 0.75 + totalScoreNormalized * 0.25)
      : Math.round(totalScoreNormalized * 0.3);

    if (matchScore > 10) {
      recommendations.push({
        course,
        matchScore,
        gapCoverageScore: gapScoreNormalized,
        targetedSkills: targetedSkills.sort((a, b) => b.gain - a.gain).slice(0, 4),
      });
    }
  }

  // 適合スコア降順でソート
  recommendations.sort((a, b) => b.matchScore - a.matchScore);
  return recommendations.slice(0, topN);
}

/**
 * 特定の科目を仮追加した場合のスキル増加シミュレーション
 */
export function simulateCourseAddition(
  currentProfile: PersonalSkillProfile,
  candidateCourse: CourseSkillVector
): {
  simulatedKnowledge: number[];
  simulatedGeneral: number[];
  gains: Array<{ code: string; nameJa: string; nameEn?: string; before: number; after: number; diff: number }>;
} {
  const kVec = Array.isArray(candidateCourse.knowledge_vector) && candidateCourse.knowledge_vector.length === 12
    ? candidateCourse.knowledge_vector
    : [
        candidateCourse.a_1_education || 0, candidateCourse.a_2_humanities || 0, candidateCourse.a_3_arts || 0,
        candidateCourse.a_4_social_sciences || 0, candidateCourse.a_5_business || 0, candidateCourse.a_6_natural_sciences || 0,
        candidateCourse.a_7_ict || 0, candidateCourse.a_8_engineering || 0, candidateCourse.a_9_hardware_operation || 0,
        candidateCourse.a_10_agriculture_forestry || 0, candidateCourse.a_11_health_welfare || 0, candidateCourse.a_12_services || 0
      ];

  const gVec = Array.isArray(candidateCourse.general_vector) && candidateCourse.general_vector.length === 12
    ? candidateCourse.general_vector
    : [
        candidateCourse.b_1_teamwork || 0, candidateCourse.b_2_critical || 0, candidateCourse.b_3_language || 0,
        candidateCourse.b_4_ethics || 0, candidateCourse.b_5_self_management || 0, candidateCourse.b_6_problem_solving || 0,
        candidateCourse.b_7_adaptability || 0, candidateCourse.b_8_creativity || 0, candidateCourse.b_9_expressiveness || 0,
        candidateCourse.b_10_info_processing || 0, candidateCourse.b_11_computer_skills || 0, candidateCourse.b_12_leadership || 0
      ];

  const simK = currentProfile.cumulativeKnowledgeVector.map((val, i) => val + (Number(kVec[i]) || 0));
  const simG = currentProfile.cumulativeGeneralVector.map((val, i) => val + (Number(gVec[i]) || 0));

  const gains: Array<{ code: string; nameJa: string; nameEn?: string; before: number; after: number; diff: number }> = [];

  KNOWLEDGE_SKILLS.forEach((s, i) => {
    const diff = Number(kVec[i]) || 0;
    if (diff > 0) {
      gains.push({
        code: s.code,
        nameJa: s.nameJa,
        nameEn: s.nameEn,
        before: currentProfile.cumulativeKnowledgeVector[i] || 0,
        after: simK[i],
        diff,
      });
    }
  });

  GENERAL_SKILLS.forEach((s, i) => {
    const diff = Number(gVec[i]) || 0;
    if (diff > 0) {
      gains.push({
        code: s.code,
        nameJa: s.nameJa,
        nameEn: s.nameEn,
        before: currentProfile.cumulativeGeneralVector[i] || 0,
        after: simG[i],
        diff,
      });
    }
  });

  gains.sort((a, b) => b.diff - a.diff);

  return {
    simulatedKnowledge: simK,
    simulatedGeneral: simG,
    gains,
  };
}
