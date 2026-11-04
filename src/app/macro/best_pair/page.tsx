"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  HierarchyLevel,
  SkillVectorDepartment,
  SkillVectorRecord
} from '@/types/database';
import {
  calculateMacroPairs,
  elementwiseMax,
  elementwiseMean,
  getRadarIndicators,
  MacroPairItem,
  MacroScoreMetric,
  normalizeL1,
  resolveCombineMethod
} from '@/lib/vectorUtils';
import RadarChart, { RadarSeriesItem } from '@/components/charts/RadarChart';
import DualChartExportButton from '@/components/charts/DualChartExportButton';
import RadarLegend, { RadarLegendItem } from '@/components/charts/RadarLegend';
import BackButton from '@/components/BackButton';
import DatabaseErrorBanner from '@/components/DatabaseErrorBanner';
import { DbErrorInfo, errorDetail } from '@/lib/dbError';
import { useAnalyticsContext } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Sparkles, 
  CheckCircle2, 
  BarChart2, 
  Filter, 
  GraduationCap, 
  Layers, 
  Radar as RadarIcon, 
  TrendingUp,
  Sliders,
} from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ALL_UNIVERSITIES, UnivFilterValue, filterByUniversity, filterForTarget, keepOrFirstId, univSelectProps } from '@/lib/univFilter';
import AcademicUnitInfoButton from '@/components/AcademicUnitInfoButton';
import { getDepartmentName, getFacultyName } from '@/lib/recordFields';
import { dropExcludedFaculties } from '@/lib/excludedUnits';

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

const toPercent = (vec: number[] = []) => normalizeL1(vec).map((v) => Number((v * 100).toFixed(2)));

// 緑の線。カバー率のときは計算と同じく正規化し直さない値、バランス度のときは正規化し直した値を描く
const toCombinedLine = (a: number[], b: number[], metric: MacroScoreMetric, combine: 'max' | 'mean') => {
  if (!a.length || !b.length) return [];
  if (metric === 'coverage') return elementwiseMax(a, b);
  return toPercent(combine === 'max' ? elementwiseMax(a, b) : elementwiseMean(a, b));
};

