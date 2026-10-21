"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  HierarchyLevel, 
  SkillVectorDepartment, 
  SkillVectorFaculty, 
  SkillVectorUniversity,
  SkillVectorRecord
} from '@/types/database';
import { 
  getRadarIndicators, 
  KNOWLEDGE_SKILLS, 
  GENERAL_SKILLS, 
  ALL_SKILLS,
  normalizeL1,
  combineVectors
} from '@/lib/vectorUtils';
import RadarChart, { RadarSeriesItem } from '@/components/charts/RadarChart';
import RadarLegend, { RadarLegendItem } from '@/components/charts/RadarLegend';
import BackButton from '@/components/BackButton';
import DatabaseErrorBanner from '@/components/DatabaseErrorBanner';
import { useAnalyticsContext } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Radar as RadarIcon, 
  Layers, 
  Database, 
  AlertCircle, 
  CheckSquare, 
  Square, 
  TrendingUp, 
  BookOpen,
  Building2
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
    faculty_name: '文学部',
    department_name: '人文学科',
    subject_count: 145,
    knowledge_vector: [8.5, 32.1, 14.2, 18.4, 5.2, 1.1, 3.2, 0.5, 0.2, 0.8, 4.2, 2.1],
    general_vector:   [11.2, 18.4, 24.2, 16.5, 12.1, 9.3, 8.4, 12.1, 21.5, 6.2, 5.1, 6.4],
  },
  {
    id: 'd3',
    university_name: '九州大学',
    faculty_name: '法学部',
    department_name: '法学科',
    subject_count: 138,
    knowledge_vector: [3.2, 6.1, 1.2, 28.4, 34.2, 1.8, 2.5, 0.4, 0.1, 0.5, 5.2, 4.1],
    general_vector:   [12.1, 26.4, 11.2, 22.1, 14.2, 15.4, 9.1, 5.2, 18.4, 7.1, 6.2, 11.5],
  },
  {
    id: 'd4',
    university_name: '中部大学',
    faculty_name: '工学部',
    department_name: '情報工学科',
    subject_count: 93,
    knowledge_vector: [1.5, 0.5, 1.1, 2.8, 3.2, 12.4, 31.2, 21.8, 9.2, 0.5, 0.2, 0.5],
    general_vector:   [12.8, 20.4, 6.5, 3.2, 8.4, 16.5, 6.8, 10.5, 8.4, 22.1, 24.2, 7.1],
  },
  {
    id: 'd5',
    university_name: '中部大学',
    faculty_name: '人文学部',
    department_name: '日本語日本文化学科',
    subject_count: 102,
    knowledge_vector: [7.2, 35.4, 11.8, 15.2, 4.1, 0.8, 2.1, 0.2, 0.1, 0.4, 3.5, 1.8],
    general_vector:   [10.5, 16.2, 21.4, 14.8, 11.2, 8.1, 7.5, 11.8, 19.4, 5.8, 4.2, 5.5],
  },
  {
    id: 'd6',
    university_name: '中部大学',
    faculty_name: '経営情報学部',
    department_name: '経営総合学科',
    subject_count: 248,
    knowledge_vector: [2.5, 3.1, 1.8, 22.4, 38.5, 4.2, 14.5, 2.1, 0.8, 1.2, 3.8, 8.4],
    general_vector:   [16.2, 18.5, 9.4, 8.5, 12.4, 14.2, 11.8, 8.4, 15.2, 14.8, 12.1, 18.2],
  },
];

type ViewMode = 'split' | 'combined' | 'knowledge' | 'general';

