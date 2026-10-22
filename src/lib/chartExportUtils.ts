/**
 * チャート高品位画像エクスポートユーティリティ
 * 画面のDOM撮影（見切れの原因）ではなく、画像書き出し専用の最適化パラメータ
 * （外周余白の拡大、スマート折り返し、pixelRatio: 2 による超高解像度化、白背景）
 * を適用したオフスクリーンCanvasを動的生成してダウンロードします。
 */

import * as echarts from 'echarts';
import { RadarIndicator } from './vectorUtils';
import { RadarSeriesItem } from '@/components/charts/RadarChart';

const DEFAULT_COLORS = ['#009688', '#e0532b', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6'];

export interface ExportRadarOptions {
  title?: string;
  subTitle?: string;
  indicators: RadarIndicator[];
  seriesData: RadarSeriesItem[];
  filename?: string;
  pixelRatio?: number;
  backgroundColor?: string;
}

export interface ExportDualRadarOptions {
  mainTitle?: string;
  subTitle?: string;
  leftTitle?: string;
  leftIndicators: RadarIndicator[];
  leftSeriesData: RadarSeriesItem[];
  rightTitle?: string;
  rightIndicators: RadarIndicator[];
  rightSeriesData: RadarSeriesItem[];
  filename?: string;
  pixelRatio?: number;
  backgroundColor?: string;
}

/**
 * 長いラベルの自動スマート折り返し
 * 例: "A-4 社会科学・ジャーナリズム・情報学" -> "A-4 社会科学\nジャーナリズム・情報学"
 */
export function formatRadarAxisName(name: string): string {
  if (!name) return '';
  if (name.includes('\n')) return name;

  // 記号またはスペースでの分割を試みる
  if (name.length > 10) {
    // 最初のスペースまたは読点・中黒で改行
    const spaceIndex = name.indexOf(' ');
    if (spaceIndex > 0 && spaceIndex < 12) {
      return name.slice(0, spaceIndex) + '\n' + name.slice(spaceIndex + 1);
    }
    const dotIndex = name.indexOf('・');
    if (dotIndex > 0 && dotIndex < 14) {
      return name.slice(0, dotIndex + 1) + '\n' + name.slice(dotIndex + 1);
    }
    // 9文字前後で強制折り返し
    return name.slice(0, 9) + '\n' + name.slice(9);
  }
  return name;
}

/**
 * DataURLをブラウザから自動ダウンロードさせるヘルパー
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 日時フォーマット (YYYYMMDD_HHmm)
 */
export function getTimestampString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}_${h}${min}`;
}

/**
 * 単一レーダーチャートの画像エクスポート (見切れ完全防止・解像度2x)
 */
export async function exportRadarChartToPng(options: ExportRadarOptions): Promise<void> {
  const {
    title = 'Skill Radar Chart',
    subTitle,
    indicators,
    seriesData,
    filename,
    pixelRatio = 2,
    backgroundColor = '#ffffff',
  } = options;

  // 1. オフスクリーンのコンテナをDOMに追加
  const container = document.createElement('div');
  container.style.width = '1400px';
  container.style.height = '1000px';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  try {
    // 2. ECharts インスタンスを初期化
    const chart = echarts.init(container, null, {
      renderer: 'canvas',
      width: 1400,
      height: 1000,
    });

    // 3. 長い軸名のスマート折り返しを適用
    const formattedIndicators = indicators.map((ind) => ({
      ...ind,
      name: formatRadarAxisName(ind.name),
    }));

    // 4. 見切れ完全防止の最適化オプション
    const option: echarts.EChartsOption = {
      backgroundColor,
      title: {
        text: title,
        subtext: subTitle || 'Syllabus Analysis App - 24 Skill Vector Profile',
        left: 'center',
        top: 30,
        textStyle: {
          fontSize: 22,
          fontWeight: 700,
          color: '#0f172a',
          fontFamily: 'sans-serif',
        },
        subtextStyle: {
          fontSize: 13,
          color: '#64748b',
          fontFamily: 'sans-serif',
        },
      },
      legend: {
        bottom: 26,
        left: 'center',
        textStyle: {
          color: '#334155',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'sans-serif',
        },
        itemGap: 24,
        itemWidth: 16,
        itemHeight: 8,
      },
      radar: {
        indicator: formattedIndicators,
        center: ['50%', '52%'],
        // 外周に直径の64%（片側約440px）のマージンを確保することで、最長ラベルでも見切れない
        radius: '36%',
        splitNumber: 4,
        shape: 'polygon',
        axisName: {
          color: '#1e293b',
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 17,
          fontFamily: 'sans-serif',
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(248, 250, 252, 0.95)', 'rgba(241, 245, 249, 0.5)'],
          },
        },
        axisLine: {
          lineStyle: {
            color: '#cbd5e1',
            width: 1.2,
          },
        },
        splitLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 1.2,
          },
        },
      },
      series: [
        {
          name: title,
          type: 'radar',
          symbol: 'circle',
          symbolSize: 6,
          data: seriesData.map((item, idx) => {
            const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
            return {
              value: item.value,
              name: item.name,
              itemStyle: { color },
              lineStyle: { width: 2.5, color },
              areaStyle: { color, opacity: 0.25 },
            };
          }),
        },
      ],
    };

    chart.setOption(option);

    // 5. 画像としてエクスポート
    const dataUrl = chart.getDataURL({
      type: 'png',
      pixelRatio,
      backgroundColor,
      excludeComponents: ['toolbox'],
    });

    const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '_').trim();
    const finalFilename = filename || `${safeTitle}_${getTimestampString()}.png`;
    downloadDataUrl(dataUrl, finalFilename);

    chart.dispose();
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * 知識スキル(左)と汎用スキル(右)の2つのレーダーチャートを1枚の横長高精細画像として結合エクスポート
 */
export async function exportDualRadarChartsToPng(options: ExportDualRadarOptions): Promise<void> {
  const {
    mainTitle = 'Syllabus Skill Vector Analysis',
    subTitle,
    leftTitle = 'A: Specialized Knowledge Skills (12 items)',
    leftIndicators,
    leftSeriesData,
    rightTitle = 'B: Generic Competencies (12 items)',
    rightIndicators,
    rightSeriesData,
    filename,
    pixelRatio = 2,
    backgroundColor = '#ffffff',
  } = options;

  const container = document.createElement('div');
  container.style.width = '2600px';
  container.style.height = '1200px';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  try {
    const chart = echarts.init(container, null, {
      renderer: 'canvas',
      width: 2600,
      height: 1200,
    });

    const formattedLeftInd = leftIndicators.map((ind) => ({
      ...ind,
      name: formatRadarAxisName(ind.name),
    }));

    const formattedRightInd = rightIndicators.map((ind) => ({
      ...ind,
      name: formatRadarAxisName(ind.name),
    }));

    const option: echarts.EChartsOption = {
      backgroundColor,
      title: [
        {
          text: mainTitle,
          subtext: subTitle || 'Syllabus Analysis App - Comprehensive Dual 24-Dimension Radar Profile',
          left: 'center',
          top: 30,
          textStyle: {
            fontSize: 26,
            fontWeight: 800,
            color: '#0f172a',
            fontFamily: 'sans-serif',
          },
          subtextStyle: {
            fontSize: 15,
            color: '#64748b',
            fontFamily: 'sans-serif',
          },
        },
        {
          text: leftTitle,
          left: '26%',
          top: 105,
          textStyle: {
            fontSize: 18,
            fontWeight: 700,
            color: '#00796b',
            fontFamily: 'sans-serif',
          },
        },
        {
          text: rightTitle,
          left: '74%',
          top: 105,
          textStyle: {
            fontSize: 18,
            fontWeight: 700,
            color: '#c2410c',
            fontFamily: 'sans-serif',
          },
        },
      ],
      legend: {
        bottom: 30,
        left: 'center',
        textStyle: {
          color: '#334155',
          fontSize: 15,
          fontWeight: 600,
          fontFamily: 'sans-serif',
        },
        itemGap: 30,
        itemWidth: 20,
        itemHeight: 10,
      },
      radar: [
        // 左レーダー (知識)
        {
          indicator: formattedLeftInd,
          center: ['26%', '56%'],
          radius: '34%',
          splitNumber: 4,
          shape: 'polygon',
          axisName: {
            color: '#1e293b',
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 17,
            fontFamily: 'sans-serif',
          },
          splitArea: {
            areaStyle: {
              color: ['rgba(240, 253, 250, 0.9)', 'rgba(204, 251, 241, 0.3)'],
            },
          },
          axisLine: { lineStyle: { color: '#99f6e4', width: 1.2 } },
          splitLine: { lineStyle: { color: '#ccfbf1', width: 1.2 } },
        },
        // 右レーダー (汎用)
        {
          indicator: formattedRightInd,
          center: ['74%', '56%'],
          radius: '34%',
          splitNumber: 4,
          shape: 'polygon',
          axisName: {
            color: '#1e293b',
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 17,
            fontFamily: 'sans-serif',
          },
          splitArea: {
            areaStyle: {
              color: ['rgba(255, 247, 237, 0.9)', 'rgba(254, 215, 170, 0.3)'],
            },
          },
          axisLine: { lineStyle: { color: '#fed7aa', width: 1.2 } },
          splitLine: { lineStyle: { color: '#ffedd5', width: 1.2 } },
        },
      ],
      series: [
        {
          name: leftTitle,
          type: 'radar',
          radarIndex: 0,
          symbol: 'circle',
          symbolSize: 6,
          data: leftSeriesData.map((item, idx) => {
            const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
            return {
              value: item.value,
              name: item.name,
              itemStyle: { color },
              lineStyle: { width: 2.5, color },
              areaStyle: { color, opacity: 0.25 },
            };
          }),
        },
        {
          name: rightTitle,
          type: 'radar',
          radarIndex: 1,
          symbol: 'circle',
          symbolSize: 6,
          data: rightSeriesData.map((item, idx) => {
            const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
            return {
              value: item.value,
              name: item.name,
              itemStyle: { color },
              lineStyle: { width: 2.5, color },
              areaStyle: { color, opacity: 0.25 },
            };
          }),
        },
      ],
    };

    chart.setOption(option);

    const dataUrl = chart.getDataURL({
      type: 'png',
      pixelRatio,
      backgroundColor,
    });

    const safeTitle = mainTitle.replace(/[/\\?%*:|"<>]/g, '_').trim();
    const finalFilename = filename || `${safeTitle}_DualRadar_${getTimestampString()}.png`;
    downloadDataUrl(dataUrl, finalFilename);

    chart.dispose();
  } finally {
    document.body.removeChild(container);
  }
}
