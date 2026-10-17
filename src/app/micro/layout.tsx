"use client";

import { Suspense } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { GripVertical, LayoutDashboard, GraduationCap, Sparkles, ArrowLeft, Home, Compass } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AgentPanel } from "@/components/AgentPanel";
import { AnalyticsProvider } from "@/context/AnalyticsContext";

const MICRO_NAV_TABS = [
  { href: '/micro', label: 'ミクロ支援トップ', icon: LayoutDashboard, exact: true },
  { href: '/micro/portfolio', label: '履修・スキルポートフォリオ', icon: GraduationCap },
  { href: '/micro/recommendation', label: '不足スキル補完・科目推薦', icon: Sparkles },
];

export default function MicroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnalyticsProvider>
      <div className="h-screen w-full bg-background flex flex-col">
        {/* グローバルヘッダー */}
        <header className="h-14 border-b border-panel-border bg-panel flex items-center justify-between px-6 shadow-xs z-10 shrink-0">
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
              title="ポータルホームに戻る"
            >
              <Home className="w-4 h-4" />
              <span>ホーム</span>
            </Link>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            <Link href="/micro" className="flex items-center space-x-2 group shrink-0">
              <h1 className="text-lg font-bold font-sans bg-clip-text text-transparent bg-linear-to-r from-indigo-600 via-indigo-700 to-blue-600 group-hover:opacity-85 transition">
                ミクロな学習支援
              </h1>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Micro Support
              </span>
            </Link>
          </div>

          {/* ナビゲーションタブ ＆ 他画面へのリンク */}
          <div className="flex items-center space-x-3 overflow-x-auto py-1">
            <nav className="flex items-center gap-1.5">
              {MICRO_NAV_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.exact ? pathname === tab.href : pathname?.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold border-2 border-indigo-600 shadow-2xs ring-2 ring-indigo-500/10'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            <div className="flex items-center space-x-1.5">
              <Link
                href="/macro"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition shadow-2xs"
                title="マクロな学習支援へ移動"
              >
                <Compass className="w-3.5 h-3.5 text-orange-600" />
                <span>マクロ支援</span>
              </Link>
              <Link
                href="/analytics"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition shadow-2xs"
                title="スキルベクトル分析画面へ移動"
              >
                <span>分析結果へ</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <Group orientation="horizontal" className="h-full w-full">
            {/* 左側の分析画面パネル (デフォルト 2/3) */}
            <Panel defaultSize={67} minSize={30} className="bg-panel relative">
              <div className="h-full overflow-y-auto p-6">
                <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">読み込み中...</div>}>
                  {children}
                </Suspense>
              </div>
            </Panel>

            {/* ドラッグ可能なリサイズハンドル */}
            <Separator className="w-1.5 bg-panel-border hover:bg-indigo-500/50 transition-colors duration-200 flex items-center justify-center cursor-col-resize group z-20">
              <div className="h-8 w-1 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-600 transition-all duration-300 flex items-center justify-center scale-100 group-hover:scale-110">
                <GripVertical className="h-4 w-4 text-transparent group-hover:text-white/80 transition-colors" />
              </div>
            </Separator>

            {/* 右側のAIエージェントパネル (デフォルト 1/3) */}
            <Panel defaultSize={33} minSize={20} className="bg-panel border-l border-panel-border flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.03)] dark:shadow-[-4px_0_15px_rgba(0,0,0,0.2)]">
              <div className="p-4 border-b border-panel-border bg-accent/30 backdrop-blur-xs flex items-center">
                <h2 className="font-semibold flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  Syllabus AI
                </h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div className="p-6 text-center text-slate-400 text-sm">Agent is starting...</div>}>
                  <AgentPanel />
                </Suspense>
              </div>
            </Panel>
          </Group>
        </main>
      </div>
    </AnalyticsProvider>
  );
}
