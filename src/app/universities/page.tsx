"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  SkillVectorDepartment, 
  SkillVectorFaculty, 
  SkillVectorUniversity 
} from '@/types/database';
import { useAnalyticsContext } from '@/context/AnalyticsContext';
import { useAcademicUnitModal } from '@/context/AcademicUnitModalContext';
import { useLanguage } from '@/context/LanguageContext';
import { KNOWLEDGE_SKILLS, GENERAL_SKILLS } from '@/lib/vectorUtils';
import { 
  Building2, 
  BookOpen, 
  ExternalLink, 
  Layers, 
  GraduationCap, 
  Sparkles, 
  ChevronRight, 
  Radar, 
  GitCompare, 
  Compass, 
  CheckCircle2, 
  ArrowRight,
  Globe,
  Database
} from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';
import DatabaseErrorBanner from '@/components/DatabaseErrorBanner';
import { DbErrorInfo, errorDetail } from '@/lib/dbError';

// フォールバック用のダミーデータ（万一Supabase接続不可時の安全策）
const MOCK_UNIVERSITIES: SkillVectorUniversity[] = [
  {
    id: 'u-kyushu',
    university_name: '九州大学',
    subject_count: 3827,
    website_url: 'https://www.kyushu-u.ac.jp/ja/',
    knowledge_vector: [2.5, 4.2, 1.8, 12.4, 8.5, 22.1, 15.4, 25.8, 8.4, 6.2, 12.1, 3.4],
    general_vector:   [15.2, 22.4, 9.8, 8.4, 12.1, 18.5, 9.2, 12.1, 14.5, 16.8, 18.4, 11.2],
  },
  {
    id: 'u-chubu',
    university_name: '中部大学',
    subject_count: 4329,
    website_url: 'https://www.chubu.ac.jp/',
    knowledge_vector: [3.1, 5.8, 2.1, 14.2, 12.5, 16.4, 18.2, 22.1, 9.5, 4.1, 14.2, 6.5],
    general_vector:   [14.8, 20.1, 11.2, 9.5, 11.8, 17.2, 10.1, 11.5, 13.8, 17.5, 19.1, 10.4],
  },
];

const MOCK_FACULTIES: SkillVectorFaculty[] = [
  {
    id: 'f-eng-kyushu',
    university_name: '九州大学',
    faculty_name: '工学部',
    subject_count: 820,
    website_url: 'https://www.eng.kyushu-u.ac.jp/',
    knowledge_vector: [1.2, 0.4, 0.5, 2.1, 2.8, 16.8, 28.5, 34.5, 14.1, 0.4, 0.1, 0.2],
    general_vector:   [14.5, 21.8, 5.8, 3.5, 7.8, 18.1, 7.5, 11.2, 7.9, 15.2, 17.5, 8.4],
  },
  {
    id: 'f-sci-kyushu',
    university_name: '九州大学',
    faculty_name: '理学部',
    subject_count: 390,
    website_url: 'https://www.sci.kyushu-u.ac.jp/',
    knowledge_vector: [0.8, 0.5, 0.2, 1.5, 1.2, 45.2, 12.1, 8.4, 5.2, 2.1, 0.8, 0.5],
    general_vector:   [12.1, 26.4, 8.2, 4.2, 10.5, 20.1, 6.8, 14.2, 9.1, 14.5, 15.2, 6.5],
  },
];

const MOCK_DEPARTMENTS: SkillVectorDepartment[] = [
  {
    id: 'd-mech-kyushu',
    university_name: '九州大学',
    faculty_name: '工学部',
    department_name: '機械航空工学科',
    subject_count: 142,
    website_url: 'https://www.eng.kyushu-u.ac.jp/mech/',
    knowledge_vector: [1.8, 0.5, 0.8, 2.5, 3.8, 18.4, 15.2, 32.1, 12.4, 0.8, 0.2, 0.4],
    general_vector:   [15.1, 24.2, 7.1, 3.8, 8.4, 19.5, 8.1, 12.4, 8.2, 16.5, 18.2, 9.1],
  },
  {
    id: 'd-elec-kyushu',
    university_name: '九州大学',
    faculty_name: '工学部',
    department_name: '電気情報工学科',
    subject_count: 156,
    website_url: 'https://www.eecs.kyushu-u.ac.jp/',
    knowledge_vector: [2.1, 0.8, 1.2, 3.4, 4.1, 15.2, 28.5, 24.3, 8.1, 1.0, 0.5, 0.8],
    general_vector:   [14.2, 22.5, 8.3, 4.1, 9.5, 18.2, 7.4, 11.3, 9.8, 19.1, 21.4, 8.2],
  },
];

