"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ClusteringPoint, ClusteringRun } from '@/types/database';
import ClusterScatterPlot from '@/components/charts/ClusterScatterPlot';
import BackButton from '@/components/BackButton';
import { useAnalyticsContext } from '@/context/AnalyticsContext';
import { 
  Network, 
  Layers, 
  Award, 
  Activity, 
  Database, 
  AlertCircle, 
  Compass, 
  Radar, 
  Users 
} from 'lucide-react';

// Supabaseデータ未投入時のリアルなフォールバックサンプルデータ
const MOCK_RUNS: ClusteringRun[] = [
  {
    id: 'mock-run-1',
    level: 'department',
    rank: 1,
    k: 3,
    silhouette_score: 0.3879,
    pc1_ratio: 0.4674,
    pc2_ratio: 0.1763,
  },
  {
    id: 'mock-run-2',
    level: 'department',
    rank: 2,
    k: 2,
    silhouette_score: 0.3633,
    pc1_ratio: 0.4674,
    pc2_ratio: 0.1763,
  },
  {
    id: 'mock-run-3',
    level: 'department',
    rank: 3,
    k: 9,
    silhouette_score: 0.3473,
    pc1_ratio: 0.4674,
    pc2_ratio: 0.1763,
  },
];

const MOCK_POINTS: Record<string, ClusteringPoint[]> = {
  'mock-run-1': [
    { id: '1', run_id: 'mock-run-1', department_id: 'd1', university_name: '九州大学', department_name: '電気情報工学科', pca_x: 0.42, pca_y: 0.15, cluster_id: 0 },
    { id: '2', run_id: 'mock-run-1', department_id: 'd2', university_name: '九州大学', department_name: '機械航空工学科', pca_x: 0.35, pca_y: 0.08, cluster_id: 0 },
    { id: '3', run_id: 'mock-run-1', department_id: 'd3', university_name: '九州大学', department_name: '文学部 人文学科', pca_x: -0.45, pca_y: -0.22, cluster_id: 1 },
    { id: '4', run_id: 'mock-run-1', department_id: 'd4', university_name: '九州大学', department_name: '法学部', pca_x: -0.38, pca_y: 0.31, cluster_id: 2 },
    { id: '5', run_id: 'mock-run-1', department_id: 'd5', university_name: '中部大学', department_name: '情報工学科', pca_x: 0.48, pca_y: 0.18, cluster_id: 0 },
    { id: '6', run_id: 'mock-run-1', department_id: 'd6', university_name: '中部大学', department_name: '機械工学科', pca_x: 0.38, pca_y: 0.02, cluster_id: 0 },
    { id: '7', run_id: 'mock-run-1', department_id: 'd7', university_name: '中部大学', department_name: '日本語日本文学科', pca_x: -0.52, pca_y: -0.28, cluster_id: 1 },
    { id: '8', run_id: 'mock-run-1', department_id: 'd8', university_name: '中部大学', department_name: '経営情報学科', pca_x: -0.12, pca_y: 0.25, cluster_id: 2 },
    { id: '9', run_id: 'mock-run-1', department_id: 'd9', university_name: '九州大学', department_name: '経済工学科', pca_x: -0.05, pca_y: 0.35, cluster_id: 2 },
    { id: '10', run_id: 'mock-run-1', department_id: 'd10', university_name: '中部大学', department_name: '応用生物化学科', pca_x: 0.18, pca_y: -0.35, cluster_id: 0 },
  ],
};

