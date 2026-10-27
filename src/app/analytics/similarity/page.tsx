"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  HierarchyLevel, 
  MetricType, 
  SimilarityCandidate, 
  SimilarityScoreItem, 
  SkillVectorDepartment, 
  SkillVectorRecord, 
  VectorTarget 
} from '@/types/database';
import { 
  calculateSimilarityRanking, 
  combineVectors,
  KNOWLEDGE_SKILLS,
  GENERAL_SKILLS,
  ALL_SKILLS
} from '@/lib/vectorUtils';
import SimilarityRanking from '@/components/charts/SimilarityRanking';
import BackButton from '@/components/BackButton';
import DatabaseErrorBanner from '@/components/DatabaseErrorBanner';
import { useAnalyticsContext } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Users, 
  CheckCircle2, 
  Database, 
  AlertCircle, 
  BarChart2, 
  Radar, 
  Filter, 
  Calculator, 
  Building2, 
  GraduationCap 
} from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';
import AcademicUnitInfoButton from '@/components/AcademicUnitInfoButton';

// Supabaseデータ未投入時のリアルなフォールバックサンプルデータ
const MOCK_DEPARTMENTS: SkillVectorDepartment[] = [
  {
    id: 'd1',
    university_name: '九州大学',
    faculty_name: '工学部',
    department_name: '電気情報工学科',
    subject_count: 199,
    knowledge_vector: [2.1, 0.8, 1.2, 3.4, 4.1, 15.2, 28.5, 24.3, 8.1, 1.0, 0.5, 0.8],
    general_vector:   [14.2, 22.5, 8.3, 4.1, 9.5, 18.2, 7.4, 11.3, 9.8, 19.1, 21.4, 8.2],
  },
  {
    id: 'd2',
    university_name: '九州大学',
    faculty_name: '工学部',
    department_name: '機械航空工学科',
    subject_count: 113,
    knowledge_vector: [1.8, 0.5, 0.8, 2.5, 3.8, 18.4, 15.2, 32.1, 12.4, 0.8, 0.2, 0.4],
    general_vector:   [15.1, 24.2, 7.1, 3.8, 8.4, 19.5, 8.1, 12.4, 8.2, 16.5, 18.2, 9.1],
  },
  {
    id: 'd3',
    university_name: '九州大学',
    faculty_name: '文学部',
    department_name: '人文学科',
    subject_count: 145,
    knowledge_vector: [8.5, 32.1, 14.2, 18.4, 5.2, 1.1, 3.2, 0.5, 0.2, 0.8, 4.2, 2.1],
    general_vector:   [11.2, 18.4, 24.2, 16.5, 12.1, 9.3, 8.4, 12.1, 21.5, 6.2, 5.1, 6.4],
  },
  {
    id: 'd4',
    university_name: '九州大学',
    faculty_name: '法学部',
    department_name: '法学科',
    subject_count: 138,
    knowledge_vector: [3.2, 6.1, 1.2, 28.4, 34.2, 1.8, 2.5, 0.4, 0.1, 0.5, 5.2, 4.1],
    general_vector:   [12.1, 26.4, 11.2, 22.1, 14.2, 15.4, 9.1, 5.2, 18.4, 7.1, 6.2, 11.5],
  },
  {
    id: 'd5',
    university_name: '中部大学',
    faculty_name: '工学部',
    department_name: '情報工学科',
    subject_count: 93,
    knowledge_vector: [1.5, 0.5, 1.1, 2.8, 3.2, 12.4, 31.2, 21.8, 9.2, 0.5, 0.2, 0.5],
    general_vector:   [12.8, 20.4, 6.5, 3.2, 8.4, 16.5, 6.8, 10.5, 8.4, 22.1, 24.2, 7.1],
  },
  {
    id: 'd6',
    university_name: '中部大学',
    faculty_name: '工学部',
    department_name: '機械工学科',
    subject_count: 93,
    knowledge_vector: [1.2, 0.4, 0.5, 2.1, 2.8, 16.8, 14.2, 34.5, 14.1, 0.4, 0.1, 0.2],
    general_vector:   [14.5, 21.8, 5.8, 3.5, 7.8, 18.1, 7.5, 11.2, 7.9, 15.2, 17.5, 8.4],
  },
  {
    id: 'd7',
    university_name: '中部大学',
    faculty_name: '人文学部',
    department_name: '日本語日本文化学科',
    subject_count: 102,
    knowledge_vector: [7.2, 35.4, 11.8, 15.2, 4.1, 0.8, 2.1, 0.2, 0.1, 0.4, 3.5, 1.8],
    general_vector:   [10.5, 16.2, 21.4, 14.8, 11.2, 8.1, 7.5, 11.8, 19.4, 5.8, 4.2, 5.5],
  },
  {
    id: 'd8',
    university_name: '中部大学',
    faculty_name: '経営情報学部',
    department_name: '経営総合学科',
    subject_count: 248,
    knowledge_vector: [2.5, 3.1, 1.8, 22.4, 38.5, 4.2, 14.5, 2.1, 0.8, 1.2, 3.8, 8.4],
    general_vector:   [16.2, 18.5, 9.4, 8.5, 12.4, 14.2, 11.8, 8.4, 15.2, 14.8, 12.1, 18.2],
  },
  {
    id: 'd9',
    university_name: '九州大学',
    faculty_name: '経済学部',
    department_name: '経済工学科',
    subject_count: 156,
    knowledge_vector: [1.8, 2.4, 1.1, 25.1, 32.4, 14.2, 18.5, 1.5, 0.4, 0.8, 2.1, 6.2],
    general_vector:   [15.1, 25.1, 10.2, 9.2, 11.8, 17.5, 10.2, 9.1, 14.1, 18.2, 15.4, 14.2],
  },
  {
    id: 'd10',
    university_name: '中部大学',
    faculty_name: '応用生物学部',
    department_name: '応用生物化学科',
    subject_count: 87,
    knowledge_vector: [1.1, 0.8, 0.5, 2.1, 1.8, 28.5, 4.5, 6.8, 5.2, 26.4, 8.5, 1.2],
    general_vector:   [13.8, 19.5, 7.4, 6.2, 9.1, 17.2, 8.4, 14.1, 9.2, 12.4, 11.5, 8.1],
  },
];

