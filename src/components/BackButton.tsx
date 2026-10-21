"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface BackButtonProps {
  label?: string;
  fallbackHref?: string;
  className?: string;
}

export default function BackButton({
  label,
  fallbackHref = '/analytics',
  className = '',
}: BackButtonProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const displayLabel = label ?? t('common.back', '戻る');

  const handleBack = () => {
    // 履歴が存在すればブラウザの戻るを実行、なければfallbackHrefへ遷移
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 transition-all duration-200 border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-95 ${className}`}
      title={displayLabel}
    >
      <ArrowLeft className="w-4 h-4 text-slate-500" />
      <span>{displayLabel}</span>
    </button>
  );
}