function BestPairContent() {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id') || searchParams.get('primaryId') || searchParams.get('targetId');
  const queryDept = searchParams.get('dept') || searchParams.get('primaryDept');
  const queryUniv = searchParams.get('univ') || searchParams.get('primaryUniv');
  const { setAnalyticsContext } = useAnalyticsContext();

  const [level, setLevel] = useState<HierarchyLevel>('department');
  const [dataList, setDataList] = useState<SkillVectorRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, setIsUsingMock] = useState<boolean>(false);
  const [dbError, setDbError] = useState<DbErrorInfo | null>(null);

  // 基準対象
  const [targetId, setTargetId] = useState<string>('');

  // 選択中のパートナー
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');

  // パラメータ
  const [scoreMetric, setScoreMetric] = useState<MacroScoreMetric>('coverage');
  const [combineMethod, setCombineMethod] = useState<'max' | 'mean'>('max');
  const [filterUniversity, setFilterUniversity] = useState<TargetFilter>('all');

  // カバー率のときは最大値結合に固定する（バランス度に戻すと選んでいた結合方法に戻る）
  const resolvedCombine = resolveCombineMethod(scoreMetric, combineMethod);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      if (!isSupabaseConfigured) {
        setDbError({ key: 'notConfigured' });
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
          setDbError({ key: 'fetchFailed', params: { detail: error.message } });
          setDataList(MOCK_DEPARTMENTS);
          setIsUsingMock(true);
        } else if (!data || data.length === 0) {
          setDbError({ key: 'tableEmpty', params: { table: tableName } });
          setDataList(MOCK_DEPARTMENTS);
          setIsUsingMock(true);
        } else {
          setDbError(null);
          // 実験用レコード（gpt-5.6-terra等）と、学部の単位で比べない科目群を除外
          const validData = dropExcludedFaculties(
            (data as SkillVectorRecord[]).filter((d) => !d.university_name.includes('gpt-')),
            level
          );
          setDataList(validData.length > 0 ? validData : data);
          setIsUsingMock(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setDbError({ key: 'networkError', params: { detail: errorDetail(err) } });
        setDataList(MOCK_DEPARTMENTS);
        setIsUsingMock(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [level]);

  const allUnivLabel = t('common.allUniversities', '全ての大学');

  // 大学フィルター (学部・学科レベル時)。値は ALL_UNIVERSITIES か大学名（表示ラベルは持たない）
  const [selectedUnivFilter, setSelectedUnivFilter] = useState<UnivFilterValue>(ALL_UNIVERSITIES);

  // 初期の基準対象（URL クエリ優先、または先頭要素）
  // データまたは URL クエリが変わったときに 1 度だけ、レンダー中に state を調整する
  // （effect 内の setState による連鎖レンダーを避ける React 推奨のパターン）
  const initKey = JSON.stringify([queryId, queryDept, queryUniv]);
  const [appliedInit, setAppliedInit] = useState<{ data: SkillVectorRecord[]; key: string } | null>(null);
  if (dataList.length > 0 && (appliedInit?.data !== dataList || appliedInit.key !== initKey)) {
    setAppliedInit({ data: dataList, key: initKey });
    let matchedId = '';
    if (queryId && dataList.some((d) => d.id === queryId)) {
      matchedId = queryId;
    } else if (queryDept) {
      const found = dataList.find((item) => {
        const mDept = getDepartmentName(item) === queryDept || getFacultyName(item) === queryDept || item.university_name === queryDept;
        if (queryUniv) return mDept && item.university_name === queryUniv;
        return mDept;
      });
      if (found) matchedId = found.id;
    }
    const finalId = matchedId || dataList[0].id;
    setTargetId(finalId);

    // 選択された基準対象の大学に合わせて大学フィルターを同期
    setSelectedUnivFilter(filterForTarget(selectedUnivFilter, dataList.find((d) => d.id === finalId)));
  }

  // レベル変更：大学フィルターも全大学に戻す（以前は effect で行っていた）
  const handleLevelChange = (next: HierarchyLevel) => {
    setLevel(next);
    setSelectedUnivFilter(ALL_UNIVERSITIES);
  };

  // 大学一覧（フィルターの選択肢。先頭の「全ての大学」は univSelectProps が付ける）
  const universityNames = useMemo(() => {
    const set = new Set<string>();
    dataList.forEach((d) => {
      if (d.university_name) set.add(d.university_name);
    });
    return Array.from(set);
  }, [dataList]);

  // 大学フィルター適用後の基準選択肢
  const filteredDataList = useMemo(
    () => filterByUniversity(dataList, selectedUnivFilter, level),
    [dataList, level, selectedUnivFilter]
  );

  // 大学フィルター変更：選択中の基準が一覧から外れる場合は先頭を選ぶ（以前は effect で行っていた）
  const handleUnivFilterChange = (next: UnivFilterValue) => {
    setSelectedUnivFilter(next);
    setTargetId((prev) => keepOrFirstId(filterByUniversity(dataList, next, level), prev));
  };

  const targetRecord = useMemo(() => {
    return filteredDataList.find((d) => d.id === targetId) || filteredDataList[0] || dataList[0];
  }, [filteredDataList, dataList, targetId]);

  const formatLabel = (rec?: SkillVectorRecord) => {
    if (!rec) return '';
    const dept = getDepartmentName(rec);
    const fac = getFacultyName(rec);
    if (dept) return `【${rec.university_name}】 ${dept}`;
    if (fac) return `【${rec.university_name}】 ${fac}`;
    return `【${rec.university_name}】`;
  };

  const candidates = useMemo(() => {
    if (!targetRecord) return [];
    let filtered = dataList.filter((d) => d.id !== targetRecord.id);
    if (filterUniversity === 'same') {
      filtered = filtered.filter((d) => d.university_name === targetRecord.university_name);
    } else if (filterUniversity === 'diff') {
      filtered = filtered.filter((d) => d.university_name !== targetRecord.university_name);
    }
    return filtered.map((d) => ({
      id: d.id,
      label: formatLabel(d),
      university_name: d.university_name,
      faculty_name: getFacultyName(d),
      department_name: getDepartmentName(d),
      vector_A: d.knowledge_vector || [],
      vector_B: d.general_vector || [],
      subject_count: d.subject_count,
      website_url: d.website_url,
    }));
  }, [dataList, targetRecord, filterUniversity]);

  // スコアは汎用12軸で計算する（専門の近さだけ知識12軸を使う）
  const rankingResults: MacroPairItem[] = useMemo(() => {
    if (!targetRecord || candidates.length === 0) return [];
    return calculateMacroPairs(
      {
        id: targetRecord.id,
        vector_A: targetRecord.knowledge_vector || [],
        vector_B: targetRecord.general_vector || [],
      },
      candidates,
      {
        scoreMetric,
        combineMethod: resolvedCombine,
        topN: 20,
      }
    );
  }, [targetRecord, candidates, scoreMetric, resolvedCombine]);

  // ランキングが変わり選択中のパートナーが含まれなくなったら 1 位を選ぶ（レンダー中に調整。以前は effect で行っていた）
  if (rankingResults.length > 0 && !rankingResults.some((r) => r.id === selectedPartnerId)) {
    setSelectedPartnerId(rankingResults[0].id);
  }

  const partnerRecord = useMemo(() => {
    return dataList.find((d) => d.id === selectedPartnerId) || (rankingResults[0] ? dataList.find(d => d.id === rankingResults[0].id) : null);
  }, [dataList, selectedPartnerId, rankingResults]);

  const currentPairItem = useMemo(() => {
    return rankingResults.find((r) => r.id === selectedPartnerId) || rankingResults[0];
  }, [rankingResults, selectedPartnerId]);

  // レーダーチャート用（知識12項目 ＆ 汎用12項目の2分割）
  const knowledgeIndicators = useMemo(() => getRadarIndicators('knowledge', { max: 100, language }), [language]);
  const generalIndicators = useMemo(() => getRadarIndicators('general', { max: 100, language }), [language]);

  const targetKVec = useMemo(() => toPercent(targetRecord?.knowledge_vector), [targetRecord]);
  const targetGVec = useMemo(() => toPercent(targetRecord?.general_vector), [targetRecord]);
  const partnerKVec = useMemo(() => toPercent(partnerRecord?.knowledge_vector), [partnerRecord]);
  const partnerGVec = useMemo(() => toPercent(partnerRecord?.general_vector), [partnerRecord]);

  const combinedKVec = useMemo(() => toCombinedLine(targetKVec, partnerKVec, scoreMetric, resolvedCombine), [targetKVec, partnerKVec, scoreMetric, resolvedCombine]);
  const combinedGVec = useMemo(() => toCombinedLine(targetGVec, partnerGVec, scoreMetric, resolvedCombine), [targetGVec, partnerGVec, scoreMetric, resolvedCombine]);

  const getShortName = (rec?: SkillVectorRecord) => {
    if (!rec) return '';
    return getDepartmentName(rec) || getFacultyName(rec) || rec.university_name;
  };

  const knowledgeSeries: RadarSeriesItem[] = useMemo(() => {
    if (!targetRecord) return [];
    const list: RadarSeriesItem[] = [
      { name: `${t('charts.radar.baseTarget')}: ${getShortName(targetRecord)}`, value: targetKVec, color: '#009688' }, // teal
    ];
    if (partnerRecord) {
      list.push({ name: `${t('charts.radar.partnerTarget')}: ${getShortName(partnerRecord)}`, value: partnerKVec, color: '#e0532b' }); // orange
      list.push({ 
        name: `${t('charts.radar.teamCombined')} (${resolvedCombine === 'max' ? 'Max' : 'Mean'})`, 
        value: combinedKVec, 
        color: '#059669' 
      });
    }
    return list;
  }, [targetRecord, partnerRecord, targetKVec, partnerKVec, combinedKVec, resolvedCombine, t]);

  const generalSeries: RadarSeriesItem[] = useMemo(() => {
    if (!targetRecord) return [];
    const list: RadarSeriesItem[] = [
      { name: `${t('charts.radar.baseTarget')}: ${getShortName(targetRecord)}`, value: targetGVec, color: '#009688' },
    ];
    if (partnerRecord) {
      list.push({ name: `${t('charts.radar.partnerTarget')}: ${getShortName(partnerRecord)}`, value: partnerGVec, color: '#e0532b' });
      list.push({ 
        name: `${t('charts.radar.teamCombined')} (${resolvedCombine === 'max' ? 'Max' : 'Mean'})`, 
        value: combinedGVec, 
        color: '#059669' 
      });
    }
    return list;
  }, [targetRecord, partnerRecord, targetGVec, partnerGVec, combinedGVec, resolvedCombine, t]);

  // 2つのチャート共通の凡例アイテム
  const legendItems: RadarLegendItem[] = useMemo(() => {
    if (!targetRecord) return [];
    const list: RadarLegendItem[] = [
      {
        name: `${t('charts.radar.baseTarget')}: ${getShortName(targetRecord)}`,
        color: '#009688',
        subLabel: t('charts.radar.baseOrg'),
      },
    ];
    if (partnerRecord) {
      list.push({
        name: `${t('charts.radar.partnerTarget')}: ${getShortName(partnerRecord)}`,
        color: '#e0532b',
        subLabel: t('charts.radar.basePartner'),
      });
      list.push({
        name: `${t('charts.radar.teamCombined')} (${resolvedCombine === 'max' ? 'Max' : 'Mean'})`,
        color: '#059669',
        subLabel: t('charts.radar.synergy'),
      });
    }
    return list;
  }, [targetRecord, partnerRecord, resolvedCombine, t]);

  // 評価指標の名前と説明
  const metricName = scoreMetric === 'coverage' ? t('macro.metric.coverage', 'カバー率') : t('macro.metric.balance', 'バランス度');
  const unitName = t(`macro.metric.units.${level}`, level === 'faculty' ? '学部' : level === 'university' ? '大学' : '学科');
  const coverageDesc = t('macro.metric.coverageDesc', '理想までの不足のうち、追加した{unit}が埋めた割合').replace('{unit}', unitName);
  const combineName = resolvedCombine === 'max' ? t('macro.metric.combineMax', '最大値結合') : t('macro.metric.combineMean', '平均値結合');
  const signedPt = (v: number, digits: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(digits)} pt`;

  // AIコンテキスト共有
  useEffect(() => {
    if (!targetRecord) return;
    const isEn = language === 'en';
    const targetLabel = formatLabel(targetRecord);
    const top1 = rankingResults[0];

    const presets: string[] = [];
    if (top1) {
      if (isEn) {
        presets.push(`Why does #1 "${top1.label}" achieve the highest ${metricName} for "${targetLabel}"?`);
        presets.push(scoreMetric === 'coverage'
          ? `How do the rankings differ between coverage and balance?`
          : `How do ranking results differ between Max Pooling (strengths) and Mean Pooling (overall uplift)?`);
        if (partnerRecord) {
          presets.push(`Which specific skill domains does "${formatLabel(partnerRecord)}" fill for "${targetLabel}"?`);
        }
      } else {
        presets.push(`「${targetLabel}」にとって第1位「${top1.label}」の${metricName}が最も高くなる理由は？`);
        presets.push(scoreMetric === 'coverage'
          ? `カバー率とバランス度でペア相手のランキングはどう変わりますか？`
          : `最大値結合(Max)と平均値結合(Mean)でペア相手のランキングはどう変化しますか？`);
        if (partnerRecord) {
          presets.push(`「${targetLabel}」の不足を「${formatLabel(partnerRecord)}」が特に埋めるスキル分野を教えて`);
        }
      }
    }
    if (isEn) {
      presets.push(`What educational governance and curriculum advice is crucial when establishing a 1-to-1 best partnership?`);
    } else {
      presets.push(`カリキュラム連携で「1対1のベストペア」を組む際の教育ガバナンス上のアドバイスは？`);
    }

    const combineLabel = resolvedCombine === 'max'
      ? (isEn ? 'Max Pooling (Leverage strengths)' : '最大値結合 (各々の強み重視)')
      : (isEn ? 'Mean Pooling (Overall uplift)' : '平均値結合 (総合底上げ)');
    const targetSkillsLabel = isEn ? 'Generic skills (12 axes)' : '汎用スキル（12軸）';
    const round4 = (v: number) => Number(v.toFixed(4));

    setAnalyticsContext({
      pageTitle: t('macro.bestPair.title', 'ベスト・ペア検索'),
      pagePath: '/macro/best_pair',
      primaryTarget: targetLabel,
      compareTarget: partnerRecord ? formatLabel(partnerRecord) : undefined,
      summaryText: isEn
        ? `Base: ${targetLabel} best pair search (Metric: ${metricName}, Method: ${combineLabel}, Target: ${targetSkillsLabel})`
        : `基準対象: ${targetLabel} のベスト・ペア探索（評価指標: ${metricName}、結合方法: ${combineLabel}、対象スキル: ${targetSkillsLabel}）`,
      details: {
        target: targetLabel,
        partner: partnerRecord ? formatLabel(partnerRecord) : (isEn ? 'Not selected' : '未選択'),
        evaluationMetric: metricName,
        combineMethod: combineLabel,
        coverageCombine: isEn ? 'Coverage is always computed with Max Pooling' : 'カバー率は常に最大値結合で計算',
        targetSkills: targetSkillsLabel,
        selectedPair: currentPairItem ? {
          label: currentPairItem.label,
          coverage: round4(currentPairItem.coverage),
          balance: round4(currentPairItem.balance),
          baselineBalance: round4(currentPairItem.baseline_balance),
          balanceImprovement: round4(currentPairItem.balance_improvement),
          domainProximity: round4(currentPairItem.sim_a),
        } : undefined,
        topPairs: rankingResults.slice(0, 5).map((r) => ({
          rank: r.rank,
          label: r.label,
          coverage: round4(r.coverage),
          balance: round4(r.balance),
          balanceImprovement: round4(r.balance_improvement),
          domainProximity: round4(r.sim_a),
        })),
      },
      presetQuestions: presets,
    });
  }, [targetRecord, partnerRecord, rankingResults, currentPairItem, scoreMetric, metricName, resolvedCombine, setAnalyticsContext, language, t]);

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-5 overflow-y-auto bg-slate-50">
      <div className="flex items-center">
        <BackButton label={t('common.backToMacro', '学習支援メニューに戻る')} fallbackHref="/macro" />
      </div>

      {/* ヘッダーカード */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {t('macro.bestPair.title', 'ベスト・ペア検索')}
              </h1>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                <span>{t('macro.bestPair.badge', '1対1 最大相乗効果')}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t('macro.bestPair.subtitle', '基準組織に相手を1つ加えたとき、汎用スキルの不足を最も埋める（カバー率）、または理想ベクトルに最も近づく（バランス度）相手を探索')}
            </p>
          </div>
        </div>
      </div>

      {/* データベース接続エラー時の警告バナー */}
      {dbError && (
        <DatabaseErrorBanner error={dbError} />
      )}

      {/* コントロールパネル */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        {/* 基準対象選択 */}
        <div className="p-4 rounded-lg bg-orange-50/50 border border-orange-200 space-y-3">
          {/* 大学フィルター (学部・学科レベル時) */}
          {level !== 'university' && universityNames.length > 0 && (
            <div className="pb-2 border-b border-orange-200/60">
              <SearchableSelect
                label={t('macro.bestPair.filterUniv', '大学で絞り込み:')}
                {...univSelectProps(universityNames, selectedUnivFilter, allUnivLabel, handleUnivFilterChange)}
                placeholder={t('complementation.searchPlaceholder', '大学名を検索・選択...')}
                colorScheme="orange"
              />
            </div>
          )}

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-orange-600" />
                {t('macro.bestPair.selectBaseOrg', '基準組織を選択:')}
              </span>
              {targetRecord && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-orange-700 font-medium">
                    {targetRecord.subject_count} {t('common.subjectCount', '科目')}
                  </span>
                  <AcademicUnitInfoButton
                    target={{
                      id: targetRecord.id,
                      universityName: targetRecord.university_name,
                      facultyName: getFacultyName(targetRecord),
                      departmentName: getDepartmentName(targetRecord),
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
              className="w-full px-3.5 py-2 text-sm bg-white border border-orange-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-xs"
            >
              {filteredDataList.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatLabel(item)} ({item.subject_count} {t('common.subjectCount', '科目')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 条件設定 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* 評価指標 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-orange-500" /> {t('macro.metric.label', '評価指標:')}
            </label>
            <select
              value={scoreMetric}
              onChange={(e) => setScoreMetric(e.target.value as MacroScoreMetric)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="coverage">{t('macro.metric.optionCoverage', 'カバー率 (不足をどれだけ埋めたか)')}</option>
              <option value="balance">{t('macro.metric.optionBalance', 'バランス度 (理想ベクトルへの近さ)')}</option>
            </select>
          </div>

          {/* 結合方法（カバー率のときは最大値結合に固定） */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-orange-500" /> {t('macro.bestPair.combineMethod', '結合方法:')}
            </label>
            <select
              value={resolvedCombine}
              onChange={(e) => setCombineMethod(e.target.value as 'max' | 'mean')}
              disabled={scoreMetric === 'coverage'}
              title={scoreMetric === 'coverage' ? t('macro.metric.maxFixed', 'カバー率では最大値結合に固定') : undefined}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="max">{t('macro.bestPair.methodMax', '最大値結合 (各組織の強みを活かす)')}</option>
              <option value="mean">{t('macro.bestPair.methodMean', '平均値結合 (チーム全体の底上げ)')}</option>
            </select>
          </div>

          {/* 大学絞り込み */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> {t('macro.bestPair.filterUniv', '大学絞り込み:')}
            </label>
            <select
              value={filterUniversity}
              onChange={(e) => setFilterUniversity(e.target.value as TargetFilter)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="all">{t('macro.bestPair.filterAll', 'すべての大学')}</option>
              <option value="diff">{t('macro.bestPair.filterDiff', '他大学のみ (同一大学除く)')}</option>
              <option value="same">{t('macro.bestPair.filterSame', '同一大学のみ')}</option>
            </select>
          </div>

          {/* 階層レベル */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-500" /> {t('macro.bestPair.hierarchy', '階層レベル:')}
            </label>
            <select
              value={level}
              onChange={(e) => handleLevelChange(e.target.value as HierarchyLevel)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="department">{t('common.departmentLevel', '学科レベル')}</option>
              <option value="faculty">{t('common.facultyLevel', '学部レベル')}</option>
              <option value="university">{t('common.universityLevel', '大学レベル')}</option>
            </select>
          </div>
        </div>

        <p className="text-2xs text-slate-500">
          {t('macro.metric.targetGeneral', 'スコアの対象は汎用スキル12項目です（レーダーチャートは知識・汎用の両方を表示します）。')}
        </p>
      </div>

      {/* スコア向上サマリーカード */}
      {currentPairItem && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border shadow-2xs ${scoreMetric === 'coverage' ? 'bg-orange-50/20 border-orange-200' : 'bg-white border-slate-200'}`}>
            <span className={`text-xs font-bold ${scoreMetric === 'coverage' ? 'text-orange-700' : 'text-slate-500'}`}>{t('macro.metric.coverage', 'カバー率')}</span>
            <div className={`text-xl font-bold mt-1 ${scoreMetric === 'coverage' ? 'text-orange-600' : 'text-slate-800'}`}>
              {(currentPairItem.coverage * 100).toFixed(1)}%
            </div>
            <span className="text-2xs text-slate-500 mt-0.5 block">{coverageDesc}</span>
            {scoreMetric === 'balance' && resolvedCombine === 'mean' && (
              <span className="text-2xs text-slate-400 mt-0.5 block">{t('macro.metric.coverageAlwaysMax', 'カバー率は常に最大値結合で計算します')}</span>
            )}
          </div>

          <div className={`p-4 rounded-xl border shadow-2xs ${scoreMetric === 'balance' ? 'bg-orange-50/20 border-orange-200' : 'bg-white border-slate-200'}`}>
            <span className={`text-xs font-bold flex items-center gap-1 ${scoreMetric === 'balance' ? 'text-orange-700' : 'text-slate-500'}`}>
              <TrendingUp className="w-3.5 h-3.5" /> {t('macro.metric.balance', 'バランス度')}
            </span>
            <div className={`text-xl font-bold mt-1 ${scoreMetric === 'balance' ? 'text-orange-600' : 'text-slate-800'}`}>
              {(currentPairItem.balance * 100).toFixed(1)}%
            </div>
            <span className="text-2xs text-slate-500 mt-0.5 block">{t('macro.metric.balanceDesc', '結合後の汎用スキルと理想ベクトル（均等）のコサイン類似度')}</span>
            <span className="text-2xs text-slate-400 mt-0.5 block">
              {t('macro.bestPair.balanceChange', '基準の単独 {base}% から {diff}（{method}）')
                .replace('{base}', (currentPairItem.baseline_balance * 100).toFixed(1))
                .replace('{diff}', signedPt(currentPairItem.balance_improvement, 1))
                .replace('{method}', combineName)}
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-bold">{t('macro.metric.simA', '専門の近さ')}</span>
            <div className="text-xl font-bold text-slate-800 mt-1">
              {currentPairItem.sim_a.toFixed(3)}
            </div>
            <span className="text-2xs text-slate-500 mt-0.5 block">{t('macro.metric.simADesc', '基準の知識スキルと、結合後（最大値）の知識スキルのコサイン類似度。順位には使いません')}</span>
          </div>
        </div>
      )}

      {/* レーダーチャート */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <RadarIcon className="w-5 h-5 text-orange-600" />
              {t('macro.bestPair.chartTitle', 'ベストペア結合 レーダーチャート比較')} ({metricName})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('charts.radar.baseOrg', '基準')}: <span className="font-semibold text-teal-700">{formatLabel(targetRecord)}</span>
              {partnerRecord && (
                <>
                  {' '}× {t('macro.bestPair.partnerCandidate', 'パートナー')}: <span className="font-semibold text-orange-700">{formatLabel(partnerRecord)}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DualChartExportButton
              chart1={{
                title: `${t('charts.radar.knowledgeTitle')} (${resolvedCombine === 'max' ? 'Max' : 'Mean'})`,
                indicators: knowledgeIndicators,
                seriesData: knowledgeSeries,
              }}
              chart2={{
                title: `${t('charts.radar.generalTitle')} (${resolvedCombine === 'max' ? 'Max' : 'Mean'})`,
                indicators: generalIndicators,
                seriesData: generalSeries,
              }}
              mainTitle={`${formatLabel(targetRecord)} × ${partnerRecord ? formatLabel(partnerRecord) : ''} ${t('macro.bestPair.chartTitle')}`}
              filename={`best_pair_${formatLabel(targetRecord)}_${partnerRecord ? formatLabel(partnerRecord) : ''}.png`}
            />
          </div>
        </div>

        {/* 2分割レーダーチャート (内部凡例は非表示にして大きく表示) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[440px]">
          {/* 知識関連スキル (左) */}
          <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/20 shadow-2xs">
            <RadarChart
              title={`${t('charts.radar.knowledgeTitle')} (${resolvedCombine === 'max' ? 'Max' : 'Mean'})`}
              indicators={knowledgeIndicators}
              seriesData={knowledgeSeries}
              height={440}
              showLegend={false}
            />
          </div>

          {/* 汎用スキル (右) */}
          <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/20 shadow-2xs">
            <RadarChart
              title={`${t('charts.radar.generalTitle')} (${resolvedCombine === 'max' ? 'Max' : 'Mean'})`}
              indicators={generalIndicators}
              seriesData={generalSeries}
              height={440}
              showLegend={false}
            />
          </div>
        </div>

        {/* 2つのレーダーチャート共通の凡例（中央に1つだけ大きめに表示） */}
        <div className="pt-2 border-t border-slate-100">
          <RadarLegend items={legendItems} />
        </div>

        <div className="text-2xs text-slate-400 bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-100 flex items-center justify-between">
          <span>💡 {scoreMetric === 'coverage'
            ? t('macro.bestPair.combinedLineHintCoverage', '緑の線は、カバー率の計算と同じく最大値結合のまま（正規化し直さない値）です。')
            : t('macro.bestPair.combinedLineHint', '結合方法「{method}」による合成結果（正規化し直した値）が緑の線で表示されます。').replace('{method}', combineName)}</span>
          <span>{t('macro.bestPair.combineMethod', '結合方式:')} <strong className="text-slate-600 font-semibold">{resolvedCombine === 'max' ? 'Max' : 'Mean'}</strong></span>
        </div>
      </div>

      {/* ランキングテーブル */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {t('macro.bestPair.pairRankingTitle', 'ベスト・ペア候補 ランキング (Top 20)')} - {metricName}
            </h3>
            <p className="text-xs text-slate-500">
              {t('macro.bestPair.rankingDesc', '行をクリックすると、上部のレーダーチャートに対比表示されます')}
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {candidates.length} {t('common.subjectCount', '件')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-semibold">
                <th className="py-2.5 px-3 w-14 text-center">{t('macro.bestPair.tableRank', '順位')}</th>
                <th className="py-2.5 px-3">{t('macro.bestPair.tableOrg', '大学・学部・学科名')}</th>
                <th className="py-2.5 px-3 w-24 text-right">{t('macro.metric.coverage', 'カバー率')}</th>
                <th className="py-2.5 px-3 w-24 text-right">{t('macro.metric.balance', 'バランス度')}</th>
                <th className="py-2.5 px-3 w-28 text-right">{t('macro.bestPair.tableDiff', 'バランス度の向上幅 (Δ)')}</th>
                <th className="py-2.5 px-3 w-24 text-right">{t('macro.metric.simA', '専門の近さ')}</th>
                <th className="py-2.5 px-3 w-24 text-center">{t('macro.bestPair.tableAction', 'アクション')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {rankingResults.map((item) => {
                const isSelected = item.id === selectedPartnerId;
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedPartnerId(item.id)}
                    className={`cursor-pointer transition ${
                      isSelected ? 'bg-orange-50/80 font-medium' : 'hover:bg-slate-50/80'
                    }`}
                  >
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
                      <div className="flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {(() => {
                          const cand = candidates.find((c) => c.id === item.id);
                          return (
                            <AcademicUnitInfoButton
                              target={{
                                id: item.id,
                                universityName: cand?.university_name || item.label,
                                facultyName: cand?.faculty_name,
                                departmentName: cand?.department_name,
                                subjectCount: cand?.subject_count,
                                websiteUrl: cand?.website_url,
                                level,
                              }}
                              variant="icon"
                              size="xs"
                            />
                          );
                        })()}
                      </div>
                    </td>
                    <td className={`py-2.5 px-3 text-right ${scoreMetric === 'coverage' ? 'font-bold text-orange-700' : 'text-slate-600'}`}>
                      {(item.coverage * 100).toFixed(2)}%
                    </td>
                    <td className={`py-2.5 px-3 text-right ${scoreMetric === 'balance' ? 'font-bold text-orange-700' : 'text-slate-600'}`}>
                      {(item.balance * 100).toFixed(2)}%
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${item.balance_improvement >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {signedPt(item.balance_improvement, 2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {item.sim_a.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPartnerId(item.id);
                        }}
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                        }`}
                      >
                        <span>{isSelected ? t('macro.bestPair.showing', '表示中') : t('macro.bestPair.select', '選択')}</span>
                      </button>
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

export default function BestPairPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    }>
      <BestPairContent />
    </Suspense>
  );
}
