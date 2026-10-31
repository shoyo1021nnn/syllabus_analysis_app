import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Camera, Check, Loader2, ZoomIn, ZoomOut, RotateCcw, Maximize2, X } from 'lucide-react';
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
  const [zoom, setZoom] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportRadarChartToPng({
        title,
        subTitle,
        indicators: zoomedIndicators,
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

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(2.5, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(0.6, Number((prev - 0.25).toFixed(2))));
  };

  const handleZoomReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1.0);
  };

  // ズーム倍率をインジケーターの max に適用
  const zoomedIndicators = useMemo(() => {
    return indicators.map((ind) => {
      const baseMax = ind.max !== undefined ? ind.max : 100;
      const newMax = Math.max(5, Math.round(baseMax / zoom));
      return {
        ...ind,
        max: newMax,
      };
    });
  }, [indicators, zoom]);

  const option = useMemo(() => {
    const isMultiSeries = seriesData.length >= 3;

    return {
      backgroundColor: 'transparent',
      title: undefined, // タイトルは外側のHTMLヘッダーで美しくレンダリング (画像保存時はchartExportUtilsが専用レイアウトで出力)
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b' },
        extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 8px; max-width: 320px;',
        formatter: (params: { value?: number[]; name?: string }) => {
          const values: number[] = params.value || [];
          const name: string = params.name || '';
          let rows = `<div style="font-weight: 700; color: #0f172a; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">${name}</div>`;
          rows += `<div style="max-height: 240px; overflow-y: auto; font-size: 11px; line-height: 1.5;">`;
          indicators.forEach((ind, idx) => {
            const val = values[idx] !== undefined ? `${values[idx].toFixed(2)}%` : '-';
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
        indicator: zoomedIndicators,
        center: [
          '50%',
          showLegend
            ? (isMultiSeries ? '42%' : '48%')
            : '50%',
        ],
        radius: showLegend ? (isMultiSeries ? '42%' : '48%') : '54%',
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
          name: title || t('charts.radar.defaultSeriesName', 'レーダーチャート'),
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
                width: 2.4,
                color: color,
              },
              areaStyle: {
                color: color,
                opacity: 0.25,
              },
            };
          }),
        },
      ],
    };
  }, [zoomedIndicators, indicators, seriesData, title, showLegend, t]);

  return (
    <div className="w-full h-full min-h-[380px] relative group/radarchart flex flex-col">
      {/* カードヘッダー (タイトル & ツールバー) */}
      {(title || exportable) && (
        <div className="flex items-center justify-between pb-2 mb-1 px-1 border-b border-slate-100 shrink-0">
          <div className="min-w-0 pr-2">
            {title && (
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={title}>
                {title}
              </h4>
            )}
            {subTitle && (
              <p className="text-3xs text-slate-500 truncate">{subTitle}</p>
            )}
          </div>

          {/* 操作ツールバー (ズーム & 画像保存 & 全画面) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* ズームコントロールグループ */}
            <div className="flex items-center bg-white border border-slate-200/90 rounded-md shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.6}
                className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                title={t('analytics.radar.zoomOut', '縮小')}
                aria-label={t('analytics.radar.zoomOut', '縮小')}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-3xs font-bold text-slate-600 px-1.5 select-none min-w-[34px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 2.5}
                className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                title={t('analytics.radar.zoomIn', '拡大')}
                aria-label={t('analytics.radar.zoomIn', '拡大')}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoom !== 1.0 && (
                <button
                  type="button"
                  onClick={handleZoomReset}
                  className="p-1 border-l border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  title={t('analytics.radar.zoomReset', 'リセット')}
                  aria-label={t('analytics.radar.zoomReset', 'リセット')}
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 全画面モーダル展開ボタン */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/90 rounded-md shadow-2xs transition cursor-pointer"
              title={t('analytics.radar.fullscreen', '全画面で拡大表示')}
              aria-label={t('analytics.radar.fullscreen', '全画面で拡大表示')}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* 単体PNG保存ボタン */}
            {exportable && seriesData.length > 0 && indicators.length > 0 && (
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md shadow-2xs border transition-all duration-200 cursor-pointer ${
                  isSuccess
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
                title={t('charts.export.tooltipSingle', 'このチャートを画像として保存')}
                aria-label={t('charts.export.btnSaveSingle', '画像保存')}
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : isSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-slate-500 hover:text-blue-600 transition-colors" />
                )}
                <span className="hidden sm:inline text-2xs">
                  {isExporting
                    ? t('charts.export.exporting', '生成中')
                    : isSuccess
                    ? t('charts.export.success', '完了')
                    : t('charts.export.btnSaveSingle', '画像保存')}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* チャート本体 */}
      <div className="flex-1 w-full min-h-0">
        <ReactECharts
          option={option}
          style={{ height: height, width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      {/* 全画面拡大モーダル */}
      {isFullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in-0 duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-5xl h-[88vh] flex flex-col relative border border-slate-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {title || t('charts.radar.defaultSeriesName', 'レーダーチャート分析')}
                </h3>
                {subTitle && <p className="text-xs text-slate-500 mt-0.5">{subTitle}</p>}
              </div>

              <div className="flex items-center gap-3">
                {/* モーダル内ズームコントロール */}
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.6}
                    className="p-1.5 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition cursor-pointer"
                    title={t('analytics.radar.zoomOut', '縮小')}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2 min-w-[42px] text-center select-none">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= 2.5}
                    className="p-1.5 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition cursor-pointer"
                    title={t('analytics.radar.zoomIn', '拡大')}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  {zoom !== 1.0 && (
                    <button
                      type="button"
                      onClick={handleZoomReset}
                      className="p-1.5 border-l border-slate-200 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                      title={t('analytics.radar.zoomReset', 'リセット')}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 閉じるボタン */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                  title={t('analytics.radar.closeFullscreen', '閉じる')}
                  aria-label={t('analytics.radar.closeFullscreen', '閉じる')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* モーダルボディ (特大チャート) */}
            <div className="flex-1 w-full min-h-0 pt-4">
              <ReactECharts
                option={{
                  ...option,
                  radar: {
                    ...option.radar,
                    radius: '62%',
                    axisName: {
                      ...option.radar.axisName,
                      fontSize: 12,
                      lineHeight: 16,
                    },
                  },
                }}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
