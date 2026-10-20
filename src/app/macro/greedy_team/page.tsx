"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  HierarchyLevel, 
  MetricType, 
  NormalizationType, 
  SkillVectorDepartment, 
  SkillVectorRecord, 
  VectorTarget 
} from '@/types/database';
import { 
  ALL_SKILLS, 
  combineVectors, 
  GENERAL_SKILLS, 
  getRadarIndicators, 
  GreedyTeamResult, 
  KNOWLEDGE_SKILLS, 
  normalizeL1, 
  runGreedyTeamBuild,
  combineMultipleVectors
} from '@/lib/vectorUtils';
import RadarChart, { RadarSeriesItem } from '@/components/charts/RadarChart';
import RadarLegend, { RadarLegendItem } from '@/components/charts/RadarLegend';
import BackButton from '@/components/BackButton';
import DatabaseErrorBanner from '@/components/DatabaseErrorBanner';
import { useAnalyticsContext } from '@/context/AnalyticsContext';
import { 
  UserPlus, 
  CheckCircle2, 
  Database, 
  AlertCircle, 
  BarChart2, 
  Filter, 
  GraduationCap, 
  Layers, 
  Radar as RadarIcon, 
  TrendingUp,
  Sliders,
  Users,
  Target,
  ArrowRight,
  Building2
} from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';
import AcademicUnitInfoButton from '@/components/AcademicUnitInfoButton';

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

