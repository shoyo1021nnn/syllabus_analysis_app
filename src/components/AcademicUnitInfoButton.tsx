"use client";

import React from 'react';
import { Info, Building2 } from 'lucide-react';
import { useAcademicUnitModal, AcademicUnitTarget } from '@/context/AcademicUnitModalContext';
import { useLanguage } from '@/context/LanguageContext';

interface AcademicUnitInfoButtonProps {
  target: AcademicUnitTarget;
  variant?: 'badge' | 'icon' | 'pill';
  size?: 'sm' | 'xs' | '2xs';
  className?: string;
  label?: string;
}

export default function AcademicUnitInfoButton({
  target,
  variant = 'icon',
  size = 'xs',
  className = '',
  label,
}: AcademicUnitInfoButtonProps) {
  const { openUnitInfo } = useAcademicUnitModal();
  const { t } = useLanguage();
  const displayLabel = label ?? t('common.academicInfo', '基本情報');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openUnitInfo(target);
  };

  const displayName = target.departmentName || target.facultyName || target.universityName;

  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-semibold bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950/70 text-slate-600 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300 border border-slate-200 hover:border-teal-300 dark:border-slate-700 dark:hover:border-teal-700 transition shadow-2xs cursor-pointer ${className}`}
        title={`${displayName} - ${t('common.viewAcademicInfo', '基本情報を表示')}`}
        aria-label={`${displayName} - ${t('common.viewAcademicInfo', '基本情報を表示')}`}
      >
        <Building2 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
        <span>{displayLabel}</span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/80 dark:hover:bg-teal-900 text-teal-700 hover:text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition shadow-2xs cursor-pointer ${className}`}
        title={`${displayName} - ${t('common.viewAcademicInfo', '基本情報を表示')}`}
        aria-label={`${displayName} - ${t('common.viewAcademicInfo', '基本情報を表示')}`}
      >
        <Building2 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
        <span>{displayLabel}</span>
      </button>
    );
  }

  // デフォルト: icon
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === '2xs' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const buttonPadding = size === 'sm' ? 'p-1' : 'p-0.5';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/60 dark:hover:text-teal-400 transition cursor-pointer ${buttonPadding} ${className}`}
      title={`「${displayName}」の基本情報・WEBサイトを表示`}
      aria-label={`「${displayName}」の基本情報・WEBサイトを表示`}
    >
      <Info className={`${iconSize} shrink-0`} />
    </button>
  );
}
