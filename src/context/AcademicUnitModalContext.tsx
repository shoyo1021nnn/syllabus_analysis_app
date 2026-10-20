"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SkillVectorDepartment } from '@/types/database';

export interface AcademicUnitTarget {
  id?: string;
  universityName: string;
  facultyName?: string;
  departmentName?: string;
  subjectCount?: number;
  websiteUrl?: string | null;
  level?: 'university' | 'faculty' | 'department';
  knowledgeVector?: number[];
  generalVector?: number[];
}

export interface DepartmentSiblingItem {
  id: string;
  departmentName: string;
  subjectCount: number;
  websiteUrl?: string | null;
}

interface AcademicUnitModalContextType {
  isOpen: boolean;
  targetUnit: AcademicUnitTarget | null;
  siblingDepartments: DepartmentSiblingItem[];
  isLoadingSiblings: boolean;
  openUnitInfo: (target: AcademicUnitTarget) => void;
  closeUnitInfo: () => void;
}

const AcademicUnitModalContext = createContext<AcademicUnitModalContextType | undefined>(undefined);

// 学科キャッシュ（全学科データを一度取得したら再利用）
let globalDeptCache: SkillVectorDepartment[] | null = null;

export function AcademicUnitModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetUnit, setTargetUnit] = useState<AcademicUnitTarget | null>(null);
  const [siblingDepartments, setSiblingDepartments] = useState<DepartmentSiblingItem[]>([]);
  const [isLoadingSiblings, setIsLoadingSiblings] = useState(false);

  // 同一学部の学科ツリーを探索・ロード
  const loadSiblings = useCallback(async (univName: string, facName?: string) => {
    if (!facName) {
      setSiblingDepartments([]);
      return;
    }

    setIsLoadingSiblings(true);

    try {
      let deptList = globalDeptCache;

      if (!deptList && isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('skill_vector_department')
          .select('id, university_name, faculty_name, department_name, subject_count, website_url')
          .order('department_name', { ascending: true });

        if (!error && data) {
          globalDeptCache = data as SkillVectorDepartment[];
          deptList = globalDeptCache;
        }
      }

      if (deptList) {
        const filtered = deptList.filter(
          (d) => d.university_name === univName && d.faculty_name === facName
        );
        const siblings: DepartmentSiblingItem[] = filtered.map((d) => ({
          id: d.id,
          departmentName: d.department_name,
          subjectCount: d.subject_count,
          websiteUrl: d.website_url,
        }));
        setSiblingDepartments(siblings);
      } else {
        setSiblingDepartments([]);
      }
    } catch (err) {
      console.error('Failed to load sibling departments:', err);
      setSiblingDepartments([]);
    } finally {
      setIsLoadingSiblings(false);
    }
  }, []);

  const openUnitInfo = useCallback(
    (target: AcademicUnitTarget) => {
      setTargetUnit(target);
      setIsOpen(true);
      loadSiblings(target.universityName, target.facultyName);
    },
    [loadSiblings]
  );

  const closeUnitInfo = useCallback(() => {
    setIsOpen(false);
    setTargetUnit(null);
    setSiblingDepartments([]);
  }, []);

  return (
    <AcademicUnitModalContext.Provider
      value={{
        isOpen,
        targetUnit,
        siblingDepartments,
        isLoadingSiblings,
        openUnitInfo,
        closeUnitInfo,
      }}
    >
      {children}
    </AcademicUnitModalContext.Provider>
  );
}

export function useAcademicUnitModal() {
  const context = useContext(AcademicUnitModalContext);
  if (!context) {
    throw new Error('useAcademicUnitModal must be used within an AcademicUnitModalProvider');
  }
  return context;
}
