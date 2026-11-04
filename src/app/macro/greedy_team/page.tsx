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
  getRadarIndicators,
  GreedyStopReason,
  MacroGreedyResult,
  MacroScoreMetric,
  normalizeL1,
  resolveCombineMethod,
  runMacroGreedyTeamBuild,
  combineMultipleVectors,
  getSkillName,
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
  UserPlus, 
  CheckCircle2, 
  BarChart2, 
  Filter, 
  GraduationCap, 
  Layers, 
  Radar as RadarIcon, 
  TrendingUp,
  Sliders,
  Users,
  Target,
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
const toFinalTeamLine = (vectors: number[][], metric: MacroScoreMetric, combine: 'max' | 'mean') => {
  if (vectors.length === 0) return [];
  const combined = combineMultipleVectors(vectors, combine);
  return metric === 'coverage' ? combined : toPercent(combined);
};

// 終了の理由の t() フォールバック
const STOP_REASON_FALLBACK: Record<GreedyStopReason, string> = {
  complete: 'カバー率が 99.9% 以上になったため終了',
  target: '目標に到達したため終了',
  fixed: '指定の数まで追加して終了',
  max_steps: '追加の上限に達したため終了',
  no_improvement: '最良の候補でも改善がないため終了',
  no_candidate: '追加できる候補がないため終了',
};

