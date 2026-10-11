"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface AnalyticsContextData {
  pageTitle?: string;
  pagePath?: string;
  primaryTarget?: string;
  compareTarget?: string;
  summaryText?: string;
  details?: Record<string, any>;
  presetQuestions?: string[];
}

interface AnalyticsContextType {
  contextData: AnalyticsContextData;
  setAnalyticsContext: (
    data: Partial<AnalyticsContextData> | ((prev: AnalyticsContextData) => AnalyticsContextData)
  ) => void;
  clearAnalyticsContext: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [contextData, setContextData] = useState<AnalyticsContextData>({});

  const setAnalyticsContext = useCallback(
    (data: Partial<AnalyticsContextData> | ((prev: AnalyticsContextData) => AnalyticsContextData)) => {
      setContextData((prev) => {
        if (typeof data === 'function') {
          return data(prev);
        }
        return {
          ...prev,
          ...data,
        };
      });
    },
    []
  );

  const clearAnalyticsContext = useCallback(() => {
    setContextData({});
  }, []);

  return (
    <AnalyticsContext.Provider value={{ contextData, setAnalyticsContext, clearAnalyticsContext }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
}
