"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Trash2, 
  Sparkles, 
  Award, 
  AlertTriangle, 
  Layers, 
  BookOpen, 
  ChevronRight, 
  RotateCcw,
  Check,
  TrendingUp,
  Filter,
  Info,
  CheckSquare,
  Square,
  User,
  FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CourseSkillVector, EnrolledCourse } from "@/types/database";
import { 
  calculatePersonalSkillProfile, 
  getRadarIndicators,
  KNOWLEDGE_SKILLS,
  GENERAL_SKILLS
} from "@/lib/vectorUtils";
import RadarChart, { RadarSeriesItem } from "@/components/charts/RadarChart";
import { useAnalyticsContext } from "@/context/AnalyticsContext";
import GradePdfImportModal, { GradePdfImportItem } from "@/components/micro/GradePdfImportModal";

const STORAGE_KEY = "syllabus_enrolled_courses";

const FACULTIES_LIST = [
  "すべて",
  "基幹教育科目",
  "共創学部",
  "文学部",
  "教育学部",
  "法学部",
  "経済学部",
  "理学部",
  "医学部",
  "歯学部",
  "薬学部",
  "工学部",
  "芸術工学部",
  "農学部"
];

export default function MicroPortfolioPage() {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 検索ステート
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("すべて");
  const [searchResults, setSearchResults] = useState<CourseSkillVector[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 複数選択ステート
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());

  // PDF取り込みモーダルステート
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // チャートタブ
  const [chartTab, setChartTab] = useState<'both' | 'knowledge' | 'general'>('both');

  const { setAnalyticsContext } = useAnalyticsContext();

  // LocalStorageから読み込み（重複データ自動自己修復付き）
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // 重複データの自己修復
          const seen = new Set<string>();
          const cleaned: EnrolledCourse[] = [];
          for (const item of parsed) {
            const courseId = item?.course?.id;
            if (courseId && !seen.has(courseId)) {
              seen.add(courseId);
              cleaned.push(item);
            }
          }
          setEnrolledCourses(cleaned);
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
          }
        }
      }
    } catch (e) {
      console.error("Failed to load enrolled courses", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 履修科目の保存
  const saveCourses = useCallback((courses: EnrolledCourse[]) => {
    setEnrolledCourses(courses);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    } catch (e) {
      console.error("Failed to save enrolled courses", e);
    }
  }, []);

  // 科目追加（単一）
  const handleAddCourse = (course: CourseSkillVector) => {
    if (enrolledCourses.some((item) => item.course.id === course.id)) return;
    const newEnrolled: EnrolledCourse = {
      course,
      enrolledAt: new Date().toISOString(),
    };
    saveCourses([...enrolledCourses, newEnrolled]);
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      next.delete(course.id);
      return next;
    });
  };

  // 複数選択トグル
  const handleToggleSelect = (courseId: string) => {
    if (enrolledCourses.some((item) => item.course.id === courseId)) return;
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  // 現在の検索結果内の未登録科目
  const unEnrolledInResults = useMemo(() => {
    return searchResults.filter(
      (c) => !enrolledCourses.some((e) => e.course.id === c.id)
    );
  }, [searchResults, enrolledCourses]);

  const isAllSelected = useMemo(() => {
    return (
      unEnrolledInResults.length > 0 &&
      unEnrolledInResults.every((c) => selectedCourseIds.has(c.id))
    );
  }, [unEnrolledInResults, selectedCourseIds]);

  // 全選択 / 全解除
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCourseIds(new Set());
    } else {
      setSelectedCourseIds(new Set(unEnrolledInResults.map((c) => c.id)));
    }
  };

  // 選択科目を一括登録
  const handleBatchEnroll = () => {
    const toAdd = searchResults.filter(
      (c) => selectedCourseIds.has(c.id) && !enrolledCourses.some((e) => e.course.id === c.id)
    );
    if (toAdd.length === 0) return;

    const now = new Date().toISOString();
    const newItems: EnrolledCourse[] = toAdd.map((course) => ({
      course,
      enrolledAt: now,
    }));
    saveCourses([...enrolledCourses, ...newItems]);
    setSelectedCourseIds(new Set());
  };

  // PDFインポート科目のマージ登録（完全一意化保証）
  const handleImportPdfCourses = (newItems: GradePdfImportItem[]) => {
    const now = new Date().toISOString();
    const existingIds = new Set(enrolledCourses.map((e) => e.course.id));
    const toAdd: EnrolledCourse[] = [];
    const addedInBatch = new Set<string>();

    for (const item of newItems) {
      if (!existingIds.has(item.course.id) && !addedInBatch.has(item.course.id)) {
        addedInBatch.add(item.course.id);
        toAdd.push({
          course: item.course,
          enrolledAt: now,
          grade: item.grade,
        });
      }
    }

    if (toAdd.length > 0) {
      saveCourses([...enrolledCourses, ...toAdd]);
    }
  };

  // 科目削除
  const handleRemoveCourse = (courseId: string) => {
    saveCourses(enrolledCourses.filter((item) => item.course.id !== courseId));
  };

  // 全件クリア
  const handleClearAll = () => {
    if (confirm("登録したすべての履修科目をクリアしますか？")) {
      saveCourses([]);
      setSelectedCourseIds(new Set());
    }
  };

  // 検索実行
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setHasSearched(true);
    setSelectedCourseIds(new Set());

    try {
      let query = supabase
        .from('course_skill_vectors')
        .select('*')
        .eq('is_zero_vector', false)
        .limit(50);

      if (selectedFaculty && selectedFaculty !== "すべて") {
        query = query.eq('faculty_name', selectedFaculty);
      }

      if (searchQuery.trim()) {
        const term = searchQuery.trim();
        query = query.or(`course_name.ilike.%${term}%,course_code.ilike.%${term}%,instructor.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error("Search error", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 初回おすすめ検索（基幹教育の人気科目などを表示）
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const { data } = await supabase
          .from('course_skill_vectors')
          .select('*')
          .eq('is_zero_vector', false)
          .eq('faculty_name', '基幹教育科目')
          .limit(20);
        if (data && data.length > 0) {
          setSearchResults(data);
          setHasSearched(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitial();
  }, []);

  // 個人プロファイル計算（案B: 累積加算方式）
  const profile = useMemo(() => {
    return calculatePersonalSkillProfile(enrolledCourses);
  }, [enrolledCourses]);

  // レーダーチャート用データ
  const maxKnowledgeVal = useMemo(() => {
    const maxVal = Math.max(...profile.cumulativeKnowledgeVector, 0);
    return Math.max(9, Math.ceil((maxVal + 1) / 3) * 3);
  }, [profile.cumulativeKnowledgeVector]);

  const maxGeneralVal = useMemo(() => {
    const maxVal = Math.max(...profile.cumulativeGeneralVector, 0);
    return Math.max(9, Math.ceil((maxVal + 1) / 3) * 3);
  }, [profile.cumulativeGeneralVector]);

  const indicatorsKnowledge = useMemo(() => {
    return getRadarIndicators('knowledge', { max: maxKnowledgeVal, language: 'ja' });
  }, [maxKnowledgeVal]);

  const indicatorsGeneral = useMemo(() => {
    return getRadarIndicators('general', { max: maxGeneralVal, language: 'ja' });
  }, [maxGeneralVal]);

  const seriesKnowledge: RadarSeriesItem[] = useMemo(() => [
    {
      name: "専門知識スキル (A系列)",
      value: profile.cumulativeKnowledgeVector,
      color: "#6366f1", // indigo
    }
  ], [profile.cumulativeKnowledgeVector]);

  const seriesGeneral: RadarSeriesItem[] = useMemo(() => [
    {
      name: "汎用スキル (B系列)",
      value: profile.cumulativeGeneralVector,
      color: "#3b82f6", // blue
    }
  ], [profile.cumulativeGeneralVector]);

  // AIエージェントコンテキスト更新
  useEffect(() => {
    if (!isLoaded) return;
    setAnalyticsContext({
      pageTitle: "履修・スキルポートフォリオ",
      pagePath: "/micro/portfolio",
      summaryText: `学生個人の履修登録と24次元スキル累積レーダーチャート。登録科目数: ${enrolledCourses.length}科目、総単位数: ${profile.totalCredits}単位。`,
      details: {
        enrolledCount: enrolledCourses.length,
        totalCredits: profile.totalCredits,
        courses: enrolledCourses.map((c) => ({
          name: c.course.course_name,
          faculty: c.course.faculty_name,
          credits: c.course.credits,
        })),
        strengths: profile.strengths.map((s) => `${s.nameJa} (累積${s.score}点)`),
        weaknesses: profile.weaknesses.map((s) => `${s.nameJa} (累積${s.score}点)`),
      },
      presetQuestions: [
        "私の現在のスキル蓄積における強みと特徴を分析して",
        "不足しているスキルを補うためにはどのような科目を意識すべき？",
        "この履修状況でバランスを整えるための次学期のアドバイスは？",
        "汎用スキル（B系列）の伸びしろについて詳しく教えて",
      ],
    });
  }, [isLoaded, enrolledCourses, profile, setAnalyticsContext]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* ページタイトルヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>ミクロな学習支援 &gt; Step 1</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            履修・スキルポートフォリオ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            履修した科目を選択して、あなたの24次元スキル蓄積（案B: 累積加算）を客観的に可視化します。
          </p>
        </div>

        {/* サマリーバッジ */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-center">
            <div className="text-2xs text-indigo-600 dark:text-indigo-400 font-semibold">登録科目数</div>
            <div className="text-lg font-bold text-indigo-950 dark:text-white leading-tight">
              {enrolledCourses.length} <span className="text-xs font-normal">科目</span>
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-center">
            <div className="text-2xs text-blue-600 dark:text-blue-400 font-semibold">推定獲得単位</div>
            <div className="text-lg font-bold text-blue-950 dark:text-white leading-tight">
              {profile.totalCredits} <span className="text-xs font-normal">単位</span>
            </div>
          </div>
        </div>
      </div>

      {/* メイングリッド: 左側=検索＆登録リスト / 右側=レーダーチャート＆分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 左側カラム (5/12): 科目セレクター ＆ 登録一覧 */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Campusmate 成績照会PDFから一括登録バナー */}
          <div className="bg-linear-to-r from-indigo-500/10 via-blue-500/10 to-indigo-500/10 dark:from-indigo-950/40 dark:via-blue-950/40 dark:to-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 p-4 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>成績照会PDFから一括インポート</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-3xs">
                    自動検知
                  </span>
                </div>
                <p className="text-2xs text-slate-500 truncate mt-0.5">
                  Campusmateの成績PDFから履修科目を自動検知＆確認して登録
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>PDF取込</span>
            </button>
          </div>

          {/* 科目検索ボックス */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <Search className="w-4 h-4 text-indigo-600" />
              <span>科目を検索して履修登録</span>
            </h2>

            <form onSubmit={handleSearch} className="space-y-3">
              <div>
                <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  開講学部・部局
                </label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {FACULTIES_LIST.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  科目名・講義コード・教員名
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="例: プログラミング, 木實, 25371211..."
                    className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50 shrink-0"
                  >
                    {isSearching ? "検索中..." : "検索"}
                  </button>
                </div>
              </div>
            </form>

            {/* 検索結果リスト ＆ 一括登録バー */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xs font-bold text-slate-500">
                    検索結果 ({searchResults.length}件)
                  </span>
                  {selectedCourseIds.size > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-2xs">
                      {selectedCourseIds.size}件 選択中
                    </span>
                  )}
                </div>

                {/* 未登録科目が存在する場合の全選択トグル */}
                {unEnrolledInResults.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center space-x-1 transition"
                  >
                    {isAllSelected ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>選択を全解除</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        <span>未登録を全選択 ({unEnrolledInResults.length})</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 一括登録アクションバー（選択中のみ表示） */}
              {selectedCourseIds.size > 0 && (
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-2 shadow-xs transition-all">
                  <div className="text-2xs font-semibold text-indigo-900 dark:text-indigo-200 pl-1">
                    チェックした科目をまとめて登録
                  </div>
                  <button
                    type="button"
                    onClick={handleBatchEnroll}
                    className="px-3 py-1.5 bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>選択した {selectedCourseIds.size} 件を一括追加</span>
                  </button>
                </div>
              )}

              {/* 検索結果スクロールリスト */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    {hasSearched ? "該当する科目が見つかりませんでした" : "検索条件を入力してください"}
                  </div>
                ) : (
                  searchResults.map((course) => {
                    const isEnrolled = enrolledCourses.some((item) => item.course.id === course.id);
                    const isSelected = selectedCourseIds.has(course.id);

                    return (
                      <div
                        key={course.id}
                        onClick={() => !isEnrolled && handleToggleSelect(course.id)}
                        className={`p-2.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 text-xs ${
                          isEnrolled
                            ? 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 opacity-75 cursor-default'
                            : isSelected
                            ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs cursor-pointer'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:border-slate-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                          {/* チェックボックスエリア */}
                          <div className="shrink-0 flex items-center justify-center">
                            {isEnrolled ? (
                              <div className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </div>
                            ) : (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => handleToggleSelect(course.id)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                              />
                            )}
                          </div>

                          {/* 科目情報 */}
                          <div className="min-w-0 flex-1">
                            {/* 講義コードバッジ ＆ 学部 ＆ 単位 */}
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              {course.course_code && (
                                <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                                  #{course.course_code}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-2xs font-medium">
                                {course.faculty_name}
                              </span>
                              <span className="text-2xs text-slate-500 font-medium">{course.credits ?? 2}単位</span>
                            </div>

                            {/* 科目名 */}
                            <div className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs" title={course.course_name}>
                              {course.course_name}
                            </div>

                            {/* 担当教員 ＆ 開講情報 */}
                            <div className="flex items-center gap-2 text-2xs text-slate-500 mt-1 flex-wrap">
                              {course.instructor ? (
                                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[150px]" title={course.instructor.replace(/\n+/g, ', ')}>
                                    {course.instructor.replace(/\n+/g, ', ')}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-slate-400">教員未記載</span>
                              )}
                              {(course.term_time || course.semester) && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[150px]" title={course.term_time || course.semester || ''}>
                                    {course.term_time || course.semester}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* アクション */}
                        {isEnrolled ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-2xs border border-emerald-200 dark:border-emerald-800 shrink-0">
                            <Check className="w-3 h-3" />
                            <span>登録済</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddCourse(course);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xs transition shadow-xs shrink-0"
                            title="1科目だけ即座に追加"
                          >
                            <Plus className="w-3 h-3" />
                            <span>追加</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 登録済み科目リスト */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>登録済みの履修科目 ({enrolledCourses.length})</span>
              </h2>
              {enrolledCourses.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-2xs text-rose-500 hover:text-rose-700 inline-flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>全件クリア</span>
                </button>
              )}
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                履修科目がまだ追加されていません。<br />上の検索から受講科目を追加してください。
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {enrolledCourses.map((item, idx) => (
                  <div
                    key={`${item.course.id}_${idx}`}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {item.course.course_code && (
                          <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                            #{item.course.course_code}
                          </span>
                        )}
                        {item.grade && (
                          <span className="text-2xs px-1.5 py-0.5 rounded font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            評価: {item.grade}
                          </span>
                        )}
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium text-2xs">{item.course.faculty_name}</span>
                        <span className="text-2xs text-slate-400">•</span>
                        <span className="text-2xs text-slate-500">{item.course.credits ?? 2}単位</span>
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs" title={item.course.course_name}>
                        {item.course.course_name}
                      </div>
                      <div className="flex items-center gap-2 text-2xs text-slate-500 mt-1 flex-wrap">
                        {item.course.instructor && (
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[130px]" title={item.course.instructor.replace(/\n+/g, ', ')}>
                              {item.course.instructor.replace(/\n+/g, ', ')}
                            </span>
                          </span>
                        )}
                        {(item.course.term_time || item.course.semester) && (
                          <>
                            {item.course.instructor && <span>•</span>}
                            <span className="truncate max-w-[130px]" title={item.course.term_time || item.course.semester || ''}>
                              {item.course.term_time || item.course.semester}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCourse(item.course.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 右側カラム (7/12): スキルレーダーチャート ＆ 診断サマリー */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* レーダーチャートカード */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span>個人スキル蓄積レーダーチャート</span>
                </h2>
                <p className="text-2xs text-slate-500 mt-0.5">
                  案B: 履修した科目のスキル合計値をプロット（科目を履修するほど外側に拡大）
                </p>
              </div>

              {/* チャート切り替えタブ */}
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setChartTab('both')}
                  className={`px-3 py-1.5 rounded-md transition ${chartTab === 'both' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  並列2面表示
                </button>
                <button
                  onClick={() => setChartTab('knowledge')}
                  className={`px-3 py-1.5 rounded-md transition ${chartTab === 'knowledge' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  専門知識 (A群)
                </button>
                <button
                  onClick={() => setChartTab('general')}
                  className={`px-3 py-1.5 rounded-md transition ${chartTab === 'general' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  汎用スキル (B群)
                </button>
              </div>
            </div>

            {/* チャート本体 */}
            {enrolledCourses.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-slate-400 text-xs space-y-3">
                <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                <p>履修科目が登録されると、スキルレーダーチャートが表示されます</p>
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                {chartTab === 'both' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                      <div className="text-center text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                        専門知識スキル (A群 12群)
                      </div>
                      <div className="h-72">
                        <RadarChart
                          indicators={indicatorsKnowledge}
                          seriesData={seriesKnowledge}
                          height="100%"
                          showLegend={false}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                      <div className="text-center text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                        汎用スキル (B群 12群)
                      </div>
                      <div className="h-72">
                        <RadarChart
                          indicators={indicatorsGeneral}
                          seriesData={seriesGeneral}
                          height="100%"
                          showLegend={false}
                        />
                      </div>
                    </div>
                  </div>
                ) : chartTab === 'knowledge' ? (
                  <div className="h-96">
                    <RadarChart
                      indicators={indicatorsKnowledge}
                      seriesData={seriesKnowledge}
                      height="100%"
                      showLegend={true}
                    />
                  </div>
                ) : (
                  <div className="h-96">
                    <RadarChart
                      indicators={indicatorsGeneral}
                      seriesData={seriesGeneral}
                      height="100%"
                      showLegend={true}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 強み ＆ 不足スキル診断カード */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>スキル診断・ギャップ分析</span>
              </h2>
              <span className="text-2xs text-slate-400">現在の履修状況より算出</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* あなたの強みスキル */}
              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    獲得上位スキル (強み)
                  </span>
                  <span className="text-2xs text-emerald-600 font-semibold">Top {profile.strengths.length}</span>
                </div>
                {profile.strengths.length === 0 ? (
                  <div className="text-2xs text-slate-400 py-3 text-center">科目を追加すると強みが判定されます</div>
                ) : (
                  <div className="space-y-2">
                    {profile.strengths.map((s, idx) => (
                      <div key={s.code} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                        <div className="flex items-center space-x-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-2xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{s.nameJa}</span>
                          <span className="text-2xs text-slate-400">({s.code})</span>
                        </div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">
                          +{s.score} pt
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 不足・手薄なスキル */}
              <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                    不足・手薄なスキル (ギャップ)
                  </span>
                  <span className="text-2xs text-rose-600 font-semibold">Top {profile.weaknesses.length}</span>
                </div>
                {enrolledCourses.length === 0 ? (
                  <div className="text-2xs text-slate-400 py-3 text-center">科目を追加すると不足スキルが判定されます</div>
                ) : (
                  <div className="space-y-2">
                    {profile.weaknesses.map((s, idx) => (
                      <div key={s.code} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded-lg border border-rose-100 dark:border-rose-900/40">
                        <div className="flex items-center space-x-2">
                          <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 font-bold text-2xs flex items-center justify-center">
                            !
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{s.nameJa}</span>
                          <span className="text-2xs text-slate-400">({s.code})</span>
                        </div>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {s.score} pt
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 不足スキル補完画面への誘導バナー */}
            <div className="pt-2">
              <Link
                href="/micro/recommendation"
                className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs flex items-center justify-between shadow-md transition group"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>あなたの不足スキルを補完できる科目を計算・推薦する</span>
                </div>
                <div className="flex items-center space-x-1 text-2xs text-indigo-100 group-hover:translate-x-1 transition-transform">
                  <span>推薦シミュレーターへ</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </div>

          </div>

        </div>

      </div>

      {/* 成績照会PDFインポートモーダル */}
      <GradePdfImportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        enrolledCourses={enrolledCourses}
        onImportCourses={handleImportPdfCourses}
      />
    </div>
  );
}
