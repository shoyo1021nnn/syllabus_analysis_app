'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Building2 } from 'lucide-react';

export interface SearchableSelectProps {
  label?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  colorScheme?: 'blue' | 'indigo' | 'rose';
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = '大学名を検索・選択...',
  colorScheme = 'blue',
  disabled = false,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 配色設定
  const theme = useMemo(() => {
    switch (colorScheme) {
      case 'rose':
        return {
          label: 'text-rose-700',
          icon: 'text-rose-600',
          border: 'border-rose-200',
          focusRing: 'focus:ring-rose-500 focus:border-rose-500',
          activeBg: 'bg-rose-50 text-rose-900',
          checkIcon: 'text-rose-600',
          badgeBg: 'bg-rose-100 text-rose-800',
          hoverBg: 'hover:bg-rose-50/60',
        };
      case 'indigo':
        return {
          label: 'text-indigo-800',
          icon: 'text-indigo-600',
          border: 'border-indigo-200',
          focusRing: 'focus:ring-indigo-500 focus:border-indigo-500',
          activeBg: 'bg-indigo-50 text-indigo-900',
          checkIcon: 'text-indigo-600',
          badgeBg: 'bg-indigo-100 text-indigo-800',
          hoverBg: 'hover:bg-indigo-50/60',
        };
      case 'blue':
      default:
        return {
          label: 'text-blue-800',
          icon: 'text-blue-600',
          border: 'border-blue-200',
          focusRing: 'focus:ring-blue-500 focus:border-blue-500',
          activeBg: 'bg-blue-50 text-blue-900',
          checkIcon: 'text-blue-600',
          badgeBg: 'bg-blue-100 text-blue-800',
          hoverBg: 'hover:bg-blue-50/60',
        };
    }
  }, [colorScheme]);

  // 外側クリック検知
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ドロップダウンを開いた時に検索欄へフォーカス
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // キーボード検索による絞り込み候補
  const filteredOptions = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) return options;
    return options.filter((opt) => opt.toLowerCase().includes(trimmed));
  }, [options, searchTerm]);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('全ての大学');
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative space-y-1.5 ${className}`}>
      {label && (
        <label className={`text-2xs font-bold flex items-center gap-1 ${theme.label}`}>
          <Building2 className={`w-3.5 h-3.5 ${theme.icon}`} />
          {label}
        </label>
      )}

      {/* トリガーセレクターボタン */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs bg-white border ${theme.border} rounded-lg shadow-2xs transition cursor-pointer select-none ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-slate-300'
        } ${isOpen ? `ring-2 ${theme.focusRing}` : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className={`w-3.5 h-3.5 shrink-0 ${theme.icon}`} />
          <span className={`truncate font-medium ${value === '全ての大学' ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
            {value || '全ての大学'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1.5">
          {value && value !== '全ての大学' && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="絞り込みを解除（全ての大学）"
              className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-40 mt-1 bg-white border ${theme.border} rounded-xl shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100`}
        >
          {/* 検索入力フィールド */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 大学リスト一覧 */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                該当する大学が見つかりません
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition text-left cursor-pointer ${theme.hoverBg} ${
                      isSelected ? theme.activeBg : 'text-slate-700'
                    }`}
                  >
                    <span className={`truncate ${isSelected ? 'font-bold' : 'font-medium'}`}>
                      {opt}
                    </span>
                    {isSelected && (
                      <Check className={`w-3.5 h-3.5 shrink-0 ml-1.5 ${theme.checkIcon}`} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