type TargetFilter = 'all' | 'same' | 'diff';

function SimilarityPageContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id') || searchParams.get('primaryId');
  const queryDept = searchParams.get('dept') || searchParams.get('primaryDept');
  const queryUniv = searchParams.get('univ') || searchParams.get('primaryUniv');
  const { setAnalyticsContext } = useAnalyticsContext();
  const { language, t } = useLanguage();

  const [level, setLevel] = useState<HierarchyLevel>('department');
  const [dataList, setDataList] = useState<SkillVectorRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUsingMock, setIsUsingMock] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // 選択中の基準対象
  const [targetId, setTargetId] = useState<string>('');

  // 大学フィルター (学部・学科レベル時)
  const [selectedUnivFilter, setSelectedUnivFilter] = useState<string>('全ての大学');

  // 計算設定 (※正規化はご要望に基づき L1正規化 に固定)
  const [metric, setMetric] = useState<MetricType>('cosine');
  const [vectorTarget, setVectorTarget] = useState<VectorTarget>('all');
  const [filterUniversity, setFilterUniversity] = useState<TargetFilter>('all');

  // 1. データ取得
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      if (!isSupabaseConfigured) {
        setDbError('Supabaseの接続設定（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）が未設定または無効です。');
        setDataList(MOCK_DEPARTMENTS);
        setIsUsingMock(true);
        setIsLoading(false);
        return;
      }

      try {
        const tableName = `skill_vector_${level}`;
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('university_name', { ascending: true });

        if (error) {
          console.error(`Failed to fetch from ${tableName}:`, error);
          setDbError(`データベースからのデータ取得に失敗しました: ${error.message}`);
          setDataList(MOCK_DEPARTMENTS);
          setIsUsingMock(true);
        } else if (!data || data.length === 0) {
          setDbError(`テーブル「${tableName}」にデータが存在しません。`);
          setDataList(MOCK_DEPARTMENTS);
          setIsUsingMock(true);
        } else {
          setDbError(null);
          // 実験用レコード（gpt-5.6-terra等）を除外
          const validData = (data as SkillVectorRecord[]).filter(
            (d) => !d.university_name.includes('gpt-')
          );
          setDataList(validData.length > 0 ? validData : data);
          setIsUsingMock(false);
        }
      } catch (err: any) {
        console.error('Error in fetching skill vectors:', err);
        setDbError(`データベース通信エラーが発生しました: ${err?.message || err}`);
        setDataList(MOCK_DEPARTMENTS);
        setIsUsingMock(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [level]);

  const allUnivLabel = t('common.allUniversities', '全ての大学');

  // レベル変更時に大学フィルターをリセット
  useEffect(() => {
    setSelectedUnivFilter(allUnivLabel);
  }, [level, allUnivLabel]);

  // 言語切替時に「全ての大学」ラベルを追従
  useEffect(() => {
    setSelectedUnivFilter((prev) => {
      if (prev === '全ての大学' || prev === 'All Universities') {
        return allUnivLabel;
      }
      return prev;
    });
  }, [allUnivLabel]);

  // 大学一覧リスト
  const universityList = useMemo(() => {
    const set = new Set<string>();
    dataList.forEach((d) => {
      if (d.university_name) set.add(d.university_name);
    });
    return [allUnivLabel, ...Array.from(set)];
  }, [dataList, allUnivLabel]);

  // 大学フィルター適用後の基準選択肢
  const filteredDataList = useMemo(() => {
    if (level === 'university' || selectedUnivFilter === allUnivLabel || selectedUnivFilter === '全ての大学' || selectedUnivFilter === 'All Universities') {
      return dataList;
    }
    return dataList.filter((d) => d.university_name === selectedUnivFilter);
  }, [dataList, level, selectedUnivFilter, allUnivLabel]);

  // 2. 初期基準IDの設定（URLクエリ優先、または先頭要素）
  useEffect(() => {
    if (dataList.length === 0) return;

    let matchedId = '';
    if (queryId && dataList.some((d) => d.id === queryId)) {
      matchedId = queryId;
    } else if (queryDept) {
      const found = dataList.find((item: any) => {
        const matchDept =
          item.department_name === queryDept ||
          item.faculty_name === queryDept ||
          item.university_name === queryDept;
        if (queryUniv) return matchDept && item.university_name === queryUniv;
        return matchDept;
      });
      if (found) matchedId = found.id;
    }

    const finalId = matchedId || dataList[0].id;
    setTargetId(finalId);

    // 選択された基準対象の大学に合わせて大学フィルターを同期
    const target = dataList.find((d) => d.id === finalId);
    if (target && selectedUnivFilter !== '全ての大学' && selectedUnivFilter !== target.university_name) {
      setSelectedUnivFilter('全ての大学');
    }
  }, [dataList, queryId, queryDept, queryUniv]);

  // 大学フィルター切替時に、選択中IDがリスト内にない場合は先頭を選択
  useEffect(() => {
    if (filteredDataList.length > 0 && !filteredDataList.some((d) => d.id === targetId)) {
      setTargetId(filteredDataList[0].id);
    }
  }, [filteredDataList, targetId]);

  // 現在選択されている基準レコード
  const targetRecord = useMemo(() => {
    return filteredDataList.find((d) => d.id === targetId) || dataList.find((d) => d.id === targetId) || dataList[0];
  }, [filteredDataList, dataList, targetId]);

  // 表示名フォーマッタ
  const formatLabel = (rec?: SkillVectorRecord) => {
    if (!rec) return '';
    const dept = (rec as any).department_name;
    const fac = (rec as any).faculty_name;
    if (dept) return `【${rec.university_name}】 ${dept}`;
    if (fac) return `【${rec.university_name}】 ${fac}`;
    return `【${rec.university_name}】`;
  };

  // ベクトル抽出ヘルパー (対象スキルに応じて 12D or 24D)
  const extractVector = (rec?: SkillVectorRecord): number[] => {
    if (!rec) return [];
    if (vectorTarget === 'knowledge') {
      return rec.knowledge_vector || [];
    }
    if (vectorTarget === 'general') {
      return rec.general_vector || [];
    }
    return combineVectors(rec.knowledge_vector || [], rec.general_vector || []);
  };

  // 候補リストの作成 & 大学フィルタリング
  const candidates: SimilarityCandidate[] = useMemo(() => {
    if (!targetRecord) return [];

    let filtered = dataList.filter((item) => item.id !== targetRecord.id);

    if (filterUniversity === 'same') {
      filtered = filtered.filter((item) => item.university_name === targetRecord.university_name);
    } else if (filterUniversity === 'diff') {
      filtered = filtered.filter((item) => item.university_name !== targetRecord.university_name);
    }

    return filtered.map((item) => ({
      id: item.id,
      label: formatLabel(item),
      university_name: item.university_name,
      faculty_name: (item as any).faculty_name,
      department_name: (item as any).department_name,
      vector: extractVector(item),
      subject_count: item.subject_count,
      website_url: item.website_url,
    }));
  }, [dataList, targetRecord, filterUniversity, vectorTarget]);

  // 3. 【重要】都度計算: 必ず L1正規化 を適用して類似度ランキングを算出
  const rankingResults: SimilarityScoreItem[] = useMemo(() => {
    if (!targetRecord || candidates.length === 0) return [];

    const targetVec = extractVector(targetRecord);

    // ★ 必ず normalization: 'l1' を適用
    return calculateSimilarityRanking(targetVec, candidates, metric, {
      excludeSelfId: targetRecord.id,
      normalization: 'l1',
      topN: 20, // 上位20件を計算・取得
    });
  }, [targetRecord, candidates, metric, vectorTarget]);

  // AIエージェントへの画面コンテキスト共有
  useEffect(() => {
    if (!targetRecord) return;

    const targetLabel = formatLabel(targetRecord);
    const top1 = rankingResults[0];
    const top2 = rankingResults[1];

    const metricNameMap: Record<string, string> = {
      cosine: 'コサイン類似度',
      dot: '内積',
      euclidean: 'ユークリッド距離',
      tanimoto: '谷本係数',
    };
    const currentMetricName = metricNameMap[metric] || metric;

    // スキル定義リスト
    const skillDefs = 
      vectorTarget === 'knowledge' ? KNOWLEDGE_SKILLS :
      vectorTarget === 'general' ? GENERAL_SKILLS : ALL_SKILLS;

    const extractTopSkills = (vec: number[], topN = 3) => {
      const sum = vec.reduce((acc, v) => acc + v, 0);
      return vec
        .map((val, idx) => {
          const def = skillDefs[idx];
          const ratio = sum > 0 ? (val / sum) * 100 : 0;
          return {
            code: def?.code || '',
            name: def?.nameJa || `スキル${idx + 1}`,
            ratio: Number(ratio.toFixed(1)),
          };
        })
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, topN);
    };

    // 基準組織の主要スキル
    const targetTopSkills = extractTopSkills(extractVector(targetRecord), 4);

    // 上位5学科の主要スキル
    const top5Rankings = rankingResults.slice(0, 5);
    const top5Detailed = top5Rankings.map((r) => {
      const orig = dataList.find((d) => d.id === r.id);
      const vec = orig ? extractVector(orig) : [];
      const topSkills = extractTopSkills(vec, 3);
      return {
        rank: r.rank,
        label: r.label,
        university: r.university_name,
        score: Number(r.score.toFixed(4)),
        topSkills,
      };
    });

    // 上位5学科における主力スキルの共通性（出現頻度）集計
    const skillOccurrence: Record<string, { count: number; name: string; ratios: number[] }> = {};
    top5Detailed.forEach((dept) => {
      dept.topSkills.forEach((s) => {
        if (!skillOccurrence[s.code]) {
          skillOccurrence[s.code] = { count: 0, name: s.name, ratios: [] };
        }
        skillOccurrence[s.code].count += 1;
        skillOccurrence[s.code].ratios.push(s.ratio);
      });
    });

    // 2学科以上で上位3位以内に登場するスキル（共通候補）
    const sharedSkills = Object.entries(skillOccurrence)
      .filter(([_, data]) => data.count >= 2)
      .map(([code, data]) => ({
        code,
        name: data.name,
        count: data.count,
        appearanceRate: `${data.count}/${top5Detailed.length}学科`,
        avgRatio: Number((data.ratios.reduce((a, b) => a + b, 0) / data.ratios.length).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);

    // 過半数（3学科以上）で共通するスキルがあれば「共通性あり」、なければ「バラバラ（注力分野が分散）」
    const hasClearCommonality = sharedSkills.some((s) => s.count >= 3);
    const commonalityVerdict = hasClearCommonality
      ? `上位5学科のうち過半数（${sharedSkills.filter((s) => s.count >= 3).map((s) => `「${s.name}」（${s.count}学科）`).join('・')}）が共通して主力カリキュラムとなっています。教育の骨格に強い共通基盤が見られます。`
      : sharedSkills.length > 0
      ? `上位5学科間で過半数が一致する決定的な主力スキルはなく、各学科の主力分野は部分的に重なる程度で比較的バラバラに分散しています（最も共通しているスキルでも最大${sharedSkills[0]?.count || 0}学科のみ）。`
      : `上位5学科の主力スキルは完全にバラバラに分散しており、学科ごとに全く異なる専門領域を強みとしています。`;

    const isEn = language === 'en';
    const presets: string[] = [];
    if (isEn) {
      presets.push(`Are there common skill trends among the top similar departments, or are curricula varied?`);
      if (top1) {
        presets.push(`What are the key curricular commonalities between "${targetLabel}" and #1 "${top1.label}" (Score: ${top1.score.toFixed(3)})?`);
        if (top2) {
          presets.push(`Compare the curriculum patterns of "${targetLabel}" against top 2 departments (${top1.label}, ${top2.label}).`);
        }
      }
      presets.push(`How should I interpret these ranking features based on metric "${currentMetricName}"?`);
      presets.push(`What are the distinct differentiation factors compared to departments with low similarity?`);
    } else {
      presets.push(`上位学科に共通するスキル傾向はある？それともカリキュラムはバラバラ？`);
      if (top1) {
        presets.push(`「${targetLabel}」と第1位の「${top1.label}」（スコア: ${top1.score.toFixed(3)}）の共通点は？`);
        if (top2) {
          presets.push(`上位2学科（${top1.label}、${top2.label}）と「${targetLabel}」のカリキュラム傾向を比較して`);
        }
      }
      presets.push(`計算指標（${currentMetricName}）から見たこのランキングの特徴と解釈のポイントは？`);
      presets.push(`「${targetLabel}」と類似度が低い学科との違いや差別化ポイントは？`);
    }

    setAnalyticsContext({
      pageTitle: t('analytics.similarity.pageTitle', '類似度計算ランキング'),
      pagePath: '/analytics/similarity',
      primaryTarget: targetLabel,
      summaryText: isEn
        ? `Base: ${targetLabel} (Metric: ${currentMetricName}, Target Skills: ${vectorTarget})`
        : `基準対象: ${targetLabel}（計算指標: ${currentMetricName}、対象スキル: ${vectorTarget}）`,
      details: {
        target: {
          label: targetLabel,
          university: targetRecord.university_name,
          subjectCount: targetRecord.subject_count,
          topSkills: targetTopSkills,
        },
        metric: currentMetricName,
        vectorTarget,
        topRankings: top5Detailed,
        commonalityAnalysis: {
          hasClearCommonality,
          verdict: commonalityVerdict,
          sharedSkills,
        },
      },
      presetQuestions: presets,
    });
  }, [targetRecord, rankingResults, metric, vectorTarget, dataList, setAnalyticsContext, language, t]);

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-5 overflow-y-auto bg-slate-50">
      {/* ナビゲーション戻るボタン */}
      <div className="flex items-center">
        <BackButton label={t('common.backToMenu', '分析メニューに戻る')} fallbackHref="/analytics" />
      </div>

      {/* ページタイトル & 概要 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {t('analytics.similarity.heading', '類似度計算ランキング分析')}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {t('analytics.similarity.subtitle', '基準学科のスキル構成比（L1正規化ベクトル）をもとに、全国の学科との類似度をリアルタイム算出します')}
            </p>
          </div>
        </div>
      </div>

      {/* データベース接続エラー時の警告バナー */}
      {dbError && (
        <DatabaseErrorBanner message={dbError} />
      )}

      {/* コントロールパネル */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* 基準対象の選択 */}
        <div className="p-4 rounded-lg bg-teal-50/50 border border-teal-200 space-y-3">
          {/* 大学フィルター (学部・学科レベル時) */}
          {level !== 'university' && universityList.length > 1 && (
            <div className="pb-2 border-b border-teal-200/60">
              <SearchableSelect
                label={t('common.filterUniv', '大学で絞り込み:')}
                options={universityList}
                value={selectedUnivFilter}
                onChange={setSelectedUnivFilter}
                placeholder={t('analytics.radar.searchUniv', '大学名を検索・選択...')}
                colorScheme="teal"
              />
            </div>
          )}

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-teal-600" />
                {t('analytics.similarity.primaryLabel', '基準対象 (カリキュラム比較元)')}:
              </span>
              {targetRecord && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-teal-700 font-medium">
                    {t('common.subjectCount', '科目数')}: {targetRecord.subject_count} {t('common.subjectsUnit', '科目')}
                  </span>
                  <AcademicUnitInfoButton
                    target={{
                      id: targetRecord.id,
                      universityName: targetRecord.university_name,
                      facultyName: (targetRecord as any).faculty_name,
                      departmentName: (targetRecord as any).department_name,
                      subjectCount: targetRecord.subject_count,
                      websiteUrl: targetRecord.website_url,
                      level,
                      knowledgeVector: targetRecord.knowledge_vector,
                      generalVector: targetRecord.general_vector,
                    }}
                    variant="badge"
                  />
                </div>
              )}
            </div>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={isLoading || filteredDataList.length === 0}
              className="w-full px-3.5 py-2 text-sm bg-white border border-teal-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-sm"
            >
              {filteredDataList.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatLabel(item)} ({item.subject_count} {t('common.subjectsUnit', '科目')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 計算条件・フィルター */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* 計算指標 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5 text-slate-500" /> {t('analytics.similarity.metricLabel', '計算指標:')}
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricType)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="cosine">{t('analytics.similarity.metricCosine', 'コサイン類似度 (標準)')}</option>
              <option value="dot">{t('analytics.similarity.metricDot', '内積スコア')}</option>
              <option value="euclidean">{t('analytics.similarity.metricEuclidean', 'ユークリッド距離 (小さい順)')}</option>
              <option value="tanimoto">{t('analytics.similarity.metricTanimoto', '谷本係数')}</option>
            </select>
          </div>

          {/* 対象スキル */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-slate-500" /> {t('analytics.similarity.skillsLabel', '対象スキル:')}
            </label>
            <select
              value={vectorTarget}
              onChange={(e) => setVectorTarget(e.target.value as VectorTarget)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="all">{t('analytics.similarity.skillsAll', '全24スキル統合 (知識+汎用)')}</option>
              <option value="knowledge">{t('analytics.similarity.skillsKnowledge', '知識関連スキルのみ (12項目)')}</option>
              <option value="general">{t('analytics.similarity.skillsGeneral', '汎用スキルのみ (12項目)')}</option>
            </select>
          </div>

          {/* 比較対象の絞り込み */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" /> {t('analytics.similarity.scopeLabel', '比較対象の絞り込み:')}
            </label>
            <select
              value={filterUniversity}
              onChange={(e) => setFilterUniversity(e.target.value as TargetFilter)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="all">{t('analytics.similarity.scopeAll', '全大学・学科を対象')}</option>
              <option value="diff">{t('analytics.similarity.scopeOther', '他大学のみ (自大学を除く)')}</option>
              <option value="same">{t('analytics.similarity.scopeSame', '自大学内のみ')}</option>
            </select>
          </div>

          {/* 階層レベル */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> {t('common.level', '階層レベル')}:
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as HierarchyLevel)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="department">{t('common.departmentLevel', '学科レベル')}</option>
              <option value="faculty">{t('common.facultyLevel', '学部レベル')}</option>
              <option value="university">{t('common.universityLevel', '大学レベル')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top 10 類似度横棒グラフ */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[460px]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-teal-600" />
            {t('analytics.similarity.rankingHeading', 'Top 10 類似度ランキング')}
          </h2>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>
              {t('analytics.similarity.rankingSub', '基準: {name}（L1正規化計算）').replace('{name}', formatLabel(targetRecord))}
            </span>
            {targetRecord && (
              <AcademicUnitInfoButton
                target={{
                  id: targetRecord.id,
                  universityName: targetRecord.university_name,
                  facultyName: (targetRecord as any).faculty_name,
                  departmentName: (targetRecord as any).department_name,
                  subjectCount: targetRecord.subject_count,
                  websiteUrl: targetRecord.website_url,
                  level,
                  knowledgeVector: targetRecord.knowledge_vector,
                  generalVector: targetRecord.general_vector,
                }}
                variant="icon"
                size="2xs"
              />
            )}
          </span>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-2" />
            ランキングを算出中...
          </div>
        ) : (
          <SimilarityRanking
            rankingItems={rankingResults}
            metric={metric}
            height={400}
          />
        )}
      </div>

      {/* ランキング詳細一覧テーブル */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">
            {t('analytics.similarity.rankingTitle', 'カリキュラム類似度ランキング')}
          </h3>
          <span className="text-xs text-slate-500">
            {candidates.length} {t('common.subjectsUnit', '件')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-semibold">
                <th className="py-2.5 px-3 w-16 text-center">{t('analytics.similarity.tableRank', '順位')}</th>
                <th className="py-2.5 px-3">{t('common.university', '大学名')}</th>
                <th className="py-2.5 px-3">{t('analytics.similarity.tableTarget', '学部・学科名')}</th>
                <th className="py-2.5 px-3 w-28 text-right">{t('analytics.similarity.tableScore', '類似度スコア')}</th>
                <th className="py-2.5 px-3 w-36 text-center">{t('common.actions', 'アクション')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rankingResults.map((item) => {
                const targetDeptName = item.department_name || item.faculty_name || '';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        item.rank === 1 ? 'bg-amber-100 text-amber-800' :
                        item.rank === 2 ? 'bg-slate-200 text-slate-700' :
                        item.rank === 3 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'text-slate-500'
                      }`}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {item.university_name}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span>{targetDeptName}</span>
                        <AcademicUnitInfoButton
                          target={{
                            id: item.id,
                            universityName: item.university_name,
                            facultyName: item.faculty_name,
                            departmentName: item.department_name,
                            subjectCount: item.subject_count,
                            websiteUrl: item.website_url,
                            level,
                          }}
                          variant="icon"
                          size="xs"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-teal-700">
                      {item.score.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Link
                        href={`/analytics/radar_chart?primaryId=${targetRecord.id}&compareId=${item.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 transition shadow-xs border border-teal-200/60"
                        title={t('analytics.similarity.tableAction', 'レーダー比較')}
                      >
                        <Radar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{t('analytics.similarity.tableAction', 'レーダー比較')}</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function SimilarityPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <SimilarityPageContent />
    </Suspense>
  );
}