export default function ClusteringPage() {
  const { setAnalyticsContext } = useAnalyticsContext();
  const [runs, setRuns] = useState<ClusteringRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [points, setPoints] = useState<ClusteringPoint[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState<boolean>(true);
  const [isLoadingPoints, setIsLoadingPoints] = useState<boolean>(false);
  const [isUsingMock, setIsUsingMock] = useState<boolean>(false);
  const [selectedPoint, setSelectedPoint] = useState<ClusteringPoint | null>(null);

  // 1. 初回ロード: clustering_runs を取得
  useEffect(() => {
    async function fetchRuns() {
      setIsLoadingRuns(true);
      if (!isSupabaseConfigured) {
        setRuns(MOCK_RUNS);
        setSelectedRunId(MOCK_RUNS[0].id);
        setIsUsingMock(true);
        setIsLoadingRuns(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('clustering_runs')
          .select('*')
          .order('rank', { ascending: true });

        if (error || !data || data.length === 0) {
          console.warn('clustering_runs could not be fetched or is empty. Falling back to mock data.', error);
          setRuns(MOCK_RUNS);
          setSelectedRunId(MOCK_RUNS[0].id);
          setIsUsingMock(true);
        } else {
          setRuns(data);
          setSelectedRunId(data[0].id);
          setIsUsingMock(false);
        }
      } catch (err) {
        console.error('Failed to connect to Supabase:', err);
        setRuns(MOCK_RUNS);
        setSelectedRunId(MOCK_RUNS[0].id);
        setIsUsingMock(true);
      } finally {
        setIsLoadingRuns(false);
      }
    }

    fetchRuns();
  }, []);

  // 2. 選択された run に応じて clustering_points を取得
  useEffect(() => {
    if (!selectedRunId) return;

    async function fetchPoints() {
      setIsLoadingPoints(true);
      setSelectedPoint(null); // 実行切り替え時に選択解除

      if (isUsingMock) {
        setPoints(MOCK_POINTS[selectedRunId] || MOCK_POINTS['mock-run-1'] || []);
        setIsLoadingPoints(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('clustering_points')
          .select('*')
          .eq('run_id', selectedRunId);

        if (error || !data || data.length === 0) {
          console.warn('Points empty for run, falling back to mock points:', error);
          setPoints(MOCK_POINTS['mock-run-1'] || []);
        } else {
          setPoints(data);
        }
      } catch (err) {
        console.error('Failed to fetch clustering points:', err);
        setPoints(MOCK_POINTS['mock-run-1'] || []);
      } finally {
        setIsLoadingPoints(false);
      }
    }

    fetchPoints();
  }, [selectedRunId, isUsingMock]);

  // 現在選択されている run
  const activeRun = useMemo(() => {
    return runs.find((r) => r.id === selectedRunId) || runs[0];
  }, [runs, selectedRunId]);

  // AIエージェントへの画面コンテキスト共有
  useEffect(() => {
    const selectedTargetName = selectedPoint
      ? `【${selectedPoint.university_name}】${selectedPoint.department_name}`
      : undefined;

    const presets: string[] = [];
    if (selectedPoint) {
      presets.push(`「${selectedTargetName}」がクラスタ${selectedPoint.cluster_id}に分類された要因・特徴は？`);
      presets.push(`「${selectedTargetName}」と同じクラスタに属する他学科との類似点は？`);
    } else {
      presets.push(`クラスタ数（k=${activeRun?.k || 3}）における各グループの教育的特徴を教えて`);
      presets.push(`分布図の中で特異な位置にある外れ値学科はありますか？`);
    }
    presets.push(`PC1（第1主成分）とPC2（第2主成分）が表すスキルの意味は何ですか？`);
    presets.push(`シルエットスコア（${activeRun?.silhouette_score?.toFixed(3) || '-'}）から見る分類妥当性の評価は？`);

    setAnalyticsContext({
      pageTitle: 'K-means クラスタリング',
      primaryTarget: selectedTargetName,
      summaryText: `k=${activeRun?.k || 3} による学科スキルクラスタリング分析（総学科数: ${points.length}件）`,
      details: {
        k: activeRun?.k,
        silhouetteScore: activeRun?.silhouette_score,
        pc1Ratio: activeRun?.pc1_ratio,
        pc2Ratio: activeRun?.pc2_ratio,
        totalPoints: points.length,
        selectedPoint: selectedPoint
          ? {
              university: selectedPoint.university_name,
              department: selectedPoint.department_name,
              clusterId: selectedPoint.cluster_id,
              pcaX: selectedPoint.pca_x,
              pcaY: selectedPoint.pca_y,
            }
          : null,
      },
      presetQuestions: presets,
    });
  }, [activeRun, selectedPoint, points.length, setAnalyticsContext]);

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-5 overflow-y-auto bg-slate-50">
      {/* ナビゲーション戻るボタン */}
      <div className="flex items-center">
        <BackButton label="分析メニューに戻る" fallbackHref="/analytics" />
      </div>

      {/* ページタイトル & 概要 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                K-means クラスタリング & PCAマップ
              </h1>
              <p className="text-sm text-slate-500">
                24次元スキルベクトルを主成分分析(PCA)で2次元に縮約し、学科の分布とスキルグループを可視化します
              </p>
            </div>
          </div>
        </div>

        {/* データソースステータス */}
        <div>
          {isUsingMock ? (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-750 border border-amber-200">
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

      {/* コントロールバー & 統計サマリー */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              クラスタリング結果選択:
            </span>
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              disabled={isLoadingRuns}
              className="px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.rank ? `第${r.rank}位` : '結果'} (k={r.k}, スコア: {r.silhouette_score?.toFixed(4)})
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            マウスホイールでズーム、ドラッグで移動、ノードクリックで詳細表示
          </div>
        </div>

        {/* メトリクスカード群 */}
        {activeRun && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-blue-50/50 border border-blue-100">
              <div className="text-xs text-blue-600 font-medium">クラスタ数 (k)</div>
              <div className="text-2xl font-bold text-blue-900 mt-0.5">k = {activeRun.k}</div>
            </div>

            <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
              <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> シルエットスコア
              </div>
              <div className="text-2xl font-bold text-emerald-900 mt-0.5">
                {activeRun.silhouette_score?.toFixed(4)}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
              <div className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> PC1 寄与率
              </div>
              <div className="text-2xl font-bold text-indigo-900 mt-0.5">
                {activeRun.pc1_ratio ? `${(activeRun.pc1_ratio * 100).toFixed(1)}%` : '-'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-purple-50/50 border border-purple-100">
              <div className="text-xs text-purple-600 font-medium flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> PC2 寄与率
              </div>
              <div className="text-2xl font-bold text-purple-900 mt-0.5">
                {activeRun.pc2_ratio ? `${(activeRun.pc2_ratio * 100).toFixed(1)}%` : '-'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 散布図チャートエリア */}
      <div className="flex-1 min-h-[500px] bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        {isLoadingPoints ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2" />
            データを読み込み中...
          </div>
        ) : (
          <ClusterScatterPlot
            points={points}
            pc1Ratio={activeRun?.pc1_ratio}
            pc2Ratio={activeRun?.pc2_ratio}
            selectedPointId={selectedPoint?.id}
            onSelectPoint={(point) => setSelectedPoint(point)}
          />
        )}
      </div>

      {/* 選択ノード詳細カード */}
      {selectedPoint && (
        <div className="p-4 bg-white rounded-xl border-2 border-blue-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                  Cluster {selectedPoint.cluster_id}
                </span>
                <span className="text-xs text-slate-500 font-medium">{selectedPoint.university_name}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mt-1">
                {selectedPoint.department_name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                第1主成分 (PC1): {selectedPoint.pca_x?.toFixed(4)} | 第2主成分 (PC2): {selectedPoint.pca_y?.toFixed(4)}
              </p>
            </div>

            {/* クイックアクション */}
            <div className="flex items-center space-x-2 pt-2 sm:pt-0">
              <Link
                href={`/analytics/radar_chart?dept=${encodeURIComponent(selectedPoint.department_name)}&univ=${encodeURIComponent(selectedPoint.university_name)}`}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition shadow-xs border border-slate-200"
              >
                <Radar className="w-3.5 h-3.5 text-blue-600" />
                <span>スキルレーダーで見る</span>
              </Link>
              <Link
                href={`/analytics/similarity?dept=${encodeURIComponent(selectedPoint.department_name)}&univ=${encodeURIComponent(selectedPoint.university_name)}`}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition shadow-xs border border-blue-200"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>類似学科を探す</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
