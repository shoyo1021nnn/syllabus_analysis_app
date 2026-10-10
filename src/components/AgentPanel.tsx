"use client";

import { useChat } from '@ai-sdk/react';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// 仮のプリセット質問（Phase 4で画面の文脈に応じて動的に切り替えます）
const PRESET_QUESTIONS = [
    "この科目の前提知識は何ですか？",
    "類似する科目を教えてください",
    "このスキルが身につく科目は？"
];

export function AgentPanel() {
    const [input, setInput] = useState('');
    // Vercel AI SDK v7仕様の useChat
    const { messages, sendMessage, status } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isLoading = status === 'submitted' || status === 'streaming';

    // メッセージが増えたら一番下まで自動スクロール
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // プリセットチップをクリックした時の処理
    const handlePresetClick = (question: string) => {
        sendMessage({ role: 'user', parts: [{ type: 'text', text: question }] });
    };

    // フォーム送信ハンドラ
    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] });
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-panel">
            {/* === チャット履歴エリア === */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                        <Sparkles className="w-10 h-10 text-primary/30" />
                        <p className="text-sm font-medium">シラバスデータについて何でも質問してください</p>
                    </div>
                ) : (
                    messages.map(m => (
                        <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {m.role !== 'user' && (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                            )}
                            <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                    : 'bg-accent/50 border border-panel-border text-foreground rounded-tl-sm'
                                }`}>
                                {/* テキストパートを抽出して表示 */}
                                {m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n')}
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
                <div className="flex flex-wrap gap-2 mb-3">
                    {PRESET_QUESTIONS.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => handlePresetClick(q)}
                            className="text-xs px-3 py-1.5 rounded-full bg-accent text-accent-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 border border-panel-border"
                        >
                            {q}
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
