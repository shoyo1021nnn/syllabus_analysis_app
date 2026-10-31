"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Radar, 
  GitCompare, 
  Network, 
  Compass, 
  Sparkles, 
  Users, 
  Check, 
  ChevronRight
} from 'lucide-react';
import { AnalysisAction, ActionIconType } from '@/types/actions';
import { useLanguage } from '@/context/LanguageContext';

interface ActionCardsProps {
  actions: AnalysisAction[];
}

function getActionIcon(icon?: ActionIconType) {
  switch (icon) {
    case 'radar':
      return <Radar className="w-4 h-4 text-teal-600" />;
    case 'similarity':
      return <GitCompare className="w-4 h-4 text-teal-600" />;
    case 'clustering':
      return <Network className="w-4 h-4 text-teal-600" />;
    case 'compass':
      return <Compass className="w-4 h-4 text-orange-600" />;
    case 'sparkles':
      return <Sparkles className="w-4 h-4 text-orange-600" />;
    case 'users':
      return <Users className="w-4 h-4 text-orange-600" />;
    default:
      return <Sparkles className="w-4 h-4 text-teal-600" />;
  }
}

export default function ActionCards({ actions }: ActionCardsProps) {
  const router = useRouter();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const { t } = useLanguage();

  if (!actions || actions.length === 0) {
    return null;
  }

  const handleActionClick = (action: AnalysisAction) => {
    setActiveActionId(action.id);

    // クエリパラメータの構築
    const searchParams = new URLSearchParams();
    if (action.params) {
      Object.entries(action.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, String(value));
        }
      });
    }

    const queryString = searchParams.toString();
    const destination = queryString ? `${action.targetPage}?${queryString}` : action.targetPage;

    // 画面遷移の実行
    router.push(destination);

    // フィードバック表示タイマー
    setTimeout(() => {
      setActiveActionId(null);
    }, 2500);
  };

  return (
    <div className="my-3.5 space-y-2 pt-1 border-t border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        <span>{t('agent.actions.title', 'おすすめの分析アクション')}</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {actions.map((action) => {
          const isCurrentActive = activeActionId === action.id;

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleActionClick(action)}
              disabled={isCurrentActive}
              className={`group relative text-left w-full p-2.5 rounded-xl border transition-all duration-200 shadow-2xs cursor-pointer flex items-center justify-between gap-3 ${
                isCurrentActive
                  ? 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-500 dark:border-teal-700 ring-2 ring-teal-500/20'
                  : 'bg-white/80 dark:bg-slate-900/80 hover:bg-teal-50/50 dark:hover:bg-slate-800/80 border-slate-200/90 dark:border-slate-800 hover:border-teal-400/80 dark:hover:border-teal-600/80 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                  isCurrentActive
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/60'
                }`}>
                  {isCurrentActive ? (
                    <Check className="w-4 h-4 text-white animate-in zoom-in-75 duration-150" />
                  ) : (
                    getActionIcon(action.icon)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                      {action.title || (action as any).label}
                    </span>
                    {action.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  {action.description && (
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-snug">
                      {action.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {isCurrentActive ? (
                  <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                    {t('agent.actions.applying', '反映中...')}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
