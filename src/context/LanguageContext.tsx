"use client";

import React, { createContext, useContext, useSyncExternalStore, ReactNode } from "react";
import { ja } from "@/locales/ja";
import { en } from "@/locales/en";

export type Language = "ja" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "syllabus_app_language";

// ------------------------------------------------------------
// 表示言語のストア（localStorage）
// 以前はマウント後の useEffect で localStorage を読み setState していた（react-hooks/set-state-in-effect）。
// useSyncExternalStore で外部ストアとして読む形に変更。
// - サーバーレンダー・ハイドレーション中は "ja"、その後 localStorage の値（従来どおり）
// - このタブで一度切り替えたら、その値を優先する（保存に失敗してもこのタブでは切り替わる：従来どおり）
// ------------------------------------------------------------
let selectedInThisTab: Language | null = null;
const languageListeners = new Set<() => void>();

function readStoredLanguage(): Language | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "ja" || saved === "en" ? saved : null;
  } catch (e) {
    console.warn("Failed to access localStorage for language:", e);
    return null;
  }
}

function getLanguageSnapshot(): Language {
  return selectedInThisTab ?? readStoredLanguage() ?? "ja";
}

function getLanguageServerSnapshot(): Language {
  return "ja";
}

function subscribeLanguage(listener: () => void) {
  languageListeners.add(listener);
  return () => {
    languageListeners.delete(listener);
  };
}

function storeLanguage(lang: Language) {
  selectedInThisTab = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    console.warn("Failed to save language to localStorage:", e);
  }
  languageListeners.forEach((l) => l());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribeLanguage, getLanguageSnapshot, getLanguageServerSnapshot);

  const setLanguage = (lang: Language) => {
    storeLanguage(lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === "ja" ? "en" : "ja");
  };

  // ドット記法キー (例: "nav.home") を辞書から再帰的に安全に取得
  const t = (path: string, fallback?: string): string => {
    const dict = language === "en" ? en : ja;
    const keys = path.split(".");
    let current: unknown = dict;
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return fallback || path;
      }
    }
    return typeof current === "string" ? current : fallback || path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
