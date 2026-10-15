"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  HierarchyLevel, 
  MetricType, 
  NormalizationType, 
  SkillVectorDepartment, 
  SkillVectorRecord 
} from '@/types/database';
import { 
  calculateSkillComplementation, 
  ComplementationApproach, 
  elementwiseMax, 
  getRadarIndicators, 
  normalizeL1, 
  SkillComplementationItem 
} from '@/lib/vectorUtils';
import RadarChart, { RadarSeriesItem } from '@/components/charts/RadarChart';
import RadarLegend, { RadarLegendItem } from '@/components/charts/RadarLegend';
import BackButton from '@/components/BackButton';
import { useAnalyticsContext } from '@/context/AnalyticsContext';
import { 
  Compass, 
  CheckCircle2, 
  Database, 
  AlertCircle, 
  BarChart2, 
  Filter, 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  Layers,
  ArrowRight,
  Radar,
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

function SkillComplementationContent() {
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

  // 選択中の比較パートナー（初期値はランキング1位）
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');

  // 探索パラメータ
  const [approach, setApproach] = useState<ComplementationApproach>('synergy');
  const [metric, setMetric] = useState<MetricType>('cosine');
  const [normalization, setNormalization] = useState<NormalizationType>('l1');
  const [filterUniversity, setFilterUniversity] = useState<TargetFilter>('all');

  // データ取得
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

  // 初期ターゲット設定
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

  // 候補リスト
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
      vector_A: d.knowledge_vector || [],
      vector_B: d.general_vector || [],
    }));
  }, [dataList, targetRecord, filterUniversity]);

  // スキル補完計算
  const rankingResults: SkillComplementationItem[] = useMemo(() => {
    if (!targetRecord || candidates.length === 0) return [];
    return calculateSkillComplementation(
      {
        id: targetRecord.id,
        vector_A: targetRecord.knowledge_vector || [],
        vector_B: targetRecord.general_vector || [],
      },
      candidates,
      {
        metric,
        normalization,
        approach,
        topN: 20,
      }
    );
  }, [targetRecord, candidates, metric, normalization, approach]);

  // ランキング算出後に選択パートナーを更新
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

  // レーダーチャート用データ
  const knowledgeIndicators = useMemo(() => getRadarIndicators('knowledge', { max: 100 }), []);
  const generalIndicators = useMemo(() => getRadarIndicators('general', { max: 100 }), []);

  const toPercent = (vec: number[] = []) => normalizeL1(vec).map((v) => Number((v * 100).toFixed(2)));

  const targetKVec = useMemo(() => toPercent(targetRecord?.knowledge_vector), [targetRecord]);
  const targetGVec = useMemo(() => toPercent(targetRecord?.general_vector), [targetRecord]);
  const partnerKVec = useMemo(() => toPercent(partnerRecord?.knowledge_vector), [partnerRecord]);
  const partnerGVec = useMemo(() => toPercent(partnerRecord?.general_vector), [partnerRecord]);

  // 合成ベクトル (最大値結合)
  const combinedGVec = useMemo(() => {
    if (!targetGVec.length || !partnerGVec.length) return [];
    return toPercent(elementwiseMax(targetGVec, partnerGVec));
  }, [targetGVec, partnerGVec]);

  const knowledgeSeries: RadarSeriesItem[] = useMemo(() => {
    if (!targetRecord) return [];
    const list: RadarSeriesItem[] = [
      { name: formatLabel(targetRecord), value: targetKVec, color: '#3b82f6' },
    ];
    if (partnerRecord) {
      list.push({ name: formatLabel(partnerRecord), value: partnerKVec, color: '#f43f5e' });
    }
    return list;
  }, [targetRecord, partnerRecord, targetKVec, partnerKVec]);

  const generalSeries: RadarSeriesItem[] = useMemo(() => {
    if (!targetRecord) return [];
    const list: RadarSeriesItem[] = [
      { name: formatLabel(targetRecord), value: targetGVec, color: '#3b82f6' },
    ];
    if (partnerRecord) {
      list.push({ name: formatLabel(partnerRecord), value: partnerGVec, color: '#f43f5e' });
      list.push({ name: '補完後 (Max結合)', value: combinedGVec, color: '#10b981' });
    }
    return list;
  }, [targetRecord, partnerRecord, targetGVec, partnerGVec, combinedGVec]);

  // 2つのチャート共通の凡例アイテム
  const legendItems: RadarLegendItem[] = useMemo(() => {
    if (!targetRecord) return [];
    const list: RadarLegendItem[] = [
      {
        name: `基準: ${formatLabel(targetRecord)}`,
        color: '#3b82f6',
        subLabel: '基準組織',
      },
    ];
    if (partnerRecord) {
      list.push({
        name: `候補: ${formatLabel(partnerRecord)}`,
        color: '#f43f5e',
        subLabel: '補完パートナー候補',
      });
      list.push({
        name: '補完後 (Max結合)',
        color: '#10b981',
        subLabel: '弱点補完合成',
      });
    }
    return list;
  }, [targetRecord, partnerRecord]);

  // AIエージェントコンテキスト供給
  useEffect(() => {
    if (!targetRecord) return;
    const targetLabel = formatLabel(targetRecord);
    const top1 = rankingResults[0];

    const approachNames: Record<ComplementationApproach, string> = {
      synergy: '専門一致・汎用相補 (バランス型)',
      gap: '理想ギャップ補填特化',
      ideal_max: '最大値結合 理想達成度',
      ideal_mean: '平均値結合 理想達成度',
      dissimilar_b: '汎用スキル相補（非類似度重視）',
    };

    const presets: string[] = [];
    if (top1) {
      presets.push(`「${targetLabel}」の不足スキルを第1位の「${top1.label}」はどう補完していますか？`);
      presets.push(`補完アプローチ（${approachNames[approach]}）の評価ポイントと教育的意義を解説して`);
      if (partnerRecord) {
        presets.push(`「${targetLabel}」と「${formatLabel(partnerRecord)}」が共同カリキュラムを組むメリットは？`);
      }
    }
    presets.push(`弱点スキルを補強するために、大学間連携で配慮すべき注意点は何ですか？`);

    setAnalyticsContext({
      pageTitle: 'スキル補完検索',
      primaryTarget: targetLabel,
      compareTarget: partnerRecord ? formatLabel(partnerRecord) : undefined,
      summaryText: `基準対象: ${targetLabel} のスキル補完検索（アプローチ: ${approachNames[approach]}）`,
      details: {
        target: targetLabel,
        approach: approachNames[approach],
        metric,
        partner: partnerRecord ? formatLabel(partnerRecord) : '未選択',
        topRankings: rankingResults.slice(0, 5).map((r) => ({
          rank: r.rank,
          label: r.label,
          sim_A: Number(r.sim_A.toFixed(3)),
          sim_B: Number(r.sim_B.toFixed(3)),
          gap_score: Number(r.gap_score.toFixed(3)),
          ideal_max: Number(r.ideal_attainment_max.toFixed(3)),
        })),
      },
      presetQuestions: presets,
    });
  }, [targetRecord, partnerRecord, rankingResults, approach, metric, setAnalyticsContext]);

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-5 overflow-y-auto bg-slate-50">
      {/* 戻るボタン */}
      <div className="flex items-center">
        <BackButton label="学習支援メニューに戻る" fallbackHref="/macro" />
      </div>

      {/* ヘッダーカード */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                スキル補完検索
              </h1>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>相補パートナー探索</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              基準組織の不足スキル（特に汎用スキル等）を効果的に補完できる連携相手を多角的アプローチでランキング
            </p>
          </div>
        </div>

        {/* データソースステータス */}
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

        {/* パラメータ条件 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* 補完アプローチ */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> 補完アプローチ:
            </label>
            <select
              value={approach}
              onChange={(e) => setApproach(e.target.value as ComplementationApproach)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="synergy">専門一致・汎用相補 (推奨)</option>
              <option value="gap">理想ギャップ補填特化</option>
              <option value="ideal_max">最大値結合 理想達成度</option>
              <option value="ideal_mean">平均値結合 理想達成度</option>
              <option value="dissimilar_b">汎用スキル相補 (非類似度重視)</option>
            </select>
          </div>

          {/* 計算指標 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-slate-500" /> 類似度指標:
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricType)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="cosine">コサイン類似度 (標準)</option>
              <option value="tanimoto">谷本係数 (Tanimoto)</option>
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

      {/* レーダーチャート対比エリア */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Radar className="w-5 h-5 text-indigo-600" />
              スキル相補シミュレーション（基準 vs 選択パートナー vs 補完後）
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              基準: <span className="font-semibold text-blue-600">{formatLabel(targetRecord)}</span>
              {partnerRecord && (
                <>
                  {' '}× 補完候補: <span className="font-semibold text-rose-600">{formatLabel(partnerRecord)}</span>
                </>
              )}
            </p>
          </div>

          <div className="text-2xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
            💡 各点にホバーして詳細比率（%）を確認
          </div>
        </div>

        {/* 2分割レーダーチャート (内部凡例は非表示にして大きく表示) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[440px]">
          {/* 知識関連スキル (左) */}
          <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/20 shadow-2xs">
            <RadarChart
              title="A: 知識関連スキル (専門一致度の対比)"
              indicators={knowledgeIndicators}
              seriesData={knowledgeSeries}
              height={440}
              showLegend={false}
            />
          </div>

          {/* 汎用スキル (右) */}
          <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/20 shadow-2xs">
            <RadarChart
              title="B: 汎用スキル (弱点補完＆Max結合結果)"
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
          <span>💡 チャート上の各点にカーソルを合わせると、詳細なスキル比率（%）が表示されます。</span>
          <span>補完アプローチ: <strong className="text-slate-600 font-semibold">{approach === 'synergy' ? '専門一致・汎用相補 (バランス型)' : '相補最適化'}</strong></span>
        </div>
      </div>

      {/* スキル補完ランキングテーブル */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              スキル補完パートナー ランキング (Top 20)
            </h3>
            <p className="text-xs text-slate-500">
              テーブル内の行をクリックすると、上部のレーダーチャートで直接対比できます
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
                <th className="py-2.5 px-3 w-28 text-right">総合スコア</th>
                <th className="py-2.5 px-3 w-24 text-right">専門一致(A)</th>
                <th className="py-2.5 px-3 w-24 text-right">汎用一致(B)</th>
                <th className="py-2.5 px-3 w-24 text-right">ギャップ補填</th>
                <th className="py-2.5 px-3 w-28 text-right">最大達成度</th>
                <th className="py-2.5 px-3 w-28 text-center">アクション</th>
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
                      isSelected
                        ? 'bg-indigo-50/80 font-medium'
                        : 'hover:bg-slate-50/80'
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
                      {item.sort_score.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {item.sim_A.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {item.sim_B.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                      {(item.gap_score * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-600 font-semibold">
                      {(item.ideal_attainment_max * 100).toFixed(1)}%
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

export default function SkillComplementationPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    }>
      <SkillComplementationContent />
    </Suspense>
  );
}