function GreedyTeamContent() {
  const searchParams = useSearchParams();
  const queryDept = searchParams.get('dept');
  const queryUniv = searchParams.get('univ');
  const { setAnalyticsContext } = useAnalyticsContext();

  const [level, setLevel] = useState<HierarchyLevel>('department');
  const [dataList, setDataList] = useState<SkillVectorRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUsingMock, setIsUsingMock] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // 初期メンバー
  const [initialId, setInitialId] = useState<string>('');

  // 探索モード
  const [searchMode, setSearchMode] = useState<'team_size' | 'threshold'>('team_size');
  const [targetTeamSize, setTargetTeamSize] = useState<number>(4);
  const [targetThreshold, setTargetThreshold] = useState<number>(0.92);

  // 結合・計算パラメータ
  const [combineMethod, setCombineMethod] = useState<'max' | 'mean'>('max');
  const [vectorTarget, setVectorTarget] = useState<VectorTarget>('all');
  const [metric, setMetric] = useState<MetricType>('cosine');
  const [normalization, setNormalization] = useState<NormalizationType>('l1');
  const [filterUniversity, setFilterUniversity] = useState<TargetFilter>('all');

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
        console.error('Error fetching data:', err);
        setDbError(`データベース通信エラーが発生しました: ${err?.message || err}`);
        setDataList(MOCK_DEPARTMENTS);
        setIsUsingMock(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [level]);

  useEffect(() => {
    if (dataList.length === 0) return;
    let matchedId = '';
    if (queryDept) {
      const found = dataList.find((item: any) => {
        const mDept = item.department_name === queryDept || item.faculty_name === queryDept || item.university_name === queryDept;
        if (queryUniv) return mDept && item.university_name === queryUniv;
        return mDept;
      });
      if (found) matchedId = found.id;
    }
    setInitialId(matchedId || dataList[0].id);
  }, [dataList, queryDept, queryUniv]);

  // 大学フィルター (学部・学科レベル時)
  const [selectedUnivFilter, setSelectedUnivFilter] = useState<string>('全ての大学');

  // レベル変更時に大学フィルターをリセット
  useEffect(() => {
    setSelectedUnivFilter('全ての大学');
  }, [level]);

  // 大学一覧リスト
  const universityList = useMemo(() => {
    const set = new Set<string>();
    dataList.forEach((d) => {
      if (d.university_name) set.add(d.university_name);
    });
    return ['全ての大学', ...Array.from(set)];
  }, [dataList]);

  // 大学フィルター適用後の基準選択肢
  const filteredDataList = useMemo(() => {
    if (level === 'university' || selectedUnivFilter === '全ての大学') {
      return dataList;
    }
    return dataList.filter((d) => d.university_name === selectedUnivFilter);
  }, [dataList, level, selectedUnivFilter]);

  // フィルター切替時に未所属なら先頭を自動選択
  useEffect(() => {
    if (filteredDataList.length > 0 && !filteredDataList.some((d) => d.id === initialId)) {
      setInitialId(filteredDataList[0].id);
    }
  }, [filteredDataList, initialId]);

  const initialRecord = useMemo(() => {
    return filteredDataList.find((d) => d.id === initialId) || filteredDataList[0] || dataList[0];
  }, [filteredDataList, dataList, initialId]);

  const formatLabel = (rec?: SkillVectorRecord) => {
    if (!rec) return '';
    const dept = (rec as any).department_name;
    const fac = (rec as any).faculty_name;
    if (dept) return `【${rec.university_name}】 ${dept}`;
    if (fac) return `【${rec.university_name}】 ${fac}`;
    return `【${rec.university_name}】`;
  };

  const levelUnit = useMemo(() => {
    if (level === 'faculty') return '学部';
    if (level === 'university') return '大学';
    return '学科';
  }, [level]);

  const extractVector = (rec?: SkillVectorRecord): number[] => {
    if (!rec) return [];
    if (vectorTarget === 'knowledge') return rec.knowledge_vector || [];
    if (vectorTarget === 'general') return rec.general_vector || [];
    return combineVectors(rec.knowledge_vector || [], rec.general_vector || []);
  };

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
      faculty_name: (d as any).faculty_name,
      department_name: (d as any).department_name,
      vector: extractVector(d),
      subject_count: d.subject_count,
      website_url: d.website_url,
    }));
  }, [dataList, initialRecord, filterUniversity, vectorTarget]);

  const skillDefinitions = useMemo(() => {
    if (vectorTarget === 'knowledge') return KNOWLEDGE_SKILLS;
    if (vectorTarget === 'general') return GENERAL_SKILLS;
    return ALL_SKILLS;
  }, [vectorTarget]);

  // Greedyチーム編成の実行
  const teamResult: GreedyTeamResult | null = useMemo(() => {
    if (!initialRecord || candidates.length === 0) return null;
    return runGreedyTeamBuild(
      {
        id: initialRecord.id,
        label: formatLabel(initialRecord),
        university_name: initialRecord.university_name,
        vector: extractVector(initialRecord),
      },
      candidates,
      {
        searchMode,
        targetTeamSize,
        targetThreshold,
        combineMethod,
        metric,
        normalization,
        skillDefinitions,
      }
    );
  }, [
    initialRecord,
    candidates,
    searchMode,
    targetTeamSize,
    targetThreshold,
    combineMethod,
    metric,
    normalization,
    skillDefinitions,
  ]);

  // レーダーチャート用（知識12項目 ＆ 汎用12項目の2分割）
  const knowledgeIndicators = useMemo(() => getRadarIndicators('knowledge', { max: 100 }), []);
  const generalIndicators = useMemo(() => getRadarIndicators('general', { max: 100 }), []);
  const toPercent = (vec: number[] = []) => normalizeL1(vec).map((v) => Number((v * 100).toFixed(2)));

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
  const finalTeamKVec = useMemo(() => {
    if (teamKnowledgeVectors.length === 0) return [];
    const combined = combineMultipleVectors(teamKnowledgeVectors, combineMethod);
    return toPercent(combined);
  }, [teamKnowledgeVectors, combineMethod]);

  const finalTeamGVec = useMemo(() => {
    if (teamGeneralVectors.length === 0) return [];
    const combined = combineMultipleVectors(teamGeneralVectors, combineMethod);
    return toPercent(combined);
  }, [teamGeneralVectors, combineMethod]);

  const getShortLabel = (label: string) => {
    const match = label.match(/【.*?】\s*(.+)/);
    return match ? match[1] : label;
  };

  const knowledgeSeries: RadarSeriesItem[] = useMemo(() => {
    if (!teamResult || teamKnowledgeVectors.length === 0) return [];
    const list: RadarSeriesItem[] = [
      {
        name: `起点: ${getShortLabel(teamResult.initialMember.label)}`,
        value: teamKnowledgeVectors[0] || [],
        color: '#009688', // teal
      },
      {
        name: `チーム合成 (${teamResult.teamMembers.length}${levelUnit})`,
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
  }, [teamResult, teamKnowledgeVectors, finalTeamKVec, levelUnit]);

  const generalSeries: RadarSeriesItem[] = useMemo(() => {
    if (!teamResult || teamGeneralVectors.length === 0) return [];
    const list: RadarSeriesItem[] = [
      {
        name: `起点: ${getShortLabel(teamResult.initialMember.label)}`,
        value: teamGeneralVectors[0] || [],
        color: '#009688',
      },
      {
        name: `チーム合成 (${teamResult.teamMembers.length}${levelUnit})`,
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
  }, [teamResult, teamGeneralVectors, finalTeamGVec, levelUnit]);

  // 2つのチャート共通の凡例アイテム
  const legendItems: RadarLegendItem[] = useMemo(() => {
    if (!teamResult) return [];
    const list: RadarLegendItem[] = [
      {
        name: `起点: ${getShortLabel(teamResult.initialMember.label)}`,
        color: '#009688',
        subLabel: '起点メンバー (青緑)',
      },
    ];

    const partnerColors = ['#e0532b', '#ea580c'];
    teamResult.steps.slice(0, 2).forEach((step, idx) => {
      list.push({
        name: `+Step ${step.step}: ${getShortLabel(step.addedMember.label)}`,
        color: partnerColors[idx % partnerColors.length],
        subLabel: `+${(step.improvement * 100).toFixed(1)}pt (橙)`,
      });
    });

    list.push({
      name: `チーム合成 (${teamResult.teamMembers.length}${levelUnit})`,
      color: '#059669',
      subLabel: `達成度 ${(teamResult.finalScore * 100).toFixed(1)}%`,
    });

    return list;
  }, [teamResult, levelUnit]);

  // AIコンテキスト共有
  useEffect(() => {
    if (!teamResult) return;
    const initialLabel = teamResult.initialMember.label;

    const presets: string[] = [];
    presets.push(`貪欲法で「${initialLabel}」に最初に選ばれたパートナーの選定理由は？`);
    presets.push(`チーム人数（${teamResult.teamMembers.length}名）で各組織の役割分担はどう機能しますか？`);
    presets.push(`最大値結合(Max)と平均値結合(Mean)でチーム編成の最適戦略はどう変わる？`);
    presets.push(`これ以上のメンバー追加で得られるスキルの限界収穫逓減についての評価は？`);

    setAnalyticsContext({
      pageTitle: 'チーム編成支援',
      primaryTarget: initialLabel,
      summaryText: `起点: ${initialLabel} のGreedyチーム編成シミュレーション（${teamResult.teamMembers.length}組織、スコア: ${(teamResult.finalScore * 100).toFixed(1)}%）`,
      details: {
        initial: initialLabel,
        teamSize: teamResult.teamMembers.length,
        searchMode,
        combineMethod,
        baselineScore: Number(teamResult.baselineScore.toFixed(4)),
        finalScore: Number(teamResult.finalScore.toFixed(4)),
        teamMembers: teamResult.teamMembers.map((m) => m.label),
        steps: teamResult.steps.map((s) => ({
          step: s.step,
          added: s.addedMember.label,
          score: Number(s.teamScore.toFixed(4)),
          topReinforced: s.topReinforcedSkills.map((sk) => sk.name).join(', '),
        })),
      },
      presetQuestions: presets,
    });
  }, [teamResult, searchMode, combineMethod, setAnalyticsContext]);

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-5 overflow-y-auto bg-slate-50">
      <div className="flex items-center">
        <BackButton label="学習支援メニューに戻る" fallbackHref="/macro" />
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
                チーム編成支援 (Greedy Team Build)
              </h1>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                <span>貪欲法による最適編成</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              指定人数またはスキル閾値を達成するまで、不足を最も補えるパートナーを1組織ずつ貪欲に追加シミュレーション
            </p>
          </div>
        </div>
      </div>

      {/* データベース接続エラー時の警告バナー */}
      {dbError && (
        <DatabaseErrorBanner message={dbError} />
      )}

      {/* コントロールパネル */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        {/* 起点組織選択 */}
        <div className="p-4 rounded-lg bg-orange-50/50 border border-orange-200 space-y-3">
          {/* 大学フィルター (学部・学科レベル時) */}
          {level !== 'university' && universityList.length > 1 && (
            <div className="pb-2 border-b border-orange-200/60">
              <SearchableSelect
                label="大学で絞り込み:"
                options={universityList}
                value={selectedUnivFilter}
                onChange={setSelectedUnivFilter}
                placeholder="大学名を検索・選択..."
                colorScheme="orange"
              />
            </div>
          )}

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-orange-600" />
                起点の組織（リーダー組織）を選択:
              </span>
              {initialRecord && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-orange-700 font-medium">
                    科目数: {initialRecord.subject_count}科目
                  </span>
                  <AcademicUnitInfoButton
                    target={{
                      id: initialRecord.id,
                      universityName: initialRecord.university_name,
                      facultyName: (initialRecord as any).faculty_name,
                      departmentName: (initialRecord as any).department_name,
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
                  {formatLabel(item)} ({item.subject_count}科目)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 探索モードとパラメータ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* 探索モード */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-orange-500" /> 探索モード:
            </label>
            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value as 'team_size' | 'threshold')}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="team_size">人数指定モード (固定人数)</option>
              <option value="threshold">閾値達成モード (目標到達まで)</option>
            </select>
          </div>

          {/* 人数 or 閾値設定 */}
          {searchMode === 'team_size' ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-orange-500" /> 目標チーム人数:
              </label>
              <select
                value={targetTeamSize}
                onChange={(e) => setTargetTeamSize(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value={2}>2{levelUnit}チーム (+1{levelUnit}追加)</option>
                <option value={3}>3{levelUnit}チーム (+2{levelUnit}追加)</option>
                <option value={4}>4{levelUnit}チーム (標準)</option>
                <option value={5}>5{levelUnit}チーム</option>
                <option value={6}>6{levelUnit}チーム</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-orange-500" /> 目標スコア閾値:
              </label>
              <select
                value={targetThreshold}
                onChange={(e) => setTargetThreshold(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value={0.85}>85% 到達</option>
                <option value={0.90}>90% 到達</option>
                <option value={0.93}>93% 到達</option>
                <option value={0.95}>95% 到達 (高度)</option>
              </select>
            </div>
          )}

          {/* 結合方法 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-slate-500" /> 結合方法:
            </label>
            <select
              value={combineMethod}
              onChange={(e) => setCombineMethod(e.target.value as 'max' | 'mean')}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="max">最大値結合 (強み集約)</option>
              <option value="mean">平均値結合 (総合底上げ)</option>
            </select>
          </div>

          {/* 対象スキル */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-500" /> 対象スキル:
            </label>
            <select
              value={vectorTarget}
              onChange={(e) => setVectorTarget(e.target.value as VectorTarget)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="all">全24スキル統合</option>
              <option value="knowledge">知識関連 (12項目)</option>
              <option value="general">汎用スキル (12項目)</option>
            </select>
          </div>

          {/* 階層レベル */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> 階層レベル:
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as HierarchyLevel)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="department">学科レベル</option>
              <option value="faculty">学部レベル</option>
              <option value="university">大学レベル</option>
            </select>
          </div>
        </div>
      </div>

      {/* サマリーカード */}
      {teamResult && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium">初期単独スコア</span>
            <div className="text-xl font-bold text-slate-800 mt-1">
              {(teamResult.baselineScore * 100).toFixed(1)}%
            </div>
            <span className="text-2xs text-slate-400 mt-0.5 block">起点組織のみ</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-orange-200 shadow-2xs bg-orange-50/20">
            <span className="text-xs text-orange-700 font-bold">最終チームスコア</span>
            <div className="text-xl font-bold text-orange-600 mt-1">
              {(teamResult.finalScore * 100).toFixed(1)}%
            </div>
            <span className="text-2xs text-orange-600/80 mt-0.5 block">{teamResult.teamMembers.length}{levelUnit}合成</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> 総合向上幅
            </span>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              +{((teamResult.finalScore - teamResult.baselineScore) * 100).toFixed(1)} pt
            </div>
            <span className="text-2xs text-emerald-600/80 mt-0.5 block">チーム効果</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium">編成ステータス</span>
            <div className="text-sm font-bold text-slate-800 mt-2 flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${teamResult.reachedThreshold ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
              <span>{teamResult.reachedThreshold ? '目標閾値達成' : `${teamResult.teamMembers.length}${levelUnit}編成完了`}</span>
            </div>
            <span className="text-2xs text-slate-400 mt-0.5 block">{combineMethod === 'max' ? '最大値結合' : '平均値結合'}</span>
          </div>
        </div>
      )}

      {/* チーム編成メンバー一覧バッジ */}
      {teamResult && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-orange-600" />
            編成されたチームメンバー ({teamResult.teamMembers.length}{levelUnit}):
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
                  {index === 0 ? '起点' : `#${index + 1}`}
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
                        facultyName: (cand as any)?.faculty_name,
                        departmentName: (cand as any)?.department_name,
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
              チームスキルバランス推移 レーダーチャート
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              起点単体 vs 各ステップ追加メンバー vs 最終チーム合成ベクトル
            </p>
          </div>
        </div>

        {/* 2分割レーダーチャート (内部凡例は非表示にして大きく表示) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[440px]">
          {/* 知識関連スキル (左) */}
          <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/20 shadow-2xs">
            <RadarChart
              title={`A: 知識関連スキル (${teamResult ? teamResult.teamMembers.length : 0}${levelUnit} ${combineMethod === 'max' ? 'Max' : 'Mean'}結合)`}
              indicators={knowledgeIndicators}
              seriesData={knowledgeSeries}
              height={440}
              showLegend={false}
            />
          </div>

          {/* 汎用スキル (右) */}
          <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/20 shadow-2xs">
            <RadarChart
              title={`B: 汎用スキル (${teamResult ? teamResult.teamMembers.length : 0}${levelUnit} ${combineMethod === 'max' ? 'Max' : 'Mean'}結合)`}
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
          <span>💡 各グラフにマウスを重ねるとスキル別の詳細比率を確認できます。</span>
          <span>結合方式: <strong className="text-slate-600 font-semibold">{combineMethod === 'max' ? '最大値結合 (Max)' : '平均値結合 (Mean)'}</strong></span>
        </div>
      </div>

      {/* 貪欲法 ステップごとの追加履歴テーブル */}
      {teamResult && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                ステップごとの追加ログ ＆ スキル補強詳細
              </h3>
              <p className="text-xs text-slate-500">
                貪欲法により、各ステップで最もチームスコアを向上させた組織が選定されています
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-semibold">
                  <th className="py-2.5 px-3 w-16 text-center">ステップ</th>
                  <th className="py-2.5 px-3">追加された組織</th>
                  <th className="py-2.5 px-3 w-28 text-right">チームスコア</th>
                  <th className="py-2.5 px-3 w-28 text-right">向上幅 (Δ)</th>
                  <th className="py-2.5 px-3">特に大きく強化されたスキル Top 3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {/* Step 0: 起点組織 */}
                <tr className="bg-teal-50/40">
                  <td className="py-2.5 px-3 text-center font-bold text-teal-700">
                    起点
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span>{teamResult.initialMember.label}</span>
                      <AcademicUnitInfoButton
                        target={{
                          id: initialRecord.id,
                          universityName: initialRecord.university_name,
                          facultyName: (initialRecord as any).faculty_name,
                          departmentName: (initialRecord as any).department_name,
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
                    {(teamResult.baselineScore * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    -
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    基準初期スキル構成
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
                    <td className="py-2.5 px-3 text-right font-bold text-orange-700">
                      {(step.teamScore * 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                      +{(step.improvement * 100).toFixed(2)} pt
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {step.topReinforcedSkills.map((sk, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            {sk.name} (+{(sk.delta * 100).toFixed(1)}%)
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