function GreedyTeamContent() {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const queryDept = searchParams.get('dept');
  const queryUniv = searchParams.get('univ');
  const { setAnalyticsContext } = useAnalyticsContext();

  const [level, setLevel] = useState<HierarchyLevel>('department');
  const [dataList, setDataList] = useState<SkillVectorRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, setIsUsingMock] = useState<boolean>(false);
  const [dbError, setDbError] = useState<DbErrorInfo | null>(null);

  // 初期メンバー
  const [initialId, setInitialId] = useState<string>('');

  // 探索モード
  const [searchMode, setSearchMode] = useState<'team_size' | 'threshold'>('threshold');
  const [targetTeamSize, setTargetTeamSize] = useState<number>(4);
  // 目標の初期値。セレクトの選択肢（0.85 / 0.90 / 0.93 / 0.95）のいずれかに揃える。
  // runGreedyTeamBuild の既定値（0.95）は呼び出し側が閾値を渡さないときのフォールバックで、
  // この画面は常に targetThreshold を渡すため、画面上の初期値はこちら（0.90）が優先される。
  const [targetThreshold, setTargetThreshold] = useState<number>(0.90);

  // 結合・計算パラメータ
  const [scoreMetric, setScoreMetric] = useState<MacroScoreMetric>('coverage');
  const [combineMethod, setCombineMethod] = useState<'max' | 'mean'>('max');
  const [filterUniversity] = useState<TargetFilter>('all');

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
  const initKey = JSON.stringify([queryDept, queryUniv]);
  const [appliedInit, setAppliedInit] = useState<{ data: SkillVectorRecord[]; key: string } | null>(null);
  if (dataList.length > 0 && (appliedInit?.data !== dataList || appliedInit.key !== initKey)) {
    setAppliedInit({ data: dataList, key: initKey });
    let matchedId = '';
    if (queryDept) {
      const found = dataList.find((item) => {
        const mDept = getDepartmentName(item) === queryDept || getFacultyName(item) === queryDept || item.university_name === queryDept;
        if (queryUniv) return mDept && item.university_name === queryUniv;
        return mDept;
      });
      if (found) matchedId = found.id;
    }
    const finalId = matchedId || dataList[0].id;
    setInitialId(finalId);

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
    setInitialId((prev) => keepOrFirstId(filterByUniversity(dataList, next, level), prev));
  };

  const initialRecord = useMemo(() => {
    return filteredDataList.find((d) => d.id === initialId) || filteredDataList[0] || dataList[0];
  }, [filteredDataList, dataList, initialId]);

  const formatLabel = (rec?: SkillVectorRecord) => {
    if (!rec) return '';
    const dept = getDepartmentName(rec);
    const fac = getFacultyName(rec);
    if (dept) return `【${rec.university_name}】 ${dept}`;
    if (fac) return `【${rec.university_name}】 ${fac}`;
    return `【${rec.university_name}】`;
  };

  const levelUnit = useMemo(() => {
    if (level === 'faculty') return t('macro.greedyTeam.unitFaculty', '学部');
    if (level === 'university') return t('macro.greedyTeam.unitUniversity', '大学');
    return t('macro.greedyTeam.unitDepartment', '学科');
  }, [level, t]);

  const candidates = useMemo(() => {
    if (!initialRecord) return [];
    let filtered = dataList.filter((d) => d.id !== initialRecord.id);
    if (filterUniversity === 'same') {
      filtered = filtered.filter((d) => d.university_name === initialRecord.university_name);
    } else if (filterUniversity === 'diff') {
      filtered = filtered.filter((d) => d.university_name !== initialRecord.university_name);
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
  }, [dataList, initialRecord, filterUniversity]);

  // Greedyチーム編成の実行（スコアは汎用12軸で計算する）
  const teamResult: MacroGreedyResult | null = useMemo(() => {
    if (!initialRecord || candidates.length === 0) return null;
    return runMacroGreedyTeamBuild(
      {
        id: initialRecord.id,
        label: formatLabel(initialRecord),
        university_name: initialRecord.university_name,
        vector_A: initialRecord.knowledge_vector || [],
        vector_B: initialRecord.general_vector || [],
      },
      candidates,
      {
        scoreMetric,
        searchMode,
        targetTeamSize,
        targetThreshold,
        combineMethod: resolvedCombine,
      }
    );
  }, [
    initialRecord,
    candidates,
    scoreMetric,
    searchMode,
    targetTeamSize,
    targetThreshold,
    resolvedCombine,
  ]);

  // レーダーチャート用（知識12項目 ＆ 汎用12項目の2分割）
  const knowledgeIndicators = useMemo(() => getRadarIndicators('knowledge', { max: 100, language }), [language]);
  const generalIndicators = useMemo(() => getRadarIndicators('general', { max: 100, language }), [language]);

  // チームメンバー全員の知識・汎用ベクトル
  const teamKnowledgeVectors = useMemo(() => {
    if (!teamResult) return [];
    return teamResult.teamMembers.map((m) => {
      const rec = dataList.find((d) => d.id === m.id);
      return toPercent(rec?.knowledge_vector || []);
    });
  }, [teamResult, dataList]);

  const teamGeneralVectors = useMemo(() => {
    if (!teamResult) return [];
    return teamResult.teamMembers.map((m) => {
      const rec = dataList.find((d) => d.id === m.id);
      return toPercent(rec?.general_vector || []);
    });
  }, [teamResult, dataList]);

  // チーム全体の合成（知識・汎用それぞれ）
  const finalTeamKVec = useMemo(() => toFinalTeamLine(teamKnowledgeVectors, scoreMetric, resolvedCombine), [teamKnowledgeVectors, scoreMetric, resolvedCombine]);
  const finalTeamGVec = useMemo(() => toFinalTeamLine(teamGeneralVectors, scoreMetric, resolvedCombine), [teamGeneralVectors, scoreMetric, resolvedCombine]);

  // 評価指標の名前と説明、終了の理由
  const metricName = scoreMetric === 'coverage' ? t('macro.metric.coverage', 'カバー率') : t('macro.metric.balance', 'バランス度');
  const unitName = t(`macro.metric.units.${level}`, level === 'faculty' ? '学部' : level === 'university' ? '大学' : '学科');
  const coverageDesc = t('macro.metric.coverageDesc', '理想までの不足のうち、追加した{unit}が埋めた割合').replace('{unit}', unitName);
  const balanceDesc = t('macro.metric.balanceDesc', '結合後の汎用スキルと理想ベクトル（均等）のコサイン類似度');
  const combineName = resolvedCombine === 'max' ? t('macro.metric.combineMax', '最大値結合') : t('macro.metric.combineMean', '平均値結合');
  const stopReasonText = teamResult
    ? t(`macro.greedyTeam.stopReasons.${teamResult.stopReason}`, STOP_REASON_FALLBACK[teamResult.stopReason])
    : '';
  // 目標モードで目標に届かなかった場合（大学の単位など）を区別して表示する
  const missedTarget = !!teamResult && searchMode === 'threshold' && !teamResult.reachedThreshold;

  const getShortLabel = (label: string) => {
    const match = label.match(/【.*?】\s*(.+)/);
    return match ? match[1] : label;
  };

  const knowledgeSeries: RadarSeriesItem[] = useMemo(() => {
    if (!teamResult || teamKnowledgeVectors.length === 0) return [];
    const list: RadarSeriesItem[] = [
      {
        name: `${t('charts.radar.origin')}: ${getShortLabel(teamResult.initialMember.label)}`,
        value: teamKnowledgeVectors[0] || [],
        color: '#009688', // teal
      },
      {
        name: `${t('charts.radar.teamCombined')} (${teamResult.teamMembers.length}${levelUnit})`,
        value: finalTeamKVec,
        color: '#059669',
      },
    ];
    const partnerColors = ['#e0532b', '#ea580c']; // terracotta & bright orange
    teamResult.steps.slice(0, 2).forEach((step, idx) => {
      const memberIdx = step.step;
      if (teamKnowledgeVectors[memberIdx]) {
        list.push({
          name: `+Step ${step.step}: ${getShortLabel(step.addedMember.label)}`,
          value: teamKnowledgeVectors[memberIdx],
          color: partnerColors[idx % partnerColors.length],
        });
      }
    });
    return list;
  }, [teamResult, teamKnowledgeVectors, finalTeamKVec, levelUnit, t]);

  const generalSeries: RadarSeriesItem[] = useMemo(() => {
    if (!teamResult || teamGeneralVectors.length === 0) return [];
    const list: RadarSeriesItem[] = [
      {
        name: `${t('charts.radar.origin')}: ${getShortLabel(teamResult.initialMember.label)}`,
        value: teamGeneralVectors[0] || [],
        color: '#009688',
      },
      {
        name: `${t('charts.radar.teamCombined')} (${teamResult.teamMembers.length}${levelUnit})`,
        value: finalTeamGVec,
        color: '#059669',
      },
    ];
    const partnerColors = ['#e0532b', '#ea580c'];
    teamResult.steps.slice(0, 2).forEach((step, idx) => {
      const memberIdx = step.step;
      if (teamGeneralVectors[memberIdx]) {
        list.push({
          name: `+Step ${step.step}: ${getShortLabel(step.addedMember.label)}`,
          value: teamGeneralVectors[memberIdx],
          color: partnerColors[idx % partnerColors.length],
        });
      }
    });
    return list;
  }, [teamResult, teamGeneralVectors, finalTeamGVec, levelUnit, t]);

  // 2つのチャート共通の凡例アイテム
  const legendItems: RadarLegendItem[] = useMemo(() => {
    if (!teamResult) return [];
    const list: RadarLegendItem[] = [
      {
        name: `${t('charts.radar.origin')}: ${getShortLabel(teamResult.initialMember.label)}`,
        color: '#009688',
        subLabel: t('charts.radar.baseOrg'),
      },
    ];

    const partnerColors = ['#e0532b', '#ea580c'];
    teamResult.steps.slice(0, 2).forEach((step, idx) => {
      list.push({
        name: `+Step ${step.step}: ${getShortLabel(step.addedMember.label)}`,
        color: partnerColors[idx % partnerColors.length],
        subLabel: `+${(step.improvement * 100).toFixed(1)}pt`,
      });
    });

    list.push({
      name: `${t('charts.radar.teamCombined')} (${teamResult.teamMembers.length}${levelUnit})`,
      color: '#059669',
      subLabel: `${metricName} ${(teamResult.finalScore * 100).toFixed(1)}%`,
    });

    return list;
  }, [teamResult, levelUnit, metricName, t]);

  // AIコンテキスト共有
  useEffect(() => {
    if (!teamResult) return;
    const isEn = language === 'en';
    const initialLabel = teamResult.initialMember.label;

    const presets: string[] = [];
    if (isEn) {
      presets.push(`Why was the first partner chosen by the greedy algorithm for "${initialLabel}"?`);
      presets.push(`How does role division function across the organizations within this ${teamResult.teamMembers.length}-member team?`);
      presets.push(scoreMetric === 'coverage'
        ? `How does the team change between coverage and balance?`
        : `How does the optimal team strategy shift between Max Pooling and Mean Pooling?`);
      presets.push(`Why did the search stop here, and what would adding more members bring?`);
    } else {
      presets.push(`貪欲法で「${initialLabel}」に最初に選ばれたパートナーの選定理由は？`);
      presets.push(`チーム人数（${teamResult.teamMembers.length}名）で各組織の役割分担はどう機能しますか？`);
      presets.push(scoreMetric === 'coverage'
        ? `カバー率とバランス度でチーム編成はどう変わる？`
        : `最大値結合(Max)と平均値結合(Mean)でチーム編成の最適戦略はどう変わる？`);
      presets.push(`ここで探索が終了した理由と、これ以上メンバーを加えた場合の効果は？`);
    }

    const combineLabel = resolvedCombine === 'max'
      ? (isEn ? 'Max Pooling' : '最大値結合')
      : (isEn ? 'Mean Pooling' : '平均値結合');
    const targetSkillsLabel = isEn ? 'Generic skills (12 axes)' : '汎用スキル（12軸）';
    const round4 = (v: number) => Number(v.toFixed(4));

    setAnalyticsContext({
      pageTitle: t('macro.greedyTeam.title', 'チーム編成支援'),
      pagePath: '/macro/greedy_team',
      primaryTarget: initialLabel,
      summaryText: isEn
        ? `Origin: ${initialLabel} Greedy Team Simulation (${teamResult.teamMembers.length} orgs including origin, ${metricName}: ${(teamResult.finalScore * 100).toFixed(1)}%)`
        : `起点: ${initialLabel} のGreedyチーム編成シミュレーション（起点を含め${teamResult.teamMembers.length}組織、${metricName}: ${(teamResult.finalScore * 100).toFixed(1)}%）`,
      details: {
        initial: initialLabel,
        teamSize: teamResult.teamMembers.length,
        addedCount: teamResult.steps.length,
        evaluationMetric: metricName,
        searchMode,
        targetThreshold: searchMode === 'threshold' ? targetThreshold : undefined,
        combineMethod: combineLabel,
        coverageCombine: isEn ? 'Coverage is always computed with Max Pooling' : 'カバー率は常に最大値結合で計算',
        targetSkills: targetSkillsLabel,
        baselineCoverage: round4(teamResult.baselineCoverage),
        finalCoverage: round4(teamResult.finalCoverage),
        baselineBalance: round4(teamResult.baselineBalance),
        finalBalance: round4(teamResult.finalBalance),
        finalDomainProximity: round4(teamResult.finalSimA),
        stopReason: teamResult.stopReason,
        stopReasonText,
        reachedTarget: searchMode === 'threshold' ? teamResult.reachedThreshold : undefined,
        teamMembers: teamResult.teamMembers.map((m) => m.label),
        steps: teamResult.steps.map((s) => ({
          step: s.step,
          added: s.addedMember.label,
          coverage: round4(s.coverage),
          balance: round4(s.balance),
          domainProximity: round4(s.sim_a),
          topReinforced: s.topReinforcedSkills.map((sk) => getSkillName(sk.code, language)).join(', '),
        })),
      },
      presetQuestions: presets,
    });
  }, [teamResult, scoreMetric, metricName, searchMode, targetThreshold, resolvedCombine, stopReasonText, setAnalyticsContext, language, t]);

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-5 overflow-y-auto bg-slate-50">
      <div className="flex items-center">
        <BackButton label={t('common.backToMacro', '学習支援メニューに戻る')} fallbackHref="/macro" />
      </div>

      {/* ヘッダーカード */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {t('macro.greedyTeam.title', 'チーム編成支援 (Greedy Team Build)')}
              </h1>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                <span>{t('macro.greedyTeam.badge', '貪欲法による最適編成')}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t('macro.greedyTeam.subtitle', '目標または指定の数に達するまで、評価指標を最も高める相手を1組織ずつ追加するシミュレーション（スコアは汎用スキル12項目）')}
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
        {/* 起点組織選択 */}
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
                {t('macro.greedyTeam.originOrg', '起点の組織（リーダー組織）を選択:')}
              </span>
              {initialRecord && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-orange-700 font-medium">
                    {initialRecord.subject_count} {t('common.subjectCount', '科目')}
                  </span>
                  <AcademicUnitInfoButton
                    target={{
                      id: initialRecord.id,
                      universityName: initialRecord.university_name,
                      facultyName: getFacultyName(initialRecord),
                      departmentName: getDepartmentName(initialRecord),
                      subjectCount: initialRecord.subject_count,
                      websiteUrl: initialRecord.website_url,
                      level,
                      knowledgeVector: initialRecord.knowledge_vector,
                      generalVector: initialRecord.general_vector,
                    }}
                    variant="badge"
                  />
                </div>
              )}
            </div>
            <select
              value={initialId}
              onChange={(e) => setInitialId(e.target.value)}
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

        {/* 探索モードとパラメータ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* 評価指標 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-orange-500" /> {t('macro.metric.label', '評価指標:')}
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

          {/* 探索モード */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-orange-500" /> {t('macro.greedyTeam.searchMode', '探索モード:')}
            </label>
            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value as 'team_size' | 'threshold')}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="threshold">{t('macro.greedyTeam.modeThreshold', '目標モード (目標到達まで)')}</option>
              <option value="team_size">{t('macro.greedyTeam.modeTeamSize', '人数指定モード (固定人数)')}</option>
            </select>
          </div>

          {/* 人数 or 閾値設定 */}
          {searchMode === 'team_size' ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-orange-500" /> {t('macro.greedyTeam.targetSize', '目標チーム人数:')}
              </label>
              <select
                value={targetTeamSize}
                onChange={(e) => setTargetTeamSize(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value={2}>{language === 'en' ? `2-${levelUnit} Team (+1 ${levelUnit})` : `2${levelUnit}チーム (+1${levelUnit})`}</option>
                <option value={3}>{language === 'en' ? `3-${levelUnit} Team (+2 ${levelUnit})` : `3${levelUnit}チーム (+2${levelUnit})`}</option>
                <option value={4}>{language === 'en' ? `4-${levelUnit} Team` : `4${levelUnit}チーム`}</option>
                <option value={5}>{language === 'en' ? `5-${levelUnit} Team` : `5${levelUnit}チーム`}</option>
                <option value={6}>{language === 'en' ? `6-${levelUnit} Team` : `6${levelUnit}チーム`}</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-orange-500" /> {t('macro.greedyTeam.targetThreshold', '目標 (評価指標の値):')}
              </label>
              <select
                value={targetThreshold}
                onChange={(e) => setTargetThreshold(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value={0.85}>85%</option>
                <option value={0.90}>90%</option>
                <option value={0.93}>93%</option>
                <option value={0.95}>95%</option>
              </select>
            </div>
          )}

          {/* 結合方法 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-slate-500" /> {t('macro.greedyTeam.combineMethod', '結合方法:')}
            </label>
            <select
              value={resolvedCombine}
              onChange={(e) => setCombineMethod(e.target.value as 'max' | 'mean')}
              disabled={scoreMetric === 'coverage'}
              title={scoreMetric === 'coverage' ? t('macro.metric.maxFixed', 'カバー率では最大値結合に固定') : undefined}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="max">{t('macro.greedyTeam.methodMax', '最大値結合 (強み集約)')}</option>
              <option value="mean">{t('macro.greedyTeam.methodMean', '平均値結合 (総合底上げ)')}</option>
            </select>
          </div>

          {/* 階層レベル */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> {t('macro.greedyTeam.hierarchy', '階層レベル:')}
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

      {/* サマリーカード */}
      {teamResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-orange-200 shadow-2xs bg-orange-50/20">
            <span className="text-xs text-orange-700 font-bold">{t('macro.greedyTeam.finalScoreLabel', '最終 {metric}').replace('{metric}', metricName)}</span>
            <div className="text-xl font-bold text-orange-600 mt-1">
              {(teamResult.finalScore * 100).toFixed(1)}%
            </div>
            <span className="text-2xs text-orange-600/80 mt-0.5 block">
              {t('macro.greedyTeam.baselineToFinal', '起点のみ {base}% から +{diff} pt')
                .replace('{base}', (teamResult.baselineScore * 100).toFixed(1))
                .replace('{diff}', ((teamResult.finalScore - teamResult.baselineScore) * 100).toFixed(1))}
            </span>
            <span className="text-2xs text-slate-500 mt-0.5 block">{scoreMetric === 'coverage' ? coverageDesc : balanceDesc}</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {scoreMetric === 'coverage' ? t('macro.metric.balance', 'バランス度') : t('macro.metric.coverage', 'カバー率')}
            </span>
            <div className="text-xl font-bold text-slate-800 mt-1">
              {((scoreMetric === 'coverage' ? teamResult.finalBalance : teamResult.finalCoverage) * 100).toFixed(1)}%
            </div>
            <span className="text-2xs text-slate-500 mt-0.5 block">{scoreMetric === 'coverage' ? balanceDesc : coverageDesc}</span>
            {scoreMetric === 'balance' && resolvedCombine === 'mean' && (
              <span className="text-2xs text-slate-400 mt-0.5 block">{t('macro.metric.coverageAlwaysMax', 'カバー率は常に最大値結合で計算します')}</span>
            )}
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-bold">{t('macro.metric.simA', '専門の近さ')}</span>
            <div className="text-xl font-bold text-slate-800 mt-1">
              {teamResult.finalSimA.toFixed(3)}
            </div>
            <span className="text-2xs text-slate-500 mt-0.5 block">{t('macro.metric.simADesc', '基準の知識スキルと、結合後（最大値）の知識スキルのコサイン類似度。順位には使いません')}</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium">{t('macro.greedyTeam.status', '編成ステータス')}</span>
            <div className="text-sm font-bold text-slate-800 mt-2 flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${missedTarget ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
              <span>{stopReasonText}</span>
            </div>
            {missedTarget && (
              <span className="text-2xs text-orange-600 mt-0.5 block">
                {t('macro.greedyTeam.targetMissed', '目標 {target}% には届きませんでした').replace('{target}', (targetThreshold * 100).toFixed(0))}
              </span>
            )}
            <span className="text-2xs text-slate-400 mt-0.5 block">
              {t('macro.greedyTeam.teamSizeNote', '起点＋追加 {added}{unit}').replace('{added}', String(teamResult.steps.length)).replace('{unit}', levelUnit)} / {combineName}
            </span>
          </div>
        </div>
      )}

      {/* チーム編成メンバー一覧バッジ */}
      {teamResult && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-orange-600" />
            {t('macro.greedyTeam.teamMembersTitle', '編成されたチームメンバー')} ({teamResult.teamMembers.length}{levelUnit}):
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {teamResult.teamMembers.map((member, index) => (
              <div
                key={member.id}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  index === 0
                    ? 'bg-teal-50 text-teal-700 border-teal-200 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span className="text-2xs px-1.5 py-0.2 rounded-full bg-white font-bold border border-slate-200">
                  {index === 0 ? t('macro.greedyTeam.initialOrigin', '起点') : `#${index + 1}`}
                </span>
                <span>{member.label}</span>
                {(() => {
                  const cand = member.id === initialRecord.id 
                    ? initialRecord 
                    : candidates.find((c) => c.id === member.id);
                  return (
                    <AcademicUnitInfoButton
                      target={{
                        id: member.id,
                        universityName: cand?.university_name || member.label,
                        facultyName: getFacultyName(cand),
                        departmentName: getDepartmentName(cand),
                        subjectCount: cand?.subject_count,
                        websiteUrl: cand?.website_url,
                        level,
                      }}
                      variant="icon"
                      size="2xs"
                    />
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* レーダーチャート */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <RadarIcon className="w-5 h-5 text-orange-600" />
              {t('macro.greedyTeam.chartTitle', 'チームスキル推移 レーダーチャート')} ({metricName})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('macro.greedyTeam.chartSubtitle', '起点単体 vs 各ステップ追加メンバー vs 最終チーム合成ベクトル')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DualChartExportButton
              chart1={{
                title: `${t('charts.radar.knowledgeTitle')} (${teamResult ? teamResult.teamMembers.length : 0}${levelUnit} ${resolvedCombine === 'max' ? 'Max' : 'Mean'})`,
                indicators: knowledgeIndicators,
                seriesData: knowledgeSeries,
              }}
              chart2={{
                title: `${t('charts.radar.generalTitle')} (${teamResult ? teamResult.teamMembers.length : 0}${levelUnit} ${resolvedCombine === 'max' ? 'Max' : 'Mean'})`,
                indicators: generalIndicators,
                seriesData: generalSeries,
              }}
              mainTitle={`${initialRecord ? formatLabel(initialRecord) : ''} ${t('macro.greedyTeam.chartTitle')}`}
              filename={`greedy_team_${initialRecord ? formatLabel(initialRecord) : ''}.png`}
            />
          </div>
        </div>

        {/* 2分割レーダーチャート (内部凡例は非表示にして大きく表示) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[440px]">
          {/* 知識関連スキル (左) */}
          <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/20 shadow-2xs">
            <RadarChart
              title={`${t('charts.radar.knowledgeTitle')} (${teamResult ? teamResult.teamMembers.length : 0}${levelUnit} ${resolvedCombine === 'max' ? 'Max' : 'Mean'})`}
              indicators={knowledgeIndicators}
              seriesData={knowledgeSeries}
              height={440}
              showLegend={false}
            />
          </div>

          {/* 汎用スキル (右) */}
          <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/20 shadow-2xs">
            <RadarChart
              title={`${t('charts.radar.generalTitle')} (${teamResult ? teamResult.teamMembers.length : 0}${levelUnit} ${resolvedCombine === 'max' ? 'Max' : 'Mean'})`}
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
          <span>💡 {t('macro.greedyTeam.hoverHint', '各グラフにマウスを重ねるとスキル別の詳細比率を確認できます。')} {scoreMetric === 'coverage'
            ? t('macro.bestPair.combinedLineHintCoverage', '緑の線は、カバー率の計算と同じく最大値結合のまま（正規化し直さない値）です。')
            : t('macro.greedyTeam.combinedLineHintBalance', '緑の線は結合後に正規化し直した値です。')}</span>
          <span>{t('macro.bestPair.combineMethod', '結合方式:')} <strong className="text-slate-600 font-semibold">{resolvedCombine === 'max' ? 'Max' : 'Mean'}</strong></span>
        </div>
      </div>

      {/* 貪欲法 ステップごとの追加履歴テーブル */}
      {teamResult && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {t('macro.greedyTeam.stepTableTitle', 'ステップごとの追加ログ ＆ スキル補強詳細')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('macro.greedyTeam.stepTableDesc', '貪欲法により、各ステップで評価指標（{metric}）を最も高くする組織が選定されています').replace('{metric}', metricName)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-semibold">
                  <th className="py-2.5 px-3 w-16 text-center">{t('macro.greedyTeam.tableRank', 'ステップ')}</th>
                  <th className="py-2.5 px-3">{t('macro.greedyTeam.tableOrg', '追加された組織')}</th>
                  <th className="py-2.5 px-3 w-24 text-right">{t('macro.metric.coverage', 'カバー率')}</th>
                  <th className="py-2.5 px-3 w-24 text-right">{t('macro.metric.balance', 'バランス度')}</th>
                  <th className="py-2.5 px-3 w-24 text-right">{t('macro.greedyTeam.tableDiff', '向上幅 (Δ)')}</th>
                  <th className="py-2.5 px-3 w-24 text-right">{t('macro.metric.simA', '専門の近さ')}</th>
                  <th className="py-2.5 px-3">{scoreMetric === 'coverage'
                    ? t('macro.greedyTeam.tableTopSkillsCoverage', '特に不足を埋めたスキル Top 3')
                    : t('macro.greedyTeam.tableTopSkills', '特に大きく強化されたスキル Top 3')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {/* Step 0: 起点組織 */}
                <tr className="bg-teal-50/40">
                  <td className="py-2.5 px-3 text-center font-bold text-teal-700">
                    {t('macro.greedyTeam.initialOrigin', '起点')}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span>{teamResult.initialMember.label}</span>
                      <AcademicUnitInfoButton
                        target={{
                          id: initialRecord.id,
                          universityName: initialRecord.university_name,
                          facultyName: getFacultyName(initialRecord),
                          departmentName: getDepartmentName(initialRecord),
                          subjectCount: initialRecord.subject_count,
                          websiteUrl: initialRecord.website_url,
                          level,
                          knowledgeVector: initialRecord.knowledge_vector,
                          generalVector: initialRecord.general_vector,
                        }}
                        variant="icon"
                        size="xs"
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                    {(teamResult.baselineCoverage * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                    {(teamResult.baselineBalance * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    -
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    -
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {t('macro.greedyTeam.originInitialConfig', '基準初期スキル構成')}
                  </td>
                </tr>

                {/* 各ステップ */}
                {teamResult.steps.map((step) => (
                  <tr key={step.step} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 text-center font-bold text-orange-700">
                      Step {step.step}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span>{step.addedMember.label}</span>
                        {(() => {
                          const cand = candidates.find((c) => c.id === step.addedMember.id);
                          return (
                            <AcademicUnitInfoButton
                              target={{
                                id: step.addedMember.id,
                                universityName: cand?.university_name || step.addedMember.label,
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
                      {(step.coverage * 100).toFixed(2)}%
                    </td>
                    <td className={`py-2.5 px-3 text-right ${scoreMetric === 'balance' ? 'font-bold text-orange-700' : 'text-slate-600'}`}>
                      {(step.balance * 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                      +{(step.improvement * 100).toFixed(2)} pt
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {step.sim_a.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {step.topReinforcedSkills.map((sk, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            {getSkillName(sk.code, language)} (+{(sk.delta * 100).toFixed(1)}%)
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GreedyTeamPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    }>
      <GreedyTeamContent />
    </Suspense>
  );
}
