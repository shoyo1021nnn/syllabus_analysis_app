"use client";

import { useChat } from '@ai-sdk/react';
import { Send, User, Bot, Sparkles, Layers, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAnalyticsContext } from '@/context/AnalyticsContext';
import MarkdownMessage from '@/components/MarkdownMessage';

// フォールバック用のデフォルトプリセット質問
const DEFAULT_PRESETS: Record<string, string[]> = {
    radar_chart: [
        "選択中の学科のスキルバランスの特徴は？",
        "強みとなっている上位スキルを教えてください",
        "他学科との主要な差異・改善ポイントは？",
    ],
    clustering: [
        "各クラスタの教育的特徴・傾向を教えて",
        "選択した学科がこのクラスタに属する理由は？",
        "特異なカリキュラムを持つ外れ値はありますか？",
    ],
    similarity: [
        "類似度上位の学科との共通点は何ですか？",
        "類似度が低い学科との決定的な違いは？",
        "この距離指標における結果の解釈を教えて",
    ],
    default: [
        "この科目の前提知識は何ですか？",
        "類似する科目を教えてください",
        "このスキルが身につく科目は？",
    ],
};

export function AgentPanel() {
    const [input, setInput] = useState('');
    const pathname = usePathname();
    const { contextData } = useAnalyticsContext();

    // Vercel AI SDK仕様の useChat
    const { messages, sendMessage, status, setMessages } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isLoading = status === 'submitted' || status === 'streaming';

    // 表示するプリセット質問を決定
    const presetQuestions = useMemo(() => {
        if (contextData.presetQuestions && contextData.presetQuestions.length > 0) {
            return contextData.presetQuestions;
        }
        if (pathname?.includes('radar_chart')) return DEFAULT_PRESETS.radar_chart;
        if (pathname?.includes('clustering')) return DEFAULT_PRESETS.clustering;
        if (pathname?.includes('similarity')) return DEFAULT_PRESETS.similarity;
        return DEFAULT_PRESETS.default;
    }, [contextData.presetQuestions, pathname]);

    // メッセージが増えたら一番下まで自動スクロール
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // プリセットチップをクリックした時の処理
    const handlePresetClick = (question: string) => {
        if (isLoading) return;
        sendMessage(
            { role: 'user', parts: [{ type: 'text', text: question }] },
            { body: { context: contextData } }
        );
    };

    // フォーム送信ハンドラ
    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        sendMessage(
            { role: 'user', parts: [{ type: 'text', text: input }] },
            { body: { context: contextData } }
        );
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-panel">
            {/* === 画面連動コンテキスト表示バッジ & リセットボタン === */}
            {(contextData.pageTitle || contextData.primaryTarget || messages.length > 0) && (
                <div className="px-3.5 py-2 bg-blue-50/90 dark:bg-slate-800/80 border-b border-blue-100 dark:border-slate-700/60 flex items-center justify-between text-xs transition-all">
                    <div className="flex items-center gap-1.5 min-w-0 text-blue-800 dark:text-blue-300">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold shrink-0">{contextData.pageTitle || '画面連動'}</span>
                        {contextData.primaryTarget && (
                            <span className="truncate text-slate-600 dark:text-slate-400 font-normal">
                                : {contextData.primaryTarget}
                            </span>
                        )}
                    </div>
                    {messages.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => setMessages([])}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                                title="会話履歴をクリアして新しい質問を始める"
                            >
                                <RotateCcw className="w-3 h-3 text-slate-500" />
                                <span>リセット</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* === チャット履歴エリア === */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2.5 px-4 text-center">
                        <Sparkles className="w-9 h-9 text-primary/30" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {contextData.pageTitle
                                ? `「${contextData.pageTitle}」の分析についてAIに質問できます`
                                : "シラバスデータについて何でも質問してください"}
                        </p>
                        <p className="text-xs text-slate-400 max-w-xs">
                            画面の選択状態に応じたおすすめの質問チップをクリックするか、下部に質問を入力してください。
                        </p>
                    </div>
                ) : (
                    messages.map(m => (
                        <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {m.role !== 'user' && (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                            )}
                            <div className={`px-4 py-2.5 rounded-2xl max-w-[92%] text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                    : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-foreground rounded-tl-sm shadow-sm'
                                }`}>
                                {m.role === 'user' ? (
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n')}
                                    </div>
                                ) : (
                                    <MarkdownMessage
                                        content={m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n') || ''}
                                    />
                                )}
                            </div>
                            {m.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                                </div>
                            )}
                        </div>
                    ))
                )}

                {/* ローディングアニメーション */}
                {isLoading && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-accent/50 border border-panel-border rounded-tl-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                            <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* === 入力＆プリセットエリア === */}
            <div className="p-4 border-t border-panel-border bg-panel shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
                {/* プリセットチップ */}
                <div className="flex flex-wrap gap-1.5 mb-3 max-h-24 overflow-y-auto pr-1">
                    {presetQuestions.map((q, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => handlePresetClick(q)}
                            disabled={isLoading}
                            className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-950 dark:hover:text-blue-300 transition-all duration-150 border border-slate-200 dark:border-slate-700 text-left disabled:opacity-50 cursor-pointer"
                        >
                            💡 {q}
                        </button>
                    ))}
                </div>

                {/* チャット入力フォーム */}
                <form onSubmit={onSubmit} className="flex gap-2">
                    <input
                        value={input || ''}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="メッセージを入力..."
                        className="flex-1 bg-background border border-panel-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!input?.trim() || isLoading}
                        className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors shadow-sm"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
