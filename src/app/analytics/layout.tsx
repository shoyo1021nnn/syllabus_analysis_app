"use client";

import { Panel, Group, Separator } from "react-resizable-panels";
import { GripVertical } from "lucide-react";
import { Suspense } from "react";
import { AgentPanel } from "@/components/AgentPanel";

export default function AnalyticsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen w-full bg-background flex flex-col">
            {/* グローバルヘッダー */}
            <header className="h-14 border-b border-panel-border bg-panel flex items-center px-6 shadow-sm z-10">
                <h1 className="text-xl font-bold font-sans bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                    Syllabus Analysis App
                </h1>
            </header>

            <main className="flex-1 overflow-hidden">
                <Group orientation="horizontal" className="h-full w-full">

                    {/* 左側の分析画面パネル (デフォルト 2/3) */}
                    <Panel defaultSize={67} minSize={30} className="bg-panel relative">
                        <div className="h-full overflow-y-auto p-6">
                            {children}
                        </div>
                    </Panel>

                    {/* ドラッグ可能なリサイズハンドル */}
                    <Separator className="w-1.5 bg-panel-border hover:bg-primary/50 transition-colors duration-200 flex items-center justify-center cursor-col-resize group z-20">
                        <div className="h-8 w-1 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-primary transition-all duration-300 flex items-center justify-center scale-100 group-hover:scale-110">
                            <GripVertical className="h-4 w-4 text-transparent group-hover:text-white/80 transition-colors" />
                        </div>
                    </Separator>

                    {/* 右側のAIエージェントパネル (デフォルト 1/3) */}
                    <Panel defaultSize={33} minSize={20} className="bg-panel border-l border-panel-border flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.03)] dark:shadow-[-4px_0_15px_rgba(0,0,0,0.2)]">
                        {/* エージェントパネルのヘッダー */}
                        <div className="p-4 border-b border-panel-border bg-accent/30 backdrop-blur-sm">
                            <h2 className="font-semibold flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                Syllabus Analysis App
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
    );
}
