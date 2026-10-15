"use client";

import React from 'react';

export interface RadarLegendItem {
  name: string;
  color: string;
  subLabel?: string;
}

interface RadarLegendProps {
  items: RadarLegendItem[];
  className?: string;
}

export default function RadarLegend({ items, className = '' }: RadarLegendProps) {
  if (!items || items.length === 0) return null;

  const isMulti = items.length >= 3;

  return (
    <div className={`w-full flex justify-center py-2.5 ${className}`}>
      {isMulti ? (
        // 3項目以上: 縦並び（中央配置、見やすいカード型スタイル）
        <div className="flex flex-col items-center space-y-2 w-full max-w-md">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 w-full px-4 py-2 rounded-lg bg-slate-50/90 border border-slate-200 shadow-2xs hover:bg-slate-100/70 transition"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-bold text-slate-800 truncate">
                  {item.name}
                </span>
              </div>
              {item.subLabel && (
                <span className="text-xs text-slate-500 font-semibold px-2 py-0.5 rounded bg-slate-200/60 shrink-0">
                  {item.subLabel}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        // 2項目以下: 横並び（中央配置、大きめバッジスタイル）
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-slate-50/90 border border-slate-200 shadow-2xs"
            >
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-bold text-slate-800">
                {item.name}
              </span>
              {item.subLabel && (
                <span className="text-xs text-slate-500 font-semibold px-2 py-0.5 rounded bg-slate-200/60">
                  {item.subLabel}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
