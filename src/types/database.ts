/**
 * Supabase データベース型定義
 * ER図（skill_vector_*, clustering_*）に準拠
 */

// ==========================================
// 1. スキルベクトルテーブル
// ==========================================

export interface SkillVectorDepartment {
  id: string; // uuid
  university_name: string;
  faculty_name: string;
  department_name: string;
  subject_count: number;
  knowledge_vector: number[]; // 12次元 (double precision[])
  general_vector: number[];   // 12次元 (double precision[])
}

export interface SkillVectorFaculty {
  id: string; // uuid
  university_name: string;
  faculty_name: string;
  subject_count: number;
  knowledge_vector: number[]; // 12次元
  general_vector: number[];   // 12次元
}

export interface SkillVectorUniversity {
  id: string; // uuid
  university_name: string;
  subject_count: number;
  knowledge_vector: number[]; // 12次元
  general_vector: number[];   // 12次元
}

// 共通扱い用ユニオン / 階層種別
export type HierarchyLevel = 'department' | 'faculty' | 'university';

export type SkillVectorRecord = SkillVectorDepartment | SkillVectorFaculty | SkillVectorUniversity;

// ==========================================
// 2. クラスタリングテーブル
// ==========================================

export interface ClusteringRun {
  id: string; // uuid
  level: string; // 'department' | 'faculty' | 'university'
  rank: number;  // 1〜5 (シルエットスコア順位)
  k: number;     // クラスタ数
  silhouette_score: number;
  pc1_ratio: number;
  pc2_ratio: number;
  created_at?: string;
}

export interface ClusteringPoint {
  id: string; // uuid
  run_id: string; // clustering_runs.id 参照
  department_id: string; // skill_vector_department.id 参照
  pca_x: number;
  pca_y: number;
  cluster_id: number;
  university_name: string;
  department_name: string;
}

// ==========================================
// 3. アプリケーション計算・UI用型定義
// ==========================================

export type VectorTarget = 'knowledge' | 'general' | 'all';
export type MetricType = 'cosine' | 'dot' | 'euclidean' | 'tanimoto';
export type NormalizationType = 'none' | 'l1' | 'l2';

export interface SimilarityCandidate {
  id: string;
  label: string;
  university_name: string;
  faculty_name?: string;
  department_name?: string;
  vector: number[];
}

export interface SimilarityScoreItem {
  id: string;
  label: string;
  university_name: string;
  faculty_name?: string;
  department_name?: string;
  score: number; // 類似度スコア（指標により意味が異なる）
  rank: number;  // 順位 (1, 2, 3...)
}

export interface SkillDefinition {
  code: string;
  category: 'knowledge' | 'general';
  nameJa: string;
  nameEn: string;
  description?: string;
}

// ==========================================
// 4. 科目スキルベクトルテーブル (course_skill_vectors)
// ==========================================

export interface CourseSkillVector {
  id: string; // uuid
  university_name: string;
  faculty_name: string;
  course_code: string;
  course_numbering?: string | null;
  course_name: string;
  instructor?: string | null;
  term_time?: string | null;
  credits: number | null;
  requirement_type?: string | null;
  target_grade?: string | null;
  target_faculty?: string | null;
  academic_year: number;
  semester?: string | null;
  campus?: string | null;

  // 24次元スキル合計値（各 0〜9 の整数）
  a_1_education: number;
  a_2_humanities: number;
  a_3_arts: number;
  a_4_social_sciences: number;
  a_5_business: number;
  a_6_natural_sciences: number;
  a_7_ict: number;
  a_8_engineering: number;
  a_9_hardware_operation: number;
  a_10_agriculture_forestry: number;
  a_11_health_welfare: number;
  a_12_services: number;

  b_1_teamwork: number;
  b_2_critical: number;
  b_3_language: number;
  b_4_ethics: number;
  b_5_self_management: number;
  b_6_problem_solving: number;
  b_7_adaptability: number;
  b_8_creativity: number;
  b_9_expressiveness: number;
  b_10_info_processing: number;
  b_11_computer_skills: number;
  b_12_leadership: number;

  knowledge_vector: number[]; // 12次元 (INT2[])
  general_vector: number[];   // 12次元 (INT2[])
  extraction_count: number;   // 3 (SMALLINT)
  is_zero_vector: boolean;
}

// ==========================================
// 5. ミクロな学習支援（個人向け）用型定義
// ==========================================

export interface EnrolledCourse {
  course: CourseSkillVector;
  enrolledAt: string; // ISO string
  grade?: string;     // 任意（優, 良, 可 など）
}

export interface SkillItemScore {
  code: string;
  category: 'knowledge' | 'general';
  nameJa: string;
  nameEn: string;
  score: number;
}

export interface PersonalSkillProfile {
  cumulativeKnowledgeVector: number[]; // 12次元合計値
  cumulativeGeneralVector: number[];   // 12次元合計値
  totalCredits: number;
  courseCount: number;
  strengths: SkillItemScore[]; // 上位スキル
  weaknesses: SkillItemScore[]; // 不足スキル
}

export interface CourseRecommendationItem {
  course: CourseSkillVector;
  matchScore: number;       // 総合適合度 (0〜100)
  gapCoverageScore: number; // 弱点スキルの補填度
  targetedSkills: Array<{
    code: string;
    nameJa: string;
    gain: number;          // 獲得見込みスコア
  }>;
}
