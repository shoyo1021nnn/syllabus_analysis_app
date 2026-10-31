"use client";

import React, { useState } from 'react';
import ReactMarkdown, { type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import ActionCards from '@/components/ActionCards';
import { useLanguage } from '@/context/LanguageContext';

interface CodeBlockProps {
  language: string;
  value: string;
}

function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-slate-700/80 bg-[#1e1e1e] text-xs font-mono shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-slate-700/60 text-slate-300">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 px-2 py-0.5 rounded transition cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">{t('common.copied', 'コピー完了')}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>{t('common.copy', 'コピー')}</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-3 text-[12px] leading-relaxed">
        <SyntaxHighlighter
          language={language || 'text'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: 0,
            background: 'transparent',
            fontSize: '12px',
            lineHeight: '1.6',
          }}
          wrapLongLines={false}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

interface MarkdownMessageProps {
  content: string;
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="markdown-content text-sm leading-relaxed space-y-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & ExtraProps & { inline?: boolean }) {
            const match = /language-([a-zA-Z0-9_-]+)/.exec(className || '');
            const lang = match ? match[1].toLowerCase() : '';
            const codeString = String(children).replace(/\n$/, '');

            // analysis-actions, actions, またはアクション配列を含むjsonの場合はアクションカードとして描画
            if (!inline) {
              const isActionTag = lang === 'analysis-actions' || lang === 'analysis_actions' || lang === 'actions';
              if (isActionTag || lang === 'json' || !lang) {
                try {
                  const parsed = JSON.parse(codeString);
                  if (
                    Array.isArray(parsed) &&
                    parsed.length > 0 &&
                    parsed[0].targetPage &&
                    (parsed[0].title || parsed[0].label)
                  ) {
                    return <ActionCards actions={parsed} />;
                  }
                } catch {
                  // ストリーミング途中または純粋なコードの場合は通常レンダリングへ
                }
              }
            }

            if (!inline && (match || codeString.includes('\n'))) {
              return <CodeBlock language={lang} value={codeString} />;
            }
            return (
              <code
                className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11.5px] border border-slate-200/80 dark:border-slate-700"
                {...props}
              >
                {children}
              </code>
            );
          },
          h1({ children }) {
            return (
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-700 first:mt-0">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 mt-3.5 mb-2 pb-1 border-b border-slate-200 dark:border-slate-700 first:mt-0">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 mt-3 mb-1.5">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">
                {children}
              </h4>
            );
          },
          p({ children }) {
            return (
              <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 mb-2 last:mb-0">
                {children}
              </p>
            );
          },
          ul({ children }) {
            return (
              <ul className="my-2 pl-4 space-y-1 list-disc marker:text-blue-500 text-[13px] text-slate-700 dark:text-slate-300">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="my-2 pl-4 space-y-1 list-decimal marker:text-blue-500 text-[13px] text-slate-700 dark:text-slate-300">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          strong({ children }) {
            return <strong className="font-bold text-slate-900 dark:text-slate-100">{children}</strong>;
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <table className="w-full text-xs text-left border-collapse">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
                {children}
              </thead>
            );
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800/80 border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                {children}
              </td>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-blue-500 pl-3 my-2 text-xs italic text-slate-500 dark:text-slate-400 bg-blue-50/40 dark:bg-blue-950/20 py-1 rounded-r">
                {children}
              </blockquote>
            );
          },
          hr() {
            return <hr className="my-3 border-slate-200 dark:border-slate-700" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
