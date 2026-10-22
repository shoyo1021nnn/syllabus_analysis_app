import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Camera, Check, Loader2 } from 'lucide-react';
import { RadarIndicator } from '@/lib/vectorUtils';
import { useLanguage } from '@/context/LanguageContext';
import { exportRadarChartToPng } from '@/lib/chartExportUtils';

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
  subTitle?: string;
  height?: string | number;
  showLegend?: boolean;
  exportable?: boolean;
  exportFilename?: string;
}

const DEFAULT_COLORS = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

export default function RadarChart({
  indicators,
  seriesData,
  title,
  subTitle,
  height = '100%',
  showLegend = true,
  exportable = true,
  exportFilename,
}: RadarChartProps) {
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportRadarChartToPng({
        title,
        subTitle,
        indicators,
        seriesData,
        filename: exportFilename,
      });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to export radar chart image:', err);
    } finally {
      setIsExporting(false);
    }
  };
  const option = useMemo(() => {
    const isMultiSeries = seriesData.length >= 3;

    return {
      backgroundColor: 'transparent',
      title: title
        ? {
            text: title,
            left: 'center',
            top: 8,
            textStyle: {
              fontSize: 14,
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
            const val = values[idx] !== undefined ? `${values[idx].toFixed(2)}%` : '-';
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
      legend: showLegend
        ? {
            type: 'scroll',
            orient: isMultiSeries ? 'vertical' : 'horizontal',
            bottom: 4,
            left: 'center',
            textStyle: { color: '#475569', fontSize: 11 },
            itemGap: isMultiSeries ? 5 : 14,
            itemWidth: 12,
            itemHeight: 6,
            pageIconSize: 10,
            pageTextStyle: { fontSize: 10, color: '#64748b' },
          }
        : undefined,
      radar: {
        indicator: indicators,
        center: [
          '50%',
          showLegend
            ? (isMultiSeries ? (title ? '37%' : '39%') : (title ? '43%' : '46%'))
            : (title ? '52%' : '50%'),
        ],
        radius: showLegend ? (isMultiSeries ? '38%' : '45%') : '52%',
        splitNumber: 4,
        shape: 'polygon',
        axisName: {
          color: '#475569',
          fontSize: 10,
          fontWeight: 500,
          lineHeight: 13,
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
          name: title || t('charts.radar.defaultSeriesName'),
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
  }, [indicators, seriesData, title, t]);

  return (
    <div className="w-full h-full min-h-[380px] relative group/radarchart">
      {exportable && seriesData.length > 0 && indicators.length > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md shadow-sm border transition-all duration-200 ${
              isSuccess
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200/80 hover:border-slate-300 shadow-slate-100 hover:shadow backdrop-blur-sm'
            }`}
            title={t('charts.export.tooltipSingle')}
            aria-label={t('charts.export.btnSaveSingle')}
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : isSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-slate-500 group-hover/radarchart:text-blue-600 transition-colors" />
            )}
            <span>
              {isExporting
                ? t('charts.export.exporting')
                : isSuccess
                ? t('charts.export.success')
                : t('charts.export.btnSaveSingle')}
            </span>
          </button>
        </div>
      )}
      <ReactECharts
        option={option}
        style={{ height: height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
