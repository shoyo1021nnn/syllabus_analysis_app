"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div 
      className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 p-0.5 text-xs shadow-2xs select-none"
      role="group"
      aria-label="Language selector"
    >
      <div className="flex items-center pl-1.5 pr-1 text-slate-400 dark:text-slate-500">
        <Globe className="w-3.5 h-3.5" />
      </div>
      <button
        type="button"
        onClick={() => setLanguage("ja")}
        className={`px-2 py-0.5 rounded-md text-2xs font-bold transition-all duration-150 cursor-pointer ${
          language === "ja"
            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
        title="日本語に切り替え"
      >
        JA
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2 py-0.5 rounded-md text-2xs font-bold transition-all duration-150 cursor-pointer ${
          language === "en"
            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
        title="Switch to English"
      >
        EN
      </button>
    </div>
  );
}
