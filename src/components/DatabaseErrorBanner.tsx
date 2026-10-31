"use client";

import React from 'react';
import { AlertTriangle, Database, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { DbErrorInfo, DB_ERROR_FALLBACK_JA, fillParams } from '@/lib/dbError';

interface DatabaseErrorBannerProps {
  /** 表示するエラー（キー＋引数）。文言はバナー側で表示言語に変換する */
  error?: DbErrorInfo | null;
  onRetry?: () => void;
}

export default function DatabaseErrorBanner({
  error,
  onRetry,
}: DatabaseErrorBannerProps) {
  const { t } = useLanguage();
  if (!error) return null;

  const message = fillParams(
    t(`dbError.${error.key}`, DB_ERROR_FALLBACK_JA[error.key]),
    error.params
  );

  return (
    <div className="w-full p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-800 dark:text-red-200 shadow-xs flex items-start justify-between gap-4 transition-all">
      <div className="flex items-start gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-sm text-red-900 dark:text-red-100">
              {t('dbError.title', 'データベース（Supabase）接続エラー')}
            </h4>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-150 text-red-700 dark:bg-red-900/80 dark:text-red-300 border border-red-300 dark:border-red-700">
              <Database className="w-3 h-3" />
              <span>{t('dbError.badge', '接続失敗')}</span>
            </span>
          </div>
          <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed break-words">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 transition cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t('dbError.retry', '再試行')}</span>
        </button>
      )}
    </div>
  );
}
