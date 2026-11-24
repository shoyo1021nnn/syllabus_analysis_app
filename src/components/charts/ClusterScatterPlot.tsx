"use client";

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Camera, Check, Loader2 } from 'lucide-react';
import { ClusteringPoint } from '@/types/database';
import type { EChartsInstance } from 'echarts-for-react/lib/types';
import { useLanguage } from '@/context/LanguageContext';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

/** 散布図の 1 点：[PC1, PC2, 元の ClusteringPoint] */
type ScatterDatum = [number, number, ClusteringPoint];
/** tooltip / click で受け取る値のうち、この画面で使うもの */
type ScatterEventParams = { value?: ScatterDatum; color?: string };

interface ClusterScatterPlotProps {
  points?: ClusteringPoint[];
  pc1Ratio?: number;
  pc2Ratio?: number;
  selectedPointId?: string | null;
  onSelectPoint?: (point: ClusteringPoint) => void;
  exportFilename?: string;
}

// クラスタごとのカラーパレット（ティール＆オレンジ基調、20 色）
// k は最大 20 まで探索するため、20 クラスタまで色が重ならないようにしている。
// 散布図の背景（白）上で、どの 2 色も CIEDE2000 の色差が 13 以上、
// 隣り合う番号どうしは 26 以上離れるように選び、並べている。主に使う k=8〜10 の範囲（先頭 10 色）では色差 20 以上。
// どの色も白とのコントラスト比を 3:1 以上にしている（図形に推奨される WCAG 1.4.11 の基準）。
// 20 色すべてを色覚の多様性まで含めて見分けるのは難しいため、大学ごとの点の形でも区別できるようにしている。
// 凡例・ツールチップの色は各 series の itemStyle.color から自動で決まるため、この配列と一致する。
const CLUSTER_COLORS = [
  '#009688', // teal（ティール）
  '#e0532b', // terracotta（テラコッタ）
  '#4e342e', // dark brown（こげ茶）
  '#1b5e20', // forest green（深緑）
  '#f06292', // pink（ピンク）
  '#880e4f', // wine（ワインレッド）
  '#006064', // dark cyan（深いシアン）
  '#283593', // indigo（藍）
  '#cf8200', // orange（オレンジ）
  '#0288d1', // sky blue（空色）
  '#827717', // olive（オリーブ）
  '#ba68c8', // orchid（薄紫）
  '#8e0000', // maroon（えんじ）
  '#9c27b0', // purple（紫）
  '#69a32c', // lime green（黄緑）
  '#546e7a', // blue gray（青灰）
  '#d81b60', // magenta（マゼンタ）
  '#a1887f', // taupe（灰茶）
  '#01579b', // navy blue（紺）
  '#7b3f00', // chocolate（チョコレート）
];

// 大学ごとのシンボル形状
const UNIVERSITY_SYMBOLS: Record<string, string> = {
  '九州大学': 'circle',
  '中部大学': 'diamond',
};
const FALLBACK_SYMBOLS = ['circle', 'diamond', 'triangle', 'rect', 'roundRect', 'pin'];

