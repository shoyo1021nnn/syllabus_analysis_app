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
