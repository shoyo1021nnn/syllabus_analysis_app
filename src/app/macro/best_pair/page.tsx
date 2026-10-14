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
  BestPairItem, 
  calculateBestPairs, 
  combineVectors, 
  createIdealVector, 
  elementwiseMax, 
  elementwiseMean, 
  getRadarIndicators, 
  normalizeL1 
} from '@/lib/vectorUtils';
import RadarChart, { RadarSeriesItem } from '@/components/charts/RadarChart';
import BackButton from '@/components/BackButton';
import { useAnalyticsContext } from '@/context/AnalyticsContext';
import { 
  Sparkles, 
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
  Building2
} from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';

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

function BestPairContent() {
  const searchParams = useSearchParams();
  const queryDept = searchParams.get('dept');
  const queryUniv = searchParams.get('univ');
  const { setAnalyticsContext } = useAnalyticsContext();

  const [level, setLevel] = useState<HierarchyLevel>('department');
  const [dataList, setDataList] = useState<SkillVectorRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUsingMock, setIsUsingMock] = useState<boolean>(false);

  // 基準対象
  const [targetId, setTargetId] = useState<string>('');

  // 選択中のパートナー
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');

  // パラメータ
  const [combineMethod, setCombineMethod] = useState<'max' | 'mean'>('max');
  const [vectorTarget, setVectorTarget] = useState<VectorTarget>('all');
  const [metric, setMetric] = useState<MetricType>('cosine');
  const [normalization, setNormalization] = useState<NormalizationType>('l1');
  const [filterUniversity, setFilterUniversity] = useState<TargetFilter>('all');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      if (!isSupabaseConfigured) {
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

        if (error || !data || data.length === 0) {
          setDataList(MOCK_DEPARTMENTS);
          setIsUsingMock(true);
        } else {
          setDataList(data);
          setIsUsingMock(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
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
    setTargetId(matchedId || dataList[0].id);
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
    if (filteredDataList.length > 0 && !filteredDataList.some((d) => d.id === targetId)) {
      setTargetId(filteredDataList[0].id);
    }
  }, [filteredDataList, targetId]);

  const targetRecord = useMemo(() => {
    return filteredDataList.find((d) => d.id === targetId) || filteredDataList[0] || dataList[0];
  }, [filteredDataList, dataList, targetId]);

  const formatLabel = (rec?: SkillVectorRecord) => {
    if (!rec) return '';
    const dept = (rec as any).department_name;
    const fac = (rec as any).faculty_name;
    if (dept) return `【${rec.university_name}】 ${dept}`;
    if (fac) return `【${rec.university_name}】 ${fac}`;
    return `【${rec.university_name}】`;
  };

  const extractVector = (rec?: SkillVectorRecord): number[] => {
    if (!rec) return [];
    if (vectorTarget === 'knowledge') return rec.knowledge_vector || [];
    if (vectorTarget === 'general') return rec.general_vector || [];
    return combineVectors(rec.knowledge_vector || [], rec.general_vector || []);
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
      faculty_name: (d as any).faculty_name,
      department_name: (d as any).department_name,
      vector: extractVector(d),
    }));
  }, [dataList, targetRecord, filterUniversity, vectorTarget]);

  const rankingResults: BestPairItem[] = useMemo(() => {
    if (!targetRecord || candidates.length === 0) return [];
    return calculateBestPairs(
      {
        id: targetRecord.id,
        vector: extractVector(targetRecord),
      },
      candidates,
      {
        combineMethod,
        metric,
        normalization,
        topN: 20,
      }
    );
  }, [targetRecord, candidates, combineMethod, metric, normalization]);

  useEffect(() => {
    if (rankingResults.length > 0) {
      if (!selectedPartnerId || !rankingResults.some((r) => r.id === selectedPartnerId)) {
        setSelectedPartnerId(rankingResults[0].id);
      }
    }
  }, [rankingResults, selectedPartnerId]);

  const partnerRecord = useMemo(() => {
    return dataList.find((d) => d.id === selectedPartnerId) || (rankingResults[0] ? dataList.find(d => d.id === rankingResults[0].id) : null);
  }, [dataList, selectedPartnerId, rankingResults]);

  const currentPairItem = useMemo(() => {
    return rankingResults.find((r) => r.id === selectedPartnerId) || rankingResults[0];
  }, [rankingResults, selectedPartnerId]);

  // レーダーチャート用（知識12項目 ＆ 汎用12項目の2分割）
  const knowledgeIndicators = useMemo(() => getRadarIndicators('knowledge', { max: 100 }), []);
  const generalIndicators = useMemo(() => getRadarIndicators('general', { max: 100 }), []);

  const toPercent = (vec: number[] = []) => normalizeL1(vec).map((v) => Number((v * 100).toFixed(2)));

  const targetKVec = useMemo(() => toPercent(targetRecord?.knowledge_vector), [targetRecord]);
  const targetGVec = useMemo(() => toPercent(targetRecord?.general_vector), [targetRecord]);
  const partnerKVec = useMemo(() => toPercent(partnerRecord?.knowledge_vector), [partnerRecord]);
  const partnerGVec = useMemo(() => toPercent(partnerRecord?.general_vector), [partnerRecord]);

  const combinedKVec = useMemo(() => {
    if (!targetKVec.length || !partnerKVec.length) return [];
    const combined = combineMethod === 'max'
      ? elementwiseMax(targetKVec, partnerKVec)
      : elementwiseMean(targetKVec, partnerKVec);
    return toPercent(combined);
  }, [targetKVec, partnerKVec, combineMethod]);

  const combinedGVec = useMemo(() => {
    if (!targetGVec.length || !partnerGVec.length) return [];
    const combined = combineMethod === 'max'
      ? elementwiseMax(targetGVec, partnerGVec)
      : elementwiseMean(targetGVec, partnerGVec);
    return toPercent(combined);
  }, [targetGVec, partnerGVec, combineMethod]);

  const knowledgeSeries: RadarSeriesItem[] = useMemo(() => {
    if (!targetRecord) return [];
    const list: RadarSeriesItem[] = [
      { name: `${formatLabel(targetRecord)} (単体)`, value: targetKVec, color: '#3b82f6' },
    ];
    if (partnerRecord) {
      list.push({ name: `${formatLabel(partnerRecord)} (パートナー)`, value: partnerKVec, color: '#f43f5e' });
      list.push({ 
        name: `ペア結合 (${combineMethod === 'max' ? 'Max結合' : 'Mean結合'})`, 
        value: combinedKVec, 
        color: '#10b981' 
      });
    }
    return list;
  }, [targetRecord, partnerRecord, targetKVec, partnerKVec, combinedKVec, combineMethod]);

  const generalSeries: RadarSeriesItem[] = useMemo(() => {
    if (!targetRecord) return [];
    const list: RadarSeriesItem[] = [
      { name: `${formatLabel(targetRecord)} (単体)`, value: targetGVec, color: '#3b82f6' },
    ];
    if (partnerRecord) {
      list.push({ name: `${formatLabel(partnerRecord)} (パートナー)`, value: partnerGVec, color: '#f43f5e' });
      list.push({ 
        name: `ペア結合 (${combineMethod === 'max' ? 'Max結合' : 'Mean結合'})`, 
        value: combinedGVec, 
        color: '#10b981' 
      });
    }
    return list;
  }, [targetRecord, partnerRecord, targetGVec, partnerGVec, combinedGVec, combineMethod]);

  // AIコンテキスト共有
  useEffect(() => {
    if (!targetRecord) return;
    const targetLabel = formatLabel(targetRecord);
    const top1 = rankingResults[0];

    const presets: string[] = [];
    if (top1) {
      presets.push(`「${targetLabel}」と第1位「${top1.label}」のベストペアで、向上率が最大になる理由は？`);
      presets.push(`最大値結合(Max)と平均値結合(Mean)でペア相手のランキングはどう変化しますか？`);
      if (partnerRecord) {
        presets.push(`「${targetLabel}」と「${formatLabel(partnerRecord)}」の連携において、特に伸びるスキル分野を教えて`);
      }
    }
    presets.push(`カリキュラム連携で「1対1のベストペア」を組む際の教育ガバナンス上のアドバイスは？`);

    setAnalyticsContext({
      pageTitle: 'ベスト・ペア検索',
      primaryTarget: targetLabel,
      compareTarget: partnerRecord ? formatLabel(partnerRecord) : undefined,
      summaryText: `基準対象: ${targetLabel} のベスト・ペア探索（結合方法: ${combineMethod === 'max' ? '最大値結合' : '平均値結合'}、対象: ${vectorTarget}）`,
      details: {
        target: targetLabel,
        partner: partnerRecord ? formatLabel(partnerRecord) : '未選択',
        combineMethod: combineMethod === 'max' ? '最大値結合 (各々の強み重視)' : '平均値結合 (総合底上げ)',
        vectorTarget,
        metric,
        topPairs: rankingResults.slice(0, 5).map((r) => ({
          rank: r.rank,
          label: r.label,
          pairScore: Number(r.pair_score.toFixed(4)),
          improvement: Number(r.improvement.toFixed(4)),
        })),
      },
      presetQuestions: presets,
    });
  }, [targetRecord, partnerRecord, rankingResults, combineMethod, vectorTarget, metric, setAnalyticsContext]);

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-5 overflow-y-auto bg-slate-50">
      <div className="flex items-center">
        <BackButton label="学習支援メニューに戻る" fallbackHref="/macro" />
      </div>

      {/* ヘッダーカード */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                ベスト・ペア検索
              </h1>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>1対1 最大相乗効果</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              2組織が連携した際に最大のシナジー（理想ベクトルへの近接）を生み出すベストパートナーを探索
            </p>
          </div>
        </div>

        <div>
          {isUsingMock ? (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>プレビュー（サンプルデータ）</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>Supabase 実データ接続中</span>
            </div>
          )}
        </div>
      </div>

      {/* コントロールパネル */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        {/* 基準対象選択 */}
        <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-200 space-y-3">
          {/* 大学フィルター (学部・学科レベル時) */}
          {level !== 'university' && universityList.length > 1 && (
            <div className="pb-2 border-b border-indigo-200/60">
              <SearchableSelect
                label="大学で絞り込み:"
                options={universityList}
                value={selectedUnivFilter}
                onChange={setSelectedUnivFilter}
                placeholder="大学名を検索・選択..."
                colorScheme="indigo"
              />
            </div>
          )}

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                基準組織を選択:
              </span>
              {targetRecord && (
                <span className="text-xs text-indigo-600 font-medium">
                  科目数: {targetRecord.subject_count}科目
                </span>
              )}
            </div>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={isLoading || filteredDataList.length === 0}
              className="w-full px-3.5 py-2 text-sm bg-white border border-indigo-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-xs"
            >
              {filteredDataList.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatLabel(item)} ({item.subject_count}科目)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 条件設定 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* 結合方法 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" /> 結合方法:
            </label>
            <select
              value={combineMethod}
              onChange={(e) => setCombineMethod(e.target.value as 'max' | 'mean')}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="max">最大値結合 (各組織の強みを活かす)</option>
              <option value="mean">平均値結合 (チーム全体の底上げ)</option>
            </select>
          </div>

          {/* 対象スキル */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-slate-500" /> 対象スキル:
            </label>
            <select
              value={vectorTarget}
              onChange={(e) => setVectorTarget(e.target.value as VectorTarget)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">全24スキル統合 (知識+汎用)</option>
              <option value="knowledge">知識関連スキルのみ (12項目)</option>
              <option value="general">汎用スキルのみ (12項目)</option>
            </select>
          </div>

          {/* 大学絞り込み */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> 大学絞り込み:
            </label>
            <select
              value={filterUniversity}
              onChange={(e) => setFilterUniversity(e.target.value as TargetFilter)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">すべての大学</option>
              <option value="diff">他大学のみ (同一大学除く)</option>
              <option value="same">同一大学のみ</option>
            </select>
          </div>

          {/* 階層レベル */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-500" /> 階層レベル:
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as HierarchyLevel)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="department">学科レベル</option>
              <option value="faculty">学部レベル</option>
              <option value="university">大学レベル</option>
            </select>
          </div>
        </div>
      </div>

      {/* スコア向上サマリーカード */}
      {currentPairItem && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium">基準組織の単独スコア</span>
            <div className="text-xl font-bold text-slate-800 mt-1">
              {(currentPairItem.baseline_score * 100).toFixed(1)}%
            </div>
            <span className="text-2xs text-slate-400 mt-0.5 block">理想ベクトル(均等高水準)への近さ</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-indigo-200 shadow-2xs bg-indigo-50/20">
            <span className="text-xs text-indigo-700 font-bold">ベストペア結合後スコア</span>
            <div className="text-xl font-bold text-indigo-600 mt-1">
              {(currentPairItem.pair_score * 100).toFixed(1)}%
            </div>
            <span className="text-2xs text-indigo-600/80 mt-0.5 block">{combineMethod === 'max' ? '最大値結合' : '平均値結合'}</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> スコア向上度 (相乗効果)
            </span>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              +{((currentPairItem.improvement) * 100).toFixed(1)} pt
            </div>
            <span className="text-2xs text-emerald-600/80 mt-0.5 block">単独時からの改善幅</span>
          </div>
        </div>
      )}

      {/* レーダーチャート */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <RadarIcon className="w-5 h-5 text-indigo-600" />
              ベストペア結合 レーダーチャート比較
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              基準: <span className="font-semibold text-blue-600">{formatLabel(targetRecord)}</span>
              {partnerRecord && (
                <>
                  {' '}× パートナー: <span className="font-semibold text-rose-600">{formatLabel(partnerRecord)}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center gap-1 text-blue-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> 基準単体
            </span>
            <span className="flex items-center gap-1 text-rose-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> パートナー単体
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> ペア結合後
            </span>
          </div>
        </div>

        {/* 2分割レーダーチャート */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[440px]">
          {/* 知識関連スキル (左) */}
          <div className="flex flex-col border border-slate-100 rounded-lg p-2 bg-slate-50/20">
            <RadarChart
              title={`A: 知識関連スキル (${combineMethod === 'max' ? 'Max結合' : 'Mean結合'})`}
              indicators={knowledgeIndicators}
              seriesData={knowledgeSeries}
              height={420}
            />
          </div>

          {/* 汎用スキル (右) */}
          <div className="flex flex-col border border-slate-100 rounded-lg p-2 bg-slate-50/20">
            <RadarChart
              title={`B: 汎用スキル (${combineMethod === 'max' ? 'Max結合' : 'Mean結合'})`}
              indicators={generalIndicators}
              seriesData={generalSeries}
              height={420}
            />
          </div>
        </div>
      </div>

      {/* ランキングテーブル */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              ベスト・ペア候補 ランキング (Top 20)
            </h3>
            <p className="text-xs text-slate-500">
              行をクリックすると、上部のレーダーチャートに対比表示されます
            </p>
          </div>
          <span className="text-xs text-slate-400">
            対象候補数: {candidates.length}件
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-semibold">
                <th className="py-2.5 px-3 w-14 text-center">順位</th>
                <th className="py-2.5 px-3">大学・学部・学科名</th>
                <th className="py-2.5 px-3 w-32 text-right">ペア結合スコア</th>
                <th className="py-2.5 px-3 w-28 text-right">向上幅 (Δ)</th>
                <th className="py-2.5 px-3 w-24 text-center">アクション</th>
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
                      isSelected ? 'bg-indigo-50/80 font-medium' : 'hover:bg-slate-50/80'
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
                      {item.label}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-600">
                      {(item.pair_score * 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                      +{(item.improvement * 100).toFixed(2)} pt
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPartnerId(item.id);
                        }}
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                        }`}
                      >
                        <span>{isSelected ? '表示中' : '選択'}</span>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    }>
      <BestPairContent />
    </Suspense>
  );
}
