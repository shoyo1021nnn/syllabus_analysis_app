'use client';

import React, { useState } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
import { RadarIndicator } from '@/lib/vectorUtils';
import { RadarSeriesItem } from './RadarChart';
import { exportDualRadarChartsToPng } from '@/lib/chartExportUtils';
import { useLanguage } from '@/context/LanguageContext';

interface DualChartExportButtonProps {
  chart1: {
    title?: string;
    subTitle?: string;
    indicators: RadarIndicator[];
    seriesData: RadarSeriesItem[];
  };
  chart2: {
    title?: string;
    subTitle?: string;
    indicators: RadarIndicator[];
    seriesData: RadarSeriesItem[];
  };
  mainTitle?: string;
  filename?: string;
  className?: string;
}

export default function DualChartExportButton({
  chart1,
  chart2,
  mainTitle,
  filename,
  className = '',
}: DualChartExportButtonProps) {
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExporting) return;
    if (chart1.seriesData.length === 0 && chart2.seriesData.length === 0) return;

    setIsExporting(true);
    try {
      await exportDualRadarChartsToPng({
        mainTitle,
        leftTitle: chart1.title,
        leftIndicators: chart1.indicators,
        leftSeriesData: chart1.seriesData,
        rightTitle: chart2.title,
        rightIndicators: chart2.indicators,
        rightSeriesData: chart2.seriesData,
        filename,
      });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to export dual radar charts:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled =
    isExporting ||
    (chart1.seriesData.length === 0 && chart2.seriesData.length === 0);

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isDisabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs border transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
        isSuccess
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
          : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300'
      } ${className}`}
      title={t('charts.export.tooltipDual', '両方のチャートを結合して高解像度PNGとして保存します')}
      aria-label={t('charts.export.btnSaveDual', '左右結合で保存 (PNG)')}
    >
      {isExporting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
      ) : isSuccess ? (
        <Check className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Camera className="w-3.5 h-3.5 text-blue-600" />
      )}
      <span>
        {isExporting
          ? t('charts.export.exporting', '画像生成中...')
          : isSuccess
          ? t('charts.export.success', '保存完了')
          : t('charts.export.btnSaveDual', '左右結合で保存 (PNG)')}
      </span>
    </button>
  );
}
