"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";

/**
 * AI エージェントのチャット履歴をアプリ全体で 1 つだけ保持するためのコンテキスト。
 *
 * - ルートレイアウト（src/app/layout.tsx）に置くことで、analytics / macro / micro / universities の
 *   各セクション layout をまたいで移動しても Chat インスタンス（＝メッセージ履歴・ストリーミング状態）が破棄されない。
 * - AgentPanel は `useChat({ chat })` でこのインスタンスを共有する（@ai-sdk/react の外部 Chat 方式）。
 * - 画面文脈（AnalyticsContext）は各セクションの layout に残し、送信時に AgentPanel が body に付与する。
 * - 履歴はメモリのみで保持し、ページの再読み込みで消える。
 */
const ChatContext = createContext<Chat<UIMessage> | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  // 初回レンダー時に 1 度だけ生成し、以後は同じインスタンスを使い続ける
  const [chat] = useState(
    () =>
      new Chat<UIMessage>({
        // id を省略すると構築時に generateId()（Math.random）が呼ばれ、Next.js 16 のプリレンダーで
        // blocking-prerender-random-client エラーになる。アプリ内で Chat は 1 つだけなので固定 ID でよい
        id: "syllabus-agent",
        transport: new DefaultChatTransport({ api: "/api/chat" }),
      })
  );

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useSharedChat() {
  const chat = useContext(ChatContext);
  if (!chat) {
    throw new Error("useSharedChat must be used within a ChatProvider");
  }
  return chat;
}
