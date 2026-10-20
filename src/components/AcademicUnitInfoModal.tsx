"use client";

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  X, 
  Building2, 
  BookOpen, 
  ExternalLink, 
  Layers, 
  Radar, 
  GitCompare, 
  CheckCircle2, 
  Sparkles,
  Award,
  Globe
} from 'lucide-react';
import { useAcademicUnitModal } from '@/context/AcademicUnitModalContext';
import { KNOWLEDGE_SKILLS, GENERAL_SKILLS } from '@/lib/vectorUtils';

export default function AcademicUnitInfoModal() {
  const { 
    isOpen, 
    targetUnit, 
    siblingDepartments, 
    isLoadingSiblings, 
    closeUnitInfo,
    openUnitInfo
  } = useAcademicUnitModal();

  // Escキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeUnitInfo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeUnitInfo]);

  // モーダル表示中は背景スクロールを抑止
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // スキルTop3の算出
  const topKnowledgeSkills = useMemo(() => {
    if (!targetUnit?.knowledgeVector || targetUnit.knowledgeVector.length === 0) return [];
    return targetUnit.knowledgeVector
      .map((val, idx) => ({ name: KNOWLEDGE_SKILLS[idx]?.nameJa || `A-${idx+1}`, val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 3);
  }, [targetUnit?.knowledgeVector]);

  const topGeneralSkills = useMemo(() => {
    if (!targetUnit?.generalVector || targetUnit.generalVector.length === 0) return [];
    return targetUnit.generalVector
      .map((val, idx) => ({ name: GENERAL_SKILLS[idx]?.nameJa || `B-${idx+1}`, val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 3);
  }, [targetUnit?.generalVector]);

  if (!isOpen || !targetUnit) return null;

  const {
    universityName,
    facultyName,
    departmentName,
    subjectCount,
    websiteUrl,
  } = targetUnit;

  const unitTitle = departmentName 
    ? `${facultyName ? facultyName + ' ' : ''}${departmentName}`
    : (facultyName || universityName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* 背景オーバーレイ */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={closeUnitInfo}
      />

      {/* モーダル本体 */}
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* 上部グラデーションバー */}
        <div className="h-2 w-full bg-linear-to-r from-teal-500 via-teal-600 to-orange-500" />

        {/* ヘッダー */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                <Building2 className="w-3.5 h-3.5" />
                {universityName}
              </span>
              {facultyName && departmentName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {facultyName}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
              {departmentName || facultyName || universityName}
            </h2>
          </div>

          <button
            onClick={closeUnitInfo}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition shrink-0"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* メインコンテンツ（スクロール可能） */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* スペックカード行 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 開講科目数カード */}
            <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/60 flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-teal-600/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  開講科目数
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {subjectCount !== undefined ? `${subjectCount.toLocaleString()}` : '—'}
                  <span className="text-xs font-medium text-slate-500 ml-1">科目</span>
                </div>
              </div>
            </div>

            {/* 所属組織・階層カード */}
            <div className="p-4 rounded-xl bg-orange-50/60 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800/60 flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs shadow-orange-500/30">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                  区分・組織階層
                </span>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {departmentName ? '学科単位' : facultyName ? '学部単位' : '大学全体'}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {facultyName ? `${facultyName}` : `${universityName}`}
                </div>
              </div>
            </div>
          </div>

          {/* 公式WEBページリンクセクション */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                公式WEBサイト（リンク）
              </span>
              {websiteUrl ? (
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  登録済み
                </span>
              ) : (
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  未登録
                </span>
              )}
            </div>

            {websiteUrl ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono break-all truncate max-w-md">
                  {websiteUrl}
                </div>
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow-md hover:shadow-teal-600/20 transition shrink-0"
                >
                  <span>公式WEBサイトを開く</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-1">
                現在この組織の公式WEBページURLは未登録です。
              </p>
            )}
          </div>

          {/* 同一学部の学科構成ツリー */}
          {facultyName && siblingDepartments.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-orange-500" />
                  {facultyName} の学科構成ツリー（全 {siblingDepartments.length} 学科）
                </h3>
                <span className="text-2xs text-slate-400">
                  クリックで切り替え
                </span>
              </div>

              {isLoadingSiblings ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  学科ツリーを読み込み中...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {siblingDepartments.map((s) => {
                    const isCurrent = s.departmentName === departmentName;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          openUnitInfo({
                            id: s.id,
                            universityName,
                            facultyName,
                            departmentName: s.departmentName,
                            subjectCount: s.subjectCount,
                            websiteUrl: s.websiteUrl,
                            level: 'department',
                          });
                        }}
                        className={`text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                          isCurrent
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-200 font-bold shadow-2xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 min-w-0">
                          {isCurrent ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                          )}
                          <span className="truncate">{s.departmentName}</span>
                        </div>
                        <span className={`text-2xs px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${
                          isCurrent 
                            ? 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-semibold' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                          {s.subjectCount}科目
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* スキル特性ハイライト（ベクトルがある場合） */}
          {(topKnowledgeSkills.length > 0 || topGeneralSkills.length > 0) && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                シラバスから抽出された主要スキル特性 (Top 3)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 知識スキルTop3 */}
                {topKnowledgeSkills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-500 dark:text-slate-400 text-2xs uppercase tracking-wider">
                      専門知識スキル (A群)
                    </span>
                    <div className="space-y-1">
                      {topKnowledgeSkills.map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200">
                          <span className="truncate">{s.name}</span>
                          <span className="font-mono font-bold text-2xs text-teal-700">{s.val.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* 汎用スキルTop3 */}
                {topGeneralSkills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-500 dark:text-slate-400 text-2xs uppercase tracking-wider">
                      汎用スキル (B群)
                    </span>
                    <div className="space-y-1">
                      {topGeneralSkills.map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-orange-50/50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200">
                          <span className="truncate">{s.name}</span>
                          <span className="font-mono font-bold text-2xs text-orange-700">{s.val.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* クイックアクション導線 */}
          <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href={`/analytics/radar_chart?primaryUniv=${encodeURIComponent(universityName)}&primaryDept=${encodeURIComponent(departmentName || facultyName || '')}`}
              onClick={closeUnitInfo}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 dark:hover:bg-teal-900 transition border border-teal-200 dark:border-teal-800"
            >
              <Radar className="w-3.5 h-3.5" />
              <span>レーダーチャートで見る</span>
            </Link>

            <Link
              href={`/analytics/similarity?primaryUniv=${encodeURIComponent(universityName)}&primaryDept=${encodeURIComponent(departmentName || facultyName || '')}`}
              onClick={closeUnitInfo}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>類似学科を探す</span>
            </Link>

            <button
              type="button"
              onClick={closeUnitInfo}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
            >
              閉じる
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
