"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ClusteringPoint } from '@/types/database';
import { useLanguage } from '@/context/LanguageContext';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface ClusterScatterPlotProps {
  points?: ClusteringPoint[];
  pc1Ratio?: number;
  pc2Ratio?: number;
  selectedPointId?: string | null;
  onSelectPoint?: (point: ClusteringPoint) => void;
}

// クラスタごとの洗練されたカラーパレット（ティール＆オレンジ基調）
const CLUSTER_COLORS = [
  '#009688', // teal (ティール)
  '#e0532b', // terracotta orange (テラコッタオレンジ)
  '#0284c7', // sky
  '#10b981', // emerald
  '#d97706', // amber
  '#7c3aed', // violet
  '#db2777', // pink
  '#0d9488', // dark teal
  '#ea580c', // bright orange
  '#475569', // slate
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
}: ClusterScatterPlotProps) {
  const { t } = useLanguage();
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
        symbolSize: (dataItem: any) => {
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
        formatter: (params: any) => {
          const point: ClusteringPoint = params.value?.[2];
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
      click: (params: any) => {
        const point: ClusteringPoint = params.value?.[2];
        if (point && onSelectPoint) {
          onSelectPoint(point);
        }
      },
    };
  }, [onSelectPoint]);

  return (
    <div className="w-full h-full min-h-[420px] relative">
      <ReactECharts
        option={option}
        onEvents={onEvents}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
