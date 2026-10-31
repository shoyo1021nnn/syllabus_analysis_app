export type ActionIconType = 
  | 'radar' 
  | 'similarity' 
  | 'clustering' 
  | 'compass' 
  | 'sparkles' 
  | 'users';

export interface AnalysisAction {
  id: string;
  type: 'navigate' | 'compare' | 'filter';
  title: string;          // 例: "中部大学 情報工学科とレーダー比較"
  /** 旧形式・LLM の揺れで title の代わりに返ることがある表示名（title がないときの代替） */
  label?: string;
  description?: string;    // 例: "両学科の24スキル構成比を重ね合わせて差異を可視化"
  targetPage: string;     // 例: "/analytics/radar_chart"
  params: {
    primaryId?: string;
    compareId?: string;
    univ?: string;
    dept?: string;
    primaryUniv?: string;
    primaryDept?: string;
    compareUniv?: string;
    compareDept?: string;
    metric?: string;
    combineMethod?: 'max' | 'mean';
    [key: string]: string | number | boolean | null | undefined;
  };
  icon?: ActionIconType;
  badge?: string;         // 例: "類似度 #1", "おすすめ"
}
