"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MetricType, SimilarityScoreItem } from '@/types/database';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface SimilarityRankingProps {
  rankingItems: SimilarityScoreItem[];
  metric?: MetricType;
  title?: string;
  height?: string | number;
}

const METRIC_LABELS: Record<MetricType, string> = {
  cosine: 'コサイン類似度',
  dot: '内積スコア',
  euclidean: 'ユークリッド距離 (小さいほど類似)',
  tanimoto: '谷本係数',
};

export default function SimilarityRanking({
  rankingItems = [],
  metric = 'cosine',
  title,
  height = '100%',
}: SimilarityRankingProps) {
  // EChartsの横棒グラフでは、配列の下から上に描画されるため reverse する
  const displayItems = useMemo(() => {
    return [...rankingItems].slice(0, 10).reverse();
  }, [rankingItems]);

  const categories = useMemo(() => {
    return displayItems.map((item) => {
      const dept = item.department_name || item.faculty_name || item.label;
      return `#${item.rank} 【${item.university_name}】 ${dept}`;
    });
  }, [displayItems]);

  const scores = useMemo(() => {
    return displayItems.map((item) => Number(item.score.toFixed(4)));
  }, [displayItems]);

  const option = useMemo(() => {
    const isEuclid = metric === 'euclidean';
    const metricName = METRIC_LABELS[metric] || 'スコア';

    return {
      backgroundColor: 'transparent',
      title: title
        ? {
            text: title,
            left: 'center',
            top: 10,
            textStyle: {
              fontSize: 15,
              fontWeight: 600,
              color: '#1e293b',
            },
          }
        : undefined,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b' },
        extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 8px;',
        formatter: (params: any) => {
          const p = params[0];
          if (!p) return '';
          return `
            <div style="font-size: 13px; line-height: 1.5;">
              <div style="font-weight: 700; color: #1e293b;">${p.name}</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 2px;">
                ${metricName}: <span style="font-weight: 700; color: #009688;">${p.value}</span>
              </div>
            </div>
          `;
        },
      },
      grid: {
        top: title ? 50 : 30,
        left: '3%',
        right: '10%',
        bottom: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: metricName,
        nameLocation: 'end',
        scale: true,
        splitLine: {
          lineStyle: { type: 'dashed', color: '#f1f5f9' },
        },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#334155',
          fontSize: 11,
          fontWeight: 500,
        },
      },
      series: [
        {
          name: metricName,
          type: 'bar',
          data: scores,
          barMaxWidth: 24,
          label: {
            show: true,
            position: 'right',
            formatter: (params: any) => params.value.toFixed(3),
            color: '#475569',
            fontSize: 11,
            fontWeight: 600,
          },
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: (params: any) => {
              // 上位（配列の末尾）ほど濃い色にグラデーション
              const idx = params.dataIndex; // 0 (10位) 〜 9 (1位)
              if (isEuclid) {
                // ユークリッド距離は小さい方が上位
                return '#009688';
              }
              const opacity = 0.45 + (idx / 10) * 0.55;
              return `rgba(0, 150, 136, ${opacity})`;
            },
          },
        },
      ],
    };
  }, [displayItems, categories, scores, metric, title]);

  return (
    <div className="w-full h-full min-h-[420px] relative">
      <ReactECharts
        option={option}
        style={{ height: height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