function RadarChartContent() {
  const searchParams = useSearchParams();
  const queryPrimaryId = searchParams.get('primaryId');
  const queryCompareId = searchParams.get('compareId');
  const queryDept = searchParams.get('dept');
  const queryUniv = searchParams.get('univ');
  const queryPrimaryDept = searchParams.get('primaryDept');
  const queryPrimaryUniv = searchParams.get('primaryUniv');
  const queryCompareDept = searchParams.get('compareDept');
  const queryCompareUniv = searchParams.get('compareUniv');
  const { setAnalyticsContext } = useAnalyticsContext();
  const { language, t } = useLanguage();
  const allUnivLabel = t('common.allUniversities', '全ての大学');

  const [level, setLevel] = useState<HierarchyLevel>('department');
  const [dataList, setDataList] = useState<SkillVectorRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUsingMock, setIsUsingMock] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // 対象1 (基準) & 対象2 (比較) の選択ID
  const [primaryId, setPrimaryId] = useState<string>('');
  const [isCompareEnabled, setIsCompareEnabled] = useState<boolean>(true);
  const [compareId, setCompareId] = useState<string>('');

  // 大学フィルター (基準・比較それぞれ)
  const [primaryUnivFilter, setPrimaryUnivFilter] = useState<string>(allUnivLabel);
  const [compareUnivFilter, setCompareUnivFilter] = useState<string>(allUnivLabel);

  // 表示モード & 正規化
  const [viewMode, setViewMode] = useState<ViewMode>('split');

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
          setDataList(data);
          setIsUsingMock(false);
        }
      } catch (err: any) {
        console.error('Error in fetching skill vector:', err);
        setDbError(`データベース通信エラーが発生しました: ${err?.message || err}`);
        setDataList(MOCK_DEPARTMENTS);
        setIsUsingMock(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [level]);

  // 2. 初期IDの設定（URLクエリ優先、または先頭要素）
  useEffect(() => {
    if (dataList.length === 0) return;

    // 1. 基準対象 (primary) の決定
    let targetPrimaryId = '';
    if (queryPrimaryId && dataList.some((d) => d.id === queryPrimaryId)) {
      targetPrimaryId = queryPrimaryId;
    } else {
      const pDept = queryPrimaryDept || queryDept;
      const pUniv = queryPrimaryUniv || queryUniv;
      if (pDept) {
        const found = dataList.find((item: any) => {
          const matchDept = item.department_name === pDept || item.faculty_name === pDept || item.university_name === pDept;
          if (pUniv) return matchDept && item.university_name === pUniv;
          return matchDept;
        });
        if (found) targetPrimaryId = found.id;
      }
    }
    const finalPrimaryId = targetPrimaryId || dataList[0].id;
    setPrimaryId(finalPrimaryId);

    // 選択された基準対象の大学に合わせて大学フィルターを同期（リスト外リセットを防止）
    const pRecord = dataList.find((d) => d.id === finalPrimaryId);
    if (pRecord && primaryUnivFilter !== allUnivLabel && primaryUnivFilter !== '全ての大学' && primaryUnivFilter !== 'All Universities' && primaryUnivFilter !== pRecord.university_name) {
      setPrimaryUnivFilter(allUnivLabel);
    }

    // 2. 比較対象 (compare) の決定
    let targetCompareId = '';
    if (queryCompareId && dataList.some((d) => d.id === queryCompareId)) {
      targetCompareId = queryCompareId;
      setIsCompareEnabled(true);
    } else if (queryCompareDept) {
      const found = dataList.find((item: any) => {
        const matchDept = item.department_name === queryCompareDept || item.faculty_name === queryCompareDept || item.university_name === queryCompareDept;
        if (queryCompareUniv) return matchDept && item.university_name === queryCompareUniv;
        return matchDept;
      });
      if (found) {
        targetCompareId = found.id;
        setIsCompareEnabled(true);
      }
    }

    if (!targetCompareId) {
      // 比較対象がクエリにない場合は、基準と異なる大学のものを優先して初期選択
      const currentPrimary = dataList.find((d) => d.id === finalPrimaryId);
      const diffUniv = dataList.find((d) => d.university_name !== currentPrimary?.university_name);
      targetCompareId = diffUniv ? diffUniv.id : dataList[1]?.id || dataList[0].id;
    }
    setCompareId(targetCompareId);

    // 選択された比較対象の大学に合わせて大学フィルターを同期
    const cRecord = dataList.find((d) => d.id === targetCompareId);
    if (cRecord && compareUnivFilter !== allUnivLabel && compareUnivFilter !== '全ての大学' && compareUnivFilter !== 'All Universities' && compareUnivFilter !== cRecord.university_name) {
      setCompareUnivFilter(allUnivLabel);
    }
  }, [dataList, queryPrimaryId, queryCompareId, queryDept, queryUniv, queryPrimaryDept, queryPrimaryUniv, queryCompareDept, queryCompareUniv, allUnivLabel]);

  // レベル変更時に大学フィルターをリセット
  useEffect(() => {
    setPrimaryUnivFilter(allUnivLabel);
    setCompareUnivFilter(allUnivLabel);
  }, [level, allUnivLabel]);

  // 言語切替時に「全ての大学」ラベルを追従
  useEffect(() => {
    setPrimaryUnivFilter((prev) => (prev === '全ての大学' || prev === 'All Universities') ? allUnivLabel : prev);
    setCompareUnivFilter((prev) => (prev === '全ての大学' || prev === 'All Universities') ? allUnivLabel : prev);
  }, [allUnivLabel]);

  // 大学一覧リスト
  const universityList = useMemo(() => {
    const set = new Set<string>();
    dataList.forEach((d) => {
      if (d.university_name) set.add(d.university_name);
    });
    return [allUnivLabel, ...Array.from(set)];
  }, [dataList, allUnivLabel]);

  // 基準対象用の大学絞り込みリスト
  const filteredPrimaryList = useMemo(() => {
    if (level === 'university' || primaryUnivFilter === allUnivLabel || primaryUnivFilter === '全ての大学' || primaryUnivFilter === 'All Universities') {
      return dataList;
    }
    return dataList.filter((d) => d.university_name === primaryUnivFilter);
  }, [dataList, level, primaryUnivFilter, allUnivLabel]);

  // 比較対象用の大学絞り込みリスト
  const filteredCompareList = useMemo(() => {
    if (level === 'university' || compareUnivFilter === allUnivLabel || compareUnivFilter === '全ての大学' || compareUnivFilter === 'All Universities') {
      return dataList;
    }
    return dataList.filter((d) => d.university_name === compareUnivFilter);
  }, [dataList, level, compareUnivFilter, allUnivLabel]);

  // 大学フィルター切替時に選択中IDがリスト外なら先頭を選択
  useEffect(() => {
    if (filteredPrimaryList.length > 0 && !filteredPrimaryList.some((d) => d.id === primaryId)) {
      setPrimaryId(filteredPrimaryList[0].id);
    }
  }, [filteredPrimaryList, primaryId]);

  useEffect(() => {
    if (filteredCompareList.length > 0 && !filteredCompareList.some((d) => d.id === compareId)) {
      setCompareId(filteredCompareList[0].id);
    }
  }, [filteredCompareList, compareId]);

  // 現在選択されているレコード
  const primaryRecord = useMemo(() => {
    return filteredPrimaryList.find((d) => d.id === primaryId) || dataList.find((d) => d.id === primaryId) || dataList[0];
  }, [filteredPrimaryList, dataList, primaryId]);

  const compareRecord = useMemo(() => {
    return filteredCompareList.find((d) => d.id === compareId) || dataList.find((d) => d.id === compareId) || dataList[1] || dataList[0];
  }, [filteredCompareList, dataList, compareId]);

  // レコード表示名フォーマッタ
  const formatLabel = (rec?: SkillVectorRecord) => {
    if (!rec) return '';
    const dept = (rec as any).department_name;
    const fac = (rec as any).faculty_name;
    if (dept) return `【${rec.university_name}】 ${dept}`;
    if (fac) return `【${rec.university_name}】 ${fac}`;
    return `【${rec.university_name}】`;
  };

  // L1正規化 (総和=100%) を必ず適用するヘルパー
  const toPercent = (vec: number[] = []) =>
    normalizeL1(vec).map((v) => Number((v * 100).toFixed(2)));

  // 各種インジケーター (軸)
  const knowledgeIndicators = useMemo(() => getRadarIndicators('knowledge', { max: 100, language }), [language]);
  const generalIndicators = useMemo(() => getRadarIndicators('general', { max: 100, language }), [language]);
  const combinedIndicators = useMemo(() => getRadarIndicators('all', { max: 100, language }), [language]);

  // シリーズデータの生成
  // 分割表示: 知識12次元・汎用12次元をそれぞれL1正規化 (各総和100%)
  // 統合表示: 24次元全体でL1正規化 (総和100%)
  const primaryKVec = useMemo(() => toPercent(primaryRecord?.knowledge_vector), [primaryRecord]);
  const primaryGVec = useMemo(() => toPercent(primaryRecord?.general_vector), [primaryRecord]);
  const primaryAllVec = useMemo(
    () => toPercent(combineVectors(primaryRecord?.knowledge_vector || [], primaryRecord?.general_vector || [])),
    [primaryRecord]
  );

  const compareKVec = useMemo(() => toPercent(compareRecord?.knowledge_vector), [compareRecord]);
  const compareGVec = useMemo(() => toPercent(compareRecord?.general_vector), [compareRecord]);
  const compareAllVec = useMemo(
    () => toPercent(combineVectors(compareRecord?.knowledge_vector || [], compareRecord?.general_vector || [])),
    [compareRecord]
  );

  // EChartsへ渡すシリーズ配列
  const knowledgeSeries: RadarSeriesItem[] = useMemo(() => {
    const list: RadarSeriesItem[] = [
      {
        name: formatLabel(primaryRecord),
        value: primaryKVec,
        color: '#009688', // teal
      },
    ];
    if (isCompareEnabled && compareRecord && compareRecord.id !== primaryRecord?.id) {
      list.push({
        name: formatLabel(compareRecord),
        value: compareKVec,
        color: '#e0532b', // terracotta orange
      });
    }
    return list;
  }, [primaryRecord, compareRecord, primaryKVec, compareKVec, isCompareEnabled]);

  const generalSeries: RadarSeriesItem[] = useMemo(() => {
    const list: RadarSeriesItem[] = [
      {
        name: formatLabel(primaryRecord),
        value: primaryGVec,
        color: '#009688',
      },
    ];
    if (isCompareEnabled && compareRecord && compareRecord.id !== primaryRecord?.id) {
      list.push({
        name: formatLabel(compareRecord),
        value: compareGVec,
        color: '#e0532b',
      });
    }
    return list;
  }, [primaryRecord, compareRecord, primaryGVec, compareGVec, isCompareEnabled]);

  const combinedSeries: RadarSeriesItem[] = useMemo(() => {
    const list: RadarSeriesItem[] = [
      {
        name: formatLabel(primaryRecord),
        value: primaryAllVec,
        color: '#009688',
      },
    ];
    if (isCompareEnabled && compareRecord && compareRecord.id !== primaryRecord?.id) {
      list.push({
        name: formatLabel(compareRecord),
        value: compareAllVec,
        color: '#e0532b',
      });
    }
    return list;
  }, [primaryRecord, compareRecord, primaryAllVec, compareAllVec, isCompareEnabled]);

  // グラフ共通の凡例アイテム
  const legendItems: RadarLegendItem[] = useMemo(() => {
    if (!primaryRecord) return [];
    const list: RadarLegendItem[] = [
      {
        name: formatLabel(primaryRecord),
        color: '#009688',
        subLabel: t('charts.radar.baseTarget'),
      },
    ];
    if (isCompareEnabled && compareRecord && compareRecord.id !== primaryRecord.id) {
      list.push({
        name: formatLabel(compareRecord),
        color: '#e0532b',
        subLabel: t('charts.radar.compareTarget'),
      });
    }
    return list;
  }, [primaryRecord, compareRecord, isCompareEnabled, t]);

  // Topスキル算出ヘルパー
  const getTopSkills = (vec: number[] = [], skills: typeof KNOWLEDGE_SKILLS, count = 3) => {
    return vec
      .map((val, idx) => ({ name: skills[idx]?.nameJa || '', val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, count);
  };

  const primaryTopK = useMemo(() => getTopSkills(primaryKVec, KNOWLEDGE_SKILLS, 3), [primaryKVec]);
  const primaryTopG = useMemo(() => getTopSkills(primaryGVec, GENERAL_SKILLS, 3), [primaryGVec]);
  const compareTopK = useMemo(() => getTopSkills(compareKVec, KNOWLEDGE_SKILLS, 3), [compareKVec]);
  const compareTopG = useMemo(() => getTopSkills(compareGVec, GENERAL_SKILLS, 3), [compareGVec]);

  // AIエージェントへのコンテキスト用（より多面的な特徴分析のためTop 5を提供）
  const primaryTopK5 = useMemo(() => getTopSkills(primaryKVec, KNOWLEDGE_SKILLS, 5), [primaryKVec]);
  const primaryTopG5 = useMemo(() => getTopSkills(primaryGVec, GENERAL_SKILLS, 5), [primaryGVec]);
  const compareTopK5 = useMemo(() => getTopSkills(compareKVec, KNOWLEDGE_SKILLS, 5), [compareKVec]);
  const compareTopG5 = useMemo(() => getTopSkills(compareGVec, GENERAL_SKILLS, 5), [compareGVec]);

  // AIエージェントへの画面コンテキスト共有
  useEffect(() => {
    if (!primaryRecord) return;

    const primaryName = formatLabel(primaryRecord);
    const compareName = isCompareEnabled && compareRecord && compareRecord.id !== primaryRecord.id
      ? formatLabel(compareRecord)
      : null;

    const presets: string[] = [];
    if (compareName) {
      presets.push(`「${primaryName}」と「${compareName}」の最大の違いは何ですか？`);
      presets.push(`2つの学科で共通している強みスキルを分析して`);
    } else {
      presets.push(`「${primaryName}」のスキルバランスの特徴と強みを要約して`);
      presets.push(`「${primaryName}」で不足しているスキル領域を補う科目の提案をして`);
    }
    presets.push(`知識スキル(A群)と汎用スキル(B群)のバランスについての教育的評価は？`);
    presets.push(`カリキュラム改善のための具体的なアクションプランは？`);

    setAnalyticsContext({
      pageTitle: t('analytics.radar.pageTitle', 'スキルレーダーチャート'),
      primaryTarget: primaryName,
      compareTarget: compareName || undefined,
      summaryText: `${primaryName} のシラバススキル分析（${compareName ? `vs ${compareName}` : '単体表示'}）`,
      details: {
        viewMode,
        normalization: 'L1正規化（全軸合計=100%の構成比率）',
        primary: {
          name: primaryName,
          subjectCount: primaryRecord.subject_count,
          topKnowledge: primaryTopK5.map((s) => `${s.name}: ${s.val}%`),
          topGeneral: primaryTopG5.map((s) => `${s.name}: ${s.val}%`),
        },
        ...(compareName && compareRecord
          ? {
              compare: {
                name: compareName,
                subjectCount: compareRecord.subject_count,
                topKnowledge: compareTopK5.map((s) => `${s.name}: ${s.val}%`),
                topGeneral: compareTopG5.map((s) => `${s.name}: ${s.val}%`),
              },
            }
          : {}),
      },
      presetQuestions: presets,
    });
  }, [
    primaryRecord,
    compareRecord,
    isCompareEnabled,
    viewMode,
    primaryTopK5,
    primaryTopG5,
    compareTopK5,
    compareTopG5,
    setAnalyticsContext,
    t,
  ]);

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
            <RadarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {t('analytics.radar.heading', 'スキルレーダーチャート分析')}
            </h1>
            <p className="text-sm text-slate-500">
              {t('analytics.radar.subtitle', 'シラバスから抽出した知識関連スキル(12項目)と汎用スキル(12項目)のバランスを比較・可視化します')}
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
        {/* レベル・表示モードの切り替え */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* 階層レベル切り替え */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-slate-600">{t('analytics.radar.levelLabel', '階層:')}</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as HierarchyLevel)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="department">{t('common.departmentLevel', '学科レベル')}</option>
                <option value="faculty">{t('common.facultyLevel', '学部レベル')}</option>
                <option value="university">{t('common.universityLevel', '大学レベル')}</option>
              </select>
            </div>

            {/* 表示モード */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-slate-600">{t('analytics.radar.viewModeLabel', '表示形式:')}</span>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="split">{t('analytics.radar.split', '知識・汎用 2分割 (12角形×2)')}</option>
                <option value="combined">{t('analytics.radar.combined', '統合表示 (24角形)')}</option>
                <option value="knowledge">{t('analytics.radar.knowledgeOnly', '知識関連スキルのみ (12角形)')}</option>
                <option value="general">{t('analytics.radar.generalOnly', '汎用スキルのみ (12角形)')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* 対象選択 (基準 vs 比較) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 対象 1 (基準: 青緑/ティール) */}
          <div className="p-3.5 rounded-lg bg-teal-50/40 border border-teal-200 space-y-2.5">
            {/* 基準対象用 大学フィルター (学部・学科時) */}
            {level !== 'university' && universityList.length > 1 && (
              <div className="pb-2 border-b border-teal-200/60">
                <SearchableSelect
                  label={t('analytics.radar.univFilterPrimary', '大学絞り込み (基準):')}
                  options={universityList}
                  value={primaryUnivFilter}
                  onChange={setPrimaryUnivFilter}
                  placeholder={t('analytics.radar.searchUniv', '大学名を検索・選択...')}
                  colorScheme="teal"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                  {t('analytics.radar.primaryTarget', '基準対象 (青緑)')}
                </span>
                {primaryRecord && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-teal-700 font-medium flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> {t('common.subjectCount', '科目数')}: {primaryRecord.subject_count}
                    </span>
                    <AcademicUnitInfoButton
                      target={{
                        id: primaryRecord.id,
                        universityName: primaryRecord.university_name,
                        facultyName: (primaryRecord as any).faculty_name,
                        departmentName: (primaryRecord as any).department_name,
                        subjectCount: primaryRecord.subject_count,
                        websiteUrl: primaryRecord.website_url,
                        level,
                        knowledgeVector: primaryRecord.knowledge_vector,
                        generalVector: primaryRecord.general_vector,
                      }}
                      variant="badge"
                      size="2xs"
                    />
                  </div>
                )}
              </div>
              <select
                value={primaryId}
                onChange={(e) => setPrimaryId(e.target.value)}
                disabled={isLoading || filteredPrimaryList.length === 0}
                className="w-full px-3 py-2 text-sm bg-white border border-teal-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-sm"
              >
                {filteredPrimaryList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatLabel(item)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 対象 2 (比較: 橙/テラコッタオレンジ) */}
          <div className={`p-3.5 rounded-lg border transition space-y-2.5 ${isCompareEnabled ? 'bg-orange-50/40 border-orange-200' : 'bg-slate-50/50 border-slate-200 opacity-70'}`}>
            {/* 比較対象用 大学フィルター (学部・学科時) */}
            {isCompareEnabled && level !== 'university' && universityList.length > 1 && (
              <div className="pb-2 border-b border-orange-200/60">
                <SearchableSelect
                  label={t('analytics.radar.univFilterCompare', '大学絞り込み (比較):')}
                  options={universityList}
                  value={compareUnivFilter}
                  onChange={setCompareUnivFilter}
                  placeholder={t('analytics.radar.searchUniv', '大学名を検索・選択...')}
                  colorScheme="orange"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setIsCompareEnabled(!isCompareEnabled)}
                  className="text-xs font-bold text-orange-800 flex items-center gap-1.5 hover:opacity-80 transition cursor-pointer"
                >
                  {isCompareEnabled ? (
                    <CheckSquare className="w-4 h-4 text-orange-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{t('analytics.radar.compareTarget', '比較対象 (橙)')}</span>
                </button>
                {isCompareEnabled && compareRecord && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-orange-700 font-medium flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> {t('common.subjectCount', '科目数')}: {compareRecord.subject_count}
                    </span>
                    <AcademicUnitInfoButton
                      target={{
                        id: compareRecord.id,
                        universityName: compareRecord.university_name,
                        facultyName: (compareRecord as any).faculty_name,
                        departmentName: (compareRecord as any).department_name,
                        subjectCount: compareRecord.subject_count,
                        websiteUrl: compareRecord.website_url,
                        level,
                        knowledgeVector: compareRecord.knowledge_vector,
                        generalVector: compareRecord.general_vector,
                      }}
                      variant="badge"
                      size="2xs"
                    />
                  </div>
                )}
              </div>
              <select
                value={compareId}
                onChange={(e) => setCompareId(e.target.value)}
                disabled={!isCompareEnabled || isLoading || filteredCompareList.length === 0}
                className="w-full px-3 py-2 text-sm bg-white border border-orange-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
              >
                {filteredCompareList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatLabel(item)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* レーダーチャート描画エリア */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1 min-h-[550px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-2" />
            データを読み込み中...
          </div>
        ) : (
          <>
            {viewMode === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[480px]">
                {/* 知識関連スキル (左) */}
                <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/20 shadow-2xs">
                  <RadarChart
                    title={t('charts.radar.knowledgeTitle')}
                    indicators={knowledgeIndicators}
                    seriesData={knowledgeSeries}
                    height={460}
                    showLegend={false}
                  />
                </div>
                {/* 汎用スキル (右) */}
                <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/20 shadow-2xs">
                  <RadarChart
                    title={t('charts.radar.generalTitle')}
                    indicators={generalIndicators}
                    seriesData={generalSeries}
                    height={460}
                    showLegend={false}
                  />
                </div>
              </div>
            )}

            {viewMode === 'combined' && (
              <div className="flex-1 min-h-[520px] flex flex-col justify-center">
                <RadarChart
                  title={t('charts.radar.combinedTitle')}
                  indicators={combinedIndicators}
                  seriesData={combinedSeries}
                  height={520}
                  showLegend={false}
                />
              </div>
            )}

            {viewMode === 'knowledge' && (
              <div className="flex-1 min-h-[500px]">
                <RadarChart
                  title={t('charts.radar.knowledgeTitle')}
                  indicators={knowledgeIndicators}
                  seriesData={knowledgeSeries}
                  height={500}
                  showLegend={false}
                />
              </div>
            )}

            {viewMode === 'general' && (
              <div className="flex-1 min-h-[500px]">
                <RadarChart
                  title={t('charts.radar.generalTitle')}
                  indicators={generalIndicators}
                  seriesData={generalSeries}
                  height={500}
                  showLegend={false}
                />
              </div>
            )}

            {/* グラフ共通の凡例（中央に1つだけ大きめに表示） */}
            <div className="pt-3 pb-1 border-t border-slate-100">
              <RadarLegend items={legendItems} />
            </div>
          </>
        )}
      </div>

      {/* スキルサマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 基準対象 Topスキル */}
        {primaryRecord && (
          <div className="p-4 bg-white rounded-xl border border-teal-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-teal-800 mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                <span>{formatLabel(primaryRecord)} {t('analytics.radar.strengthsOf', 'の強み・特徴')}</span>
              </div>
              <AcademicUnitInfoButton
                target={{
                  id: primaryRecord.id,
                  universityName: primaryRecord.university_name,
                  facultyName: (primaryRecord as any).faculty_name,
                  departmentName: (primaryRecord as any).department_name,
                  subjectCount: primaryRecord.subject_count,
                  websiteUrl: primaryRecord.website_url,
                  level,
                  knowledgeVector: primaryRecord.knowledge_vector,
                  generalVector: primaryRecord.general_vector,
                }}
                variant="icon"
                size="xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-slate-500 font-semibold mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> {t('analytics.radar.knowledgeTop3', '知識スキル Top 3')}
                </div>
                {primaryTopK.map((s, i) => (
                  <div key={i} className="flex justify-between text-slate-700 py-0.5">
                    <span>{i + 1}. {s.name}</span>
                    <span className="font-semibold text-teal-600">{s.val.toFixed(1)}%</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-slate-500 font-semibold mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> {t('analytics.radar.generalTop3', '汎用スキル Top 3')}
                </div>
                {primaryTopG.map((s, i) => (
                  <div key={i} className="flex justify-between text-slate-700 py-0.5">
                    <span>{i + 1}. {s.name}</span>
                    <span className="font-semibold text-teal-600">{s.val.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 比較対象 Topスキル */}
        {isCompareEnabled && compareRecord && (
          <div className="p-4 bg-white rounded-xl border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-orange-800 mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                <span>{formatLabel(compareRecord)} {t('analytics.radar.strengthsOf', 'の強み・特徴')}</span>
              </div>
              <AcademicUnitInfoButton
                target={{
                  id: compareRecord.id,
                  universityName: compareRecord.university_name,
                  facultyName: (compareRecord as any).faculty_name,
                  departmentName: (compareRecord as any).department_name,
                  subjectCount: compareRecord.subject_count,
                  websiteUrl: compareRecord.website_url,
                  level,
                  knowledgeVector: compareRecord.knowledge_vector,
                  generalVector: compareRecord.general_vector,
                }}
                variant="icon"
                size="xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-slate-500 font-semibold mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-600" /> {t('analytics.radar.knowledgeTop3', '知識スキル Top 3')}
                </div>
                {compareTopK.map((s, i) => (
                  <div key={i} className="flex justify-between text-slate-700 py-0.5">
                    <span>{i + 1}. {s.name}</span>
                    <span className="font-semibold text-orange-600">{s.val.toFixed(1)}%</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-slate-500 font-semibold mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-600" /> {t('analytics.radar.generalTop3', '汎用スキル Top 3')}
                </div>
                {compareTopG.map((s, i) => (
                  <div key={i} className="flex justify-between text-slate-700 py-0.5">
                    <span>{i + 1}. {s.name}</span>
                    <span className="font-semibold text-orange-600">{s.val.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RadarChartPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <RadarChartContent />
    </Suspense>
  );
}
