"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ClusteringPoint, ClusteringRun } from '@/types/database';
import ClusterScatterPlot from '@/components/charts/ClusterScatterPlot';
import BackButton from '@/components/BackButton';
import DatabaseErrorBanner from '@/components/DatabaseErrorBanner';
import { useAnalyticsContext } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
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
  const { t } = useLanguage();
  const { setAnalyticsContext } = useAnalyticsContext();
  const [runs, setRuns] = useState<ClusteringRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [points, setPoints] = useState<ClusteringPoint[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState<boolean>(true);
  const [isLoadingPoints, setIsLoadingPoints] = useState<boolean>(false);
  const [isUsingMock, setIsUsingMock] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<ClusteringPoint | null>(null);

  // 1. 初回ロード: clustering_runs を取得
  useEffect(() => {
    async function fetchRuns() {
      setIsLoadingRuns(true);
      if (!isSupabaseConfigured) {
        setDbError('Supabaseの接続設定（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）が未設定または無効です。');
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

        if (error) {
          console.error('Failed to fetch clustering_runs:', error);
          setDbError(`クラスタリング実行履歴の取得に失敗しました: ${error.message}`);
          setRuns(MOCK_RUNS);
          setSelectedRunId(MOCK_RUNS[0].id);
          setIsUsingMock(true);
        } else if (!data || data.length === 0) {
          setDbError('テーブル「clustering_runs」にデータが存在しません。');
          setRuns(MOCK_RUNS);
          setSelectedRunId(MOCK_RUNS[0].id);
          setIsUsingMock(true);
        } else {
          setDbError(null);
          setRuns(data);
          setSelectedRunId(data[0].id);
          setIsUsingMock(false);
        }
      } catch (err: any) {
        console.error('Failed to connect to Supabase:', err);
        setDbError(`データベース通信エラーが発生しました: ${err?.message || err}`);
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
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
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
      </div>

      {/* データベース接続エラー時の警告バナー */}
      {dbError && (
        <DatabaseErrorBanner message={dbError} />
      )}

      {/* コントロールバー & 統計サマリー */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              {t('analytics.clustering.runLabel', 'クラスタリング結果選択:')}
            </span>
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              disabled={isLoadingRuns}
              className="px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition shadow-sm"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.rank ? `${t('analytics.clustering.rankPrefix', '第')}${r.rank}${t('analytics.clustering.rankSuffix', '位')}` : t('analytics.clustering.resultDefault', '結果')} (k={r.k}, {t('analytics.clustering.scoreLabel', 'スコア:')} {r.silhouette_score?.toFixed(4)})
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            {t('analytics.clustering.guidance', 'マウスホイールでズーム、ドラッグで移動、ノードクリックで詳細表示')}
          </div>
        </div>

        {/* メトリクスカード群 */}
        {activeRun && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-teal-50/50 border border-teal-100">
              <div className="text-xs text-teal-700 font-medium">{t('analytics.clustering.clusterCount', 'クラスタ数 (k)')}</div>
              <div className="text-2xl font-bold text-teal-900 mt-0.5">k = {activeRun.k}</div>
            </div>

            <div className="p-3.5 rounded-lg bg-orange-50/50 border border-orange-100">
              <div className="text-xs text-orange-700 font-medium flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> {t('analytics.clustering.silhouetteScore', 'シルエットスコア')}
              </div>
              <div className="text-2xl font-bold text-orange-900 mt-0.5">
                {activeRun.silhouette_score?.toFixed(4)}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-teal-50/30 border border-teal-100">
              <div className="text-xs text-teal-700 font-medium flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> {t('analytics.clustering.pc1Ratio', 'PC1 寄与率')}
              </div>
              <div className="text-2xl font-bold text-teal-900 mt-0.5">
                {activeRun.pc1_ratio ? `${(activeRun.pc1_ratio * 100).toFixed(1)}%` : '-'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-orange-50/30 border border-orange-100">
              <div className="text-xs text-orange-700 font-medium flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> {t('analytics.clustering.pc2Ratio', 'PC2 寄与率')}
              </div>
              <div className="text-2xl font-bold text-orange-900 mt-0.5">
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-2" />
            {t('common.loading', 'データを読み込み中...')}
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
        <div className="p-4 bg-white rounded-xl border-2 border-teal-300 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-teal-100 text-teal-800">
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
                <Radar className="w-3.5 h-3.5 text-teal-600" />
                <span>{t('analytics.clustering.compareInRadar', 'この学科をレーダーチャートで詳細比較')}</span>
              </Link>
              <Link
                href={`/analytics/similarity?dept=${encodeURIComponent(selectedPoint.department_name)}&univ=${encodeURIComponent(selectedPoint.university_name)}`}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 transition shadow-xs border border-teal-200"
              >
                <Users className="w-3.5 h-3.5 text-teal-600" />
                <span>類似学科を探す</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
