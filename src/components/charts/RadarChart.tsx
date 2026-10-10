"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { RadarIndicator } from '@/lib/vectorUtils';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export interface RadarSeriesItem {
  name: string;
  value: number[];
  color?: string;
}

interface RadarChartProps {
  indicators: RadarIndicator[];
  seriesData: RadarSeriesItem[];
  title?: string;
  height?: string | number;
}

const DEFAULT_COLORS = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

export default function RadarChart({
  indicators,
  seriesData,
  title,
  height = '100%',
}: RadarChartProps) {
  const option = useMemo(() => {
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
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b' },
        extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 8px; max-width: 320px;',
        formatter: (params: any) => {
          const values: number[] = params.value || [];
          const name: string = params.name || '';
          let rows = `<div style="font-weight: 700; color: #0f172a; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">${name}</div>`;
          rows += `<div style="max-height: 240px; overflow-y: auto; font-size: 11px; line-height: 1.5;">`;
          indicators.forEach((ind, idx) => {
            const val = values[idx] !== undefined ? values[idx].toFixed(2) : '-';
            // 改行を取り除いて表示
            const cleanName = ind.name.replace(/\n/g, ' ');
            rows += `
              <div style="display: flex; justify-content: space-between; gap: 8px; margin-bottom: 2px;">
                <span style="color: #64748b;">${cleanName}:</span>
                <span style="font-weight: 600; color: #1e293b;">${val}</span>
              </div>
            `;
          });
          rows += `</div>`;
          return rows;
        },
      },
      legend: {
        bottom: 5,
        left: 'center',
        textStyle: { color: '#475569', fontSize: 12 },
        itemGap: 16,
      },
      radar: {
        indicator: indicators,
        center: ['50%', title ? '54%' : '50%'],
        radius: '68%',
        splitNumber: 4,
        shape: 'polygon',
        axisName: {
          color: '#475569',
          fontSize: 11,
          fontWeight: 500,
          formatter: (value: string) => value,
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(248, 250, 252, 0.8)', 'rgba(241, 245, 249, 0.4)'],
          },
        },
        axisLine: {
          lineStyle: {
            color: '#cbd5e1',
          },
        },
        splitLine: {
          lineStyle: {
            color: '#e2e8f0',
          },
        },
      },
      series: [
        {
          name: title || 'スキル比較',
          type: 'radar',
          symbol: 'circle',
          symbolSize: 5,
          data: seriesData.map((item, idx) => {
            const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
            return {
              value: item.value,
              name: item.name,
              itemStyle: {
                color: color,
              },
              lineStyle: {
                width: 2.2,
                color: color,
              },
              areaStyle: {
                color: color,
                opacity: 0.22,
              },
            };
          }),
        },
      ],
    };
  }, [indicators, seriesData, title]);

  return (
    <div className="w-full h-full min-h-[380px] relative">
      <ReactECharts
        option={option}
        style={{ height: height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