export default function ClusterScatterPlot({
  points = [],
  pc1Ratio,
  pc2Ratio,
  selectedPointId,
  onSelectPoint,
  exportFilename = 'clustering_scatter_plot.png',
}: ClusterScatterPlotProps) {
  const { t } = useLanguage();
  const [chartInstance, setChartInstance] = useState<EChartsInstance | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExporting || !chartInstance) return;
    setIsExporting(true);
    try {
      const dataUrl = chartInstance.getDataURL({
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        excludeComponents: ['toolbox', 'dataZoom'],
      });
      const link = document.createElement('a');
      link.download = exportFilename.endsWith('.png') ? exportFilename : `${exportFilename}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to export scatter plot:', err);
    } finally {
      setIsExporting(false);
    }
  };
  // 大学名リストの一意化
  const universities = useMemo(() => {
    const set = new Set<string>();
    points.forEach((p) => {
      if (p.university_name) set.add(p.university_name);
    });
    return Array.from(set);
  }, [points]);

  // クラスタIDリストの一意化 (ソート済み)
  const clusterIds = useMemo(() => {
    const set = new Set<number>();
    points.forEach((p) => {
      if (p.cluster_id !== undefined && p.cluster_id !== null) {
        set.add(p.cluster_id);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [points]);

  // EChartsの series 構築
  const series = useMemo(() => {
    if (points.length === 0) return [];

    return clusterIds.map((cid, cIdx) => {
      const clusterPoints = points.filter((p) => p.cluster_id === cid);
      const color = CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length];

      return {
        name: `Cluster ${cid}`,
        type: 'scatter',
        symbolSize: (dataItem: ScatterDatum) => {
          // 選択されたポイントはサイズを拡大してハイライト
          const isSelected = selectedPointId && dataItem[2]?.id === selectedPointId;
          return isSelected ? 18 : 11;
        },
        itemStyle: {
          color: color,
          opacity: 0.85,
          borderColor: '#ffffff',
          borderWidth: 1.5,
          shadowBlur: 4,
          shadowColor: 'rgba(0,0,0,0.15)',
        },
        data: clusterPoints.map((p) => {
          // 大学に応じたシンボル形状
          const uIdx = universities.indexOf(p.university_name);
          const symbol =
            UNIVERSITY_SYMBOLS[p.university_name] ||
            FALLBACK_SYMBOLS[uIdx >= 0 ? uIdx % FALLBACK_SYMBOLS.length : 0];

          return {
            value: [p.pca_x, p.pca_y, p],
            symbol: symbol,
          };
        }),
      };
    });
  }, [points, clusterIds, universities, selectedPointId]);

  // ECharts オプション設定
  const option = useMemo(() => {
    const xName = `${t('charts.scatter.pc1')}${
      pc1Ratio !== undefined ? ` [${(pc1Ratio * 100).toFixed(1)}%]` : ''
    }`;
    const yName = `${t('charts.scatter.pc2')}${
      pc2Ratio !== undefined ? ` [${(pc2Ratio * 100).toFixed(1)}%]` : ''
    }`;

    return {
      backgroundColor: 'transparent',
      grid: {
        top: 60,
        right: 40,
        bottom: 70,
        left: 60,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a' },
        extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 8px;',
        formatter: (params: ScatterEventParams) => {
          const point: ClusteringPoint | undefined = params.value?.[2];
          if (!point) return '';
          return `
            <div style="font-size: 13px; line-height: 1.5;">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">
                【${point.university_name}】 ${point.department_name}
              </div>
              <div style="color: #64748b; font-size: 12px;">
                ${t('charts.scatter.cluster')}: <span style="font-weight: 600; color: ${params.color};">Cluster ${point.cluster_id}</span>
              </div>
              <div style="color: #64748b; font-size: 11px; margin-top: 2px;">
                PC1: ${point.pca_x?.toFixed(3)} / PC2: ${point.pca_y?.toFixed(3)}
              </div>
            </div>
          `;
        },
      },
      legend: {
        top: 10,
        type: 'scroll',
        textStyle: { color: '#475569', fontSize: 12 },
      },
      xAxis: {
        name: xName,
        nameLocation: 'middle',
        nameGap: 32,
        type: 'value',
        scale: true,
        splitLine: {
          lineStyle: { type: 'dashed', color: '#f1f5f9' },
        },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b' },
      },
      yAxis: {
        name: yName,
        nameLocation: 'middle',
        nameGap: 38,
        type: 'value',
        scale: true,
        splitLine: {
          lineStyle: { type: 'dashed', color: '#f1f5f9' },
        },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b' },
      },
      dataZoom: [
        {
          type: 'inside', // マウスホイールでのズーム
          xAxisIndex: [0],
          yAxisIndex: [0],
        },
        {
          type: 'slider', // 下部ズームスライダー
          xAxisIndex: [0],
          bottom: 10,
          height: 18,
          borderColor: 'transparent',
          backgroundColor: '#f8fafc',
          fillerColor: 'rgba(59, 130, 246, 0.15)',
        },
      ],
      series: series,
    };
  }, [series, pc1Ratio, pc2Ratio, t]);

  // クリックイベントのハンドリング
  const onEvents = useMemo(() => {
    return {
      click: (params: ScatterEventParams) => {
        const point: ClusteringPoint | undefined = params.value?.[2];
        if (point && onSelectPoint) {
          onSelectPoint(point);
        }
      },
    };
  }, [onSelectPoint]);

  return (
    <div className="w-full h-full min-h-[420px] relative group/scatterplot">
      {points.length > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md shadow-sm border transition-all duration-200 cursor-pointer ${
              isSuccess
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200/80 hover:border-slate-300 shadow-slate-100 hover:shadow backdrop-blur-sm'
            }`}
            title={t('charts.export.tooltipSingle', '高解像度PNG画像として保存します')}
            aria-label={t('charts.export.btnSaveSingle', '画像保存 (PNG)')}
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : isSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-slate-500 group-hover/scatterplot:text-blue-600 transition-colors" />
            )}
            <span>
              {isExporting
                ? t('charts.export.exporting', '画像生成中...')
                : isSuccess
                ? t('charts.export.success', '保存完了')
                : t('charts.export.btnSaveSingle', '画像保存 (PNG)')}
            </span>
          </button>
        </div>
      )}
      <ReactECharts
        option={option}
        onEvents={onEvents}
        onChartReady={(instance) => setChartInstance(instance)}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