export default function UniversitiesPage() {
  const { language, t } = useLanguage();
  const { setAnalyticsContext } = useAnalyticsContext();
  const { openUnitInfo } = useAcademicUnitModal();

  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<DbErrorInfo | null>(null);

  // DBデータ
  const [universities, setUniversities] = useState<SkillVectorUniversity[]>([]);
  const [faculties, setFaculties] = useState<SkillVectorFaculty[]>([]);
  const [departments, setDepartments] = useState<SkillVectorDepartment[]>([]);

  // 選択状態
  const [selectedUnivName, setSelectedUnivName] = useState<string>('');
  const [selectedFacName, setSelectedFacName] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  // 1. Supabaseから全階層データをロード
  useEffect(() => {
    async function fetchHierarchyData() {
      setIsLoading(true);

      if (!isSupabaseConfigured) {
        setDbError({ key: 'notConfiguredMock' });
        setUniversities(MOCK_UNIVERSITIES);
        setFaculties(MOCK_FACULTIES);
        setDepartments(MOCK_DEPARTMENTS);
        setSelectedUnivName('九州大学');
        setSelectedFacName('工学部');
        setSelectedDeptId('d-mech-kyushu');
        setIsLoading(false);
        return;
      }

      try {
        const [resUniv, resFac, resDept] = await Promise.all([
          supabase.from('skill_vector_university').select('*').order('university_name'),
          supabase.from('skill_vector_faculty').select('*').order('faculty_name'),
          supabase.from('skill_vector_department').select('*').order('department_name'),
        ]);

        if (resUniv.error || resFac.error || resDept.error) {
          const errMsg = resUniv.error?.message || resFac.error?.message || resDept.error?.message;
          console.error('Error fetching university data:', errMsg);
          setDbError({ key: 'fetchFailed', params: { detail: errMsg ?? '' } });
          setUniversities(MOCK_UNIVERSITIES);
          setFaculties(MOCK_FACULTIES);
          setDepartments(MOCK_DEPARTMENTS);
          setSelectedUnivName('九州大学');
          setSelectedFacName('工学部');
          setSelectedDeptId('d-mech-kyushu');
        } else {
          setDbError(null);
          // 実験用レコード（gpt-5.6-terra等）を除外または正式大学を優先
          const validUnivs = (resUniv.data || []).filter(
            (u) => !u.university_name.includes('gpt-')
          );
          const validFacs = (resFac.data || []).filter(
            (f) => !f.university_name.includes('gpt-')
          );
          const validDepts = (resDept.data || []).filter(
            (d) => !d.university_name.includes('gpt-')
          );

          setUniversities(validUnivs);
          setFaculties(validFacs);
          setDepartments(validDepts);

          // 初期選択: 九州大学を優先、なければ先頭
          const initialUniv = validUnivs.find((u) => u.university_name === '九州大学') || validUnivs[0];
          if (initialUniv) {
            setSelectedUnivName(initialUniv.university_name);
            const univFacs = validFacs.filter((f) => f.university_name === initialUniv.university_name);
            if (univFacs.length > 0) {
              setSelectedFacName(univFacs[0].faculty_name);
              const facDepts = validDepts.filter(
                (d) => d.university_name === initialUniv.university_name && d.faculty_name === univFacs[0].faculty_name
              );
              if (facDepts.length > 0) {
                setSelectedDeptId(facDepts[0].id);
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Fetch exception:', err);
        setDbError({ key: 'networkError', params: { detail: errorDetail(err) } });
        setUniversities(MOCK_UNIVERSITIES);
        setFaculties(MOCK_FACULTIES);
        setDepartments(MOCK_DEPARTMENTS);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHierarchyData();
  }, []);

  // 大学名リスト（重複なし）
  const universityNames = useMemo(() => {
    return universities.map((u) => u.university_name);
  }, [universities]);

  // 現在選択されている大学のレコード
  const currentUniv = useMemo(() => {
    return universities.find((u) => u.university_name === selectedUnivName) || null;
  }, [universities, selectedUnivName]);

  // 選択大学に属する学部一覧
  const currentFaculties = useMemo(() => {
    if (!selectedUnivName) return [];
    return faculties.filter((f) => f.university_name === selectedUnivName);
  }, [faculties, selectedUnivName]);

  // 現在選択されている学部のレコード
  const currentFac = useMemo(() => {
    if (!selectedFacName) return null;
    return currentFaculties.find((f) => f.faculty_name === selectedFacName) || null;
  }, [currentFaculties, selectedFacName]);

  // 選択大学・学部に属する学科一覧
  const currentDepartments = useMemo(() => {
    if (!selectedUnivName || !selectedFacName) return [];
    return departments.filter(
      (d) => d.university_name === selectedUnivName && d.faculty_name === selectedFacName
    );
  }, [departments, selectedUnivName, selectedFacName]);

  // 現在選択されている学科のレコード
  const currentDept = useMemo(() => {
    if (!selectedDeptId) return null;
    return currentDepartments.find((d) => d.id === selectedDeptId) || null;
  }, [currentDepartments, selectedDeptId]);

  // 大学変更ハンドラ
  const handleSelectUniversity = (univName: string) => {
    setSelectedUnivName(univName);
    const relatedFacs = faculties.filter((f) => f.university_name === univName);
    if (relatedFacs.length > 0) {
      setSelectedFacName(relatedFacs[0].faculty_name);
      const relatedDepts = departments.filter(
        (d) => d.university_name === univName && d.faculty_name === relatedFacs[0].faculty_name
      );
      setSelectedDeptId(relatedDepts.length > 0 ? relatedDepts[0].id : '');
    } else {
      setSelectedFacName('');
      setSelectedDeptId('');
    }
  };

  // 学部変更ハンドラ
  const handleSelectFaculty = (facName: string) => {
    setSelectedFacName(facName);
    const relatedDepts = departments.filter(
      (d) => d.university_name === selectedUnivName && d.faculty_name === facName
    );
    setSelectedDeptId(relatedDepts.length > 0 ? relatedDepts[0].id : '');
  };

  // 学科変更ハンドラ
  const handleSelectDepartment = (deptId: string) => {
    setSelectedDeptId(deptId);
  };

  // Topスキル算出ヘルパー
  const getTopSkills = (vec: number[] = [], skills: typeof KNOWLEDGE_SKILLS, count = 3) => {
    if (!vec || vec.length === 0) return [];
    return vec
      .map((val, idx) => ({ 
        name: language === 'en' ? (skills[idx]?.nameEn || skills[idx]?.nameJa || '') : (skills[idx]?.nameJa || ''), 
        val 
      }))
      .sort((a, b) => b.val - a.val)
      .slice(0, count);
  };

  // AIエージェントへの画面コンテキスト共有
  useEffect(() => {
    if (!selectedUnivName) return;

    const currentTitle = currentDept 
      ? `【${selectedUnivName}】${selectedFacName} ${currentDept.department_name}`
      : currentFac 
      ? `【${selectedUnivName}】${selectedFacName}`
      : `【${selectedUnivName}】`;

    const isEn = language === 'en';
    const presets = isEn ? [
      `Tell me about the faculty & department structure and scale of "${selectedUnivName}"`,
      ...(currentFac ? [`What are the characteristics of "${selectedUnivName} ${currentFac.faculty_name}"?`] : []),
      ...(currentDept ? [
        `What are the curriculum and syllabus skill strengths of "${currentDept.department_name}"?`,
        `Which departments in other universities have a curriculum similar to "${currentDept.department_name}"?`,
      ] : []),
    ] : [
      `「${selectedUnivName}」の学部・学科構成の特徴と全体規模を教えて`,
      ...(currentFac ? [`「${selectedUnivName} ${currentFac.faculty_name}」の学科構成と科目数の特徴は？`] : []),
      ...(currentDept ? [
        `「${currentDept.department_name}」のカリキュラムとシラバススキルの強みは？`,
        `「${currentDept.department_name}」と類似したカリキュラムを持つ他大学の学科は？`,
      ] : []),
    ];

    setAnalyticsContext({
      pageTitle: t('universities.title'),
      pagePath: '/universities',
      primaryTarget: currentTitle,
      summaryText: isEn 
        ? `Academic units and website directory (Currently selected: ${currentTitle})`
        : `大学・学部・学科の基本情報ディレクトリ（現在選択中: ${currentTitle}）`,
      details: {
        university: {
          name: selectedUnivName,
          subjectCount: currentUniv?.subject_count,
          websiteUrl: currentUniv?.website_url,
          facultyCount: currentFaculties.length,
        },
        faculty: currentFac ? {
          name: currentFac.faculty_name,
          subjectCount: currentFac.subject_count,
          websiteUrl: currentFac.website_url,
          departmentCount: currentDepartments.length,
        } : null,
        department: currentDept ? {
          name: currentDept.department_name,
          subjectCount: currentDept.subject_count,
          websiteUrl: currentDept.website_url,
        } : null,
      },
      presetQuestions: presets,
    });
  }, [selectedUnivName, selectedFacName, selectedDeptId, currentUniv, currentFac, currentDept, currentFaculties, currentDepartments, setAnalyticsContext, language, t]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* ページタイトル ＆ ヘッダー */}
      <div className="bg-linear-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 border border-white/15 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>{t('universities.badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('universities.title')}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {t('universities.subtitle')}
          </p>
        </div>
      </div>

      {/* データベースエラーバナー */}
      {dbError && <DatabaseErrorBanner error={dbError} />}

      {/* ナビゲーション パンくずバー */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-2 text-xs overflow-x-auto">
        <span className="font-semibold text-slate-500 flex items-center gap-1 shrink-0">
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          {t('universities.currentHierarchy')}
        </span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <button
          onClick={() => {}}
          className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0"
        >
          {selectedUnivName || t('universities.unselectedUniv')}
        </button>
        {selectedFacName && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <button
              onClick={() => setSelectedDeptId('')}
              className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700 shrink-0"
            >
              {selectedFacName}
            </button>
          </>
        )}
        {currentDept && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-200/60 dark:bg-emerald-800/60 px-2 py-0.5 rounded-md border border-emerald-400/50 dark:border-emerald-600 shrink-0">
              {currentDept.department_name}
            </span>
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* STEP 1: 大学の選択 ＆ 大学基本情報カード */}
      {/* ======================================================== */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shadow-xs shadow-emerald-700/30">
              1
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('universities.step1Title')}
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {t('universities.totalUnivCount').replace('{{count}}', String(universityNames.length))}
          </span>
        </div>

        {/* 大学選択コントロール */}
        <div className="space-y-3">
          <div className="max-w-md">
            <SearchableSelect
              label={t('universities.selectUnivLabel')}
              options={universityNames}
              value={selectedUnivName}
              onChange={handleSelectUniversity}
              placeholder={t('universities.searchUnivPlaceholder')}
              colorScheme="emerald"
            />
          </div>

          {/* クイック切替ピル */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-2xs text-slate-400 self-center mr-1">{t('universities.quickSwitch')}</span>
            {universityNames.slice(0, 7).map((univ) => {
              const isActive = univ === selectedUnivName;
              return (
                <button
                  key={univ}
                  onClick={() => handleSelectUniversity(univ)}
                  className={`px-2.5 py-1 rounded-full text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 hover:text-emerald-800'
                  }`}
                >
                  {univ}
                </button>
              );
            })}
          </div>
        </div>

        {/* 選択された大学の基本情報スペック */}
        {currentUniv && (
          <div className="mt-4 p-5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-700/25">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {t('universities.univInfoTitle')}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {currentUniv.university_name}
                  </h3>
                </div>
              </div>

              {/* 公式WEBサイトボタン */}
              {currentUniv.website_url ? (
                <a
                  href={currentUniv.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm hover:shadow-md hover:shadow-emerald-700/25 transition shrink-0"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t('universities.openUnivOfficial')}</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                </a>
              ) : (
                <span className="text-2xs text-slate-400">{t('universities.unregisteredUrl')}</span>
              )}
            </div>

            {/* スペック指標カード */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200/60 dark:border-slate-700">
                <span className="text-2xs font-semibold text-slate-500">{t('universities.totalCourses')}</span>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {currentUniv.subject_count?.toLocaleString()} <span className="text-2xs font-normal">{t('universities.coursesUnit')}</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200/60 dark:border-slate-700">
                <span className="text-2xs font-semibold text-slate-500">{t('universities.facultiesCount')}</span>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {currentFaculties.length} <span className="text-2xs font-normal">{t('universities.facultiesUnit')}</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200/60 dark:border-slate-700">
                <span className="text-2xs font-semibold text-slate-500">{t('universities.departmentsTotal')}</span>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {departments.filter((d) => d.university_name === selectedUnivName).length} <span className="text-2xs font-normal">{t('universities.departmentsUnit')}</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200/60 dark:border-slate-700">
                <span className="text-2xs font-semibold text-slate-500">{t('universities.officialUrlStatus')}</span>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate mt-1">
                  {currentUniv.website_url ? t('universities.urlRegistered') : t('universities.urlUnregistered')}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* STEP 2: 学部の選択 ＆ 学部基本情報カード */}
      {/* ======================================================== */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shadow-emerald-600/30">
              2
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('universities.step2Title').replace('{{univ}}', selectedUnivName)}
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {t('universities.totalFacultiesCount').replace('{{count}}', String(currentFaculties.length))}
          </span>
        </div>

        {/* 学部カードグリッド */}
        {currentFaculties.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {currentFaculties.map((fac) => {
              const isSelected = fac.faculty_name === selectedFacName;
              const deptCount = departments.filter(
                (d) => d.university_name === selectedUnivName && d.faculty_name === fac.faculty_name
              ).length;

              return (
                <button
                  key={fac.id}
                  type="button"
                  onClick={() => handleSelectFaculty(fac.faculty_name)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-2.5 ${
                    isSelected
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/25'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {deptCount} {t('universities.departmentsUnit')}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white break-words line-clamp-2">
                      {fac.faculty_name}
                    </div>
                  </div>

                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <span>{fac.subject_count} {t('universities.coursesUnit')}</span>
                    <span className="text-2xs text-slate-400">{isSelected ? t('universities.selectedStatus') : t('universities.selectAction')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-400 py-4 text-center">
            {t('universities.noFaculties')}
          </div>
        )}

        {/* 選択された学部の基本情報スペック */}
        {currentFac && (
          <div className="mt-4 p-5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/25">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {t('universities.facInfoTitle')}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {selectedUnivName} {currentFac.faculty_name}
                  </h3>
                </div>
              </div>

              {/* 学部公式WEBサイトボタン */}
              {currentFac.website_url ? (
                <a
                  href={currentFac.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md hover:shadow-emerald-600/25 transition shrink-0"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t('universities.openFacOfficial')}</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                </a>
              ) : (
                <span className="text-2xs text-slate-400">{t('universities.unregisteredUrl')}</span>
              )}
            </div>

            {/* スペック指標カード */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200/60 dark:border-slate-700">
                <span className="text-2xs font-semibold text-slate-500">{t('universities.facTotalCourses')}</span>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {currentFac.subject_count?.toLocaleString()} <span className="text-2xs font-normal">{t('universities.coursesUnit')}</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200/60 dark:border-slate-700">
                <span className="text-2xs font-semibold text-slate-500">{t('universities.affiliatedDepts')}</span>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {currentDepartments.length} <span className="text-2xs font-normal">{t('universities.departmentsUnit')}</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200/60 dark:border-slate-700">
                <span className="text-2xs font-semibold text-slate-500">{t('universities.officialUrlStatus')}</span>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate mt-1">
                  {currentFac.website_url ? t('universities.urlRegistered') : t('universities.urlUnregistered')}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* STEP 3: 学科の選択 ＆ 学科完全詳細カード */}
      {/* ======================================================== */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shadow-emerald-500/30">
              3
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('universities.step3Title').replace('{{fac}}', selectedFacName)}
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {t('universities.totalDeptsCount').replace('{{count}}', String(currentDepartments.length))}
          </span>
        </div>

        {/* 学科カードグリッド */}
        {currentDepartments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentDepartments.map((dept) => {
              const isSelected = dept.id === selectedDeptId;

              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => handleSelectDepartment(dept.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between space-x-3 ${
                    isSelected
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/25'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {dept.department_name}
                    </div>
                    <div className="text-2xs text-slate-500">
                      {t('universities.deptTotalCourses')} <strong className="text-emerald-700 dark:text-emerald-400">{dept.subject_count}{t('universities.coursesUnit')}</strong>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center space-x-1">
                    {isSelected ? (
                      <span className="text-2xs font-bold text-emerald-800 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                        {t('universities.detailShowing')}
                      </span>
                    ) : (
                      <span className="text-2xs text-slate-400 hover:text-emerald-600">
                        {t('universities.detailAction')}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-400 py-4 text-center">
            {t('universities.noDepts')}
          </div>
        )}

        {/* 選択された学科の完全詳細情報 */}
        {currentDept && (
          <div className="mt-4 p-6 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {t('universities.deptInfoTitle')}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {currentDept.department_name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {selectedUnivName} {selectedFacName}
                  </div>
                </div>
              </div>

              {/* 学科公式WEBサイトボタン */}
              {currentDept.website_url ? (
                <a
                  href={currentDept.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md hover:shadow-emerald-600/25 transition shrink-0"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t('universities.openDeptOfficial')}</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                </a>
              ) : (
                <span className="text-2xs text-slate-400">{t('universities.unregisteredUrl')}</span>
              )}
            </div>

            {/* 開講科目数 ＆ 階層スペック */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200/60 dark:border-slate-700 flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-2xs font-semibold text-slate-500">{t('universities.deptCourses')}</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {currentDept.subject_count} <span className="text-xs font-normal">{t('universities.coursesUnit')}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200/60 dark:border-slate-700 flex items-center space-x-3">
                <Layers className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-2xs font-semibold text-slate-500">{t('universities.affiliatedFac')}</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {selectedFacName}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200/60 dark:border-slate-700 flex items-center space-x-3">
                <Globe className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-2xs font-semibold text-slate-500">{t('universities.officialUrl')}</span>
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                    {currentDept.website_url || t('universities.unregisteredUrl')}
                  </div>
                </div>
              </div>
            </div>

            {/* スキル特性Top 3（知識 ＆ 汎用） */}
            {(() => {
              const topK = getTopSkills(currentDept.knowledge_vector, KNOWLEDGE_SKILLS, 3);
              const topG = getTopSkills(currentDept.general_vector, GENERAL_SKILLS, 3);

              if (topK.length === 0 && topG.length === 0) return null;

              return (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200/60 dark:border-slate-700 shadow-2xs space-y-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    {t('universities.topSkillsTitle')}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* 専門知識A群 */}
                    <div className="space-y-1.5">
                      <span className="text-2xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        {t('universities.knowledgeGroup')}
                      </span>
                      <div className="space-y-1">
                        {topK.map((s, idx) => (
                          <div key={idx} className="flex justify-between p-1.5 rounded bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100">
                            <span>{s.name}</span>
                            <span className="font-mono font-bold text-2xs text-emerald-700 dark:text-emerald-300">{s.val.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 汎用B群 */}
                    <div className="space-y-1.5">
                      <span className="text-2xs font-bold uppercase tracking-wider text-green-800 dark:text-green-300">
                        {t('universities.generalGroup')}
                      </span>
                      <div className="space-y-1">
                        {topG.map((s, idx) => (
                          <div key={idx} className="flex justify-between p-1.5 rounded bg-green-50/80 dark:bg-green-950/50 text-green-950 dark:text-green-100">
                            <span>{s.name}</span>
                            <span className="font-mono font-bold text-2xs text-green-700 dark:text-green-300">{s.val.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 他機能へのクイックアクションボタン */}
            <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5 border-t border-emerald-100 dark:border-slate-800">
              <span className="text-2xs text-slate-400 mr-1">{t('universities.analyzeDept')}</span>
              <Link
                href={`/analytics/radar_chart?primaryUniv=${encodeURIComponent(selectedUnivName)}&primaryDept=${encodeURIComponent(currentDept.department_name)}`}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900 transition border border-emerald-200 dark:border-emerald-800 shadow-2xs"
              >
                <Radar className="w-3.5 h-3.5" />
                <span>{t('universities.viewRadar')}</span>
              </Link>
              <Link
                href={`/analytics/similarity?primaryUniv=${encodeURIComponent(selectedUnivName)}&primaryDept=${encodeURIComponent(currentDept.department_name)}`}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900 transition border border-emerald-200 dark:border-emerald-800 shadow-2xs"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>{t('universities.findSimilar')}</span>
              </Link>
              <Link
                href={`/macro/skill_complementation?univ=${encodeURIComponent(selectedUnivName)}&dept=${encodeURIComponent(currentDept.department_name)}`}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 hover:bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 dark:hover:bg-green-900 transition border border-green-200 dark:border-green-800 shadow-2xs"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{t('universities.findComplementation')}</span>
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
