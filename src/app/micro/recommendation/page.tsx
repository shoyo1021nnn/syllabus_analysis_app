"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  GraduationCap, 
  ArrowLeft, 
  Plus, 
  Check, 
  Filter, 
  TrendingUp, 
  AlertCircle, 
  BookOpen, 
  Eye, 
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Award,
  User
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CourseSkillVector, EnrolledCourse, CourseRecommendationItem } from "@/types/database";
import { 
  calculatePersonalSkillProfile, 
  recommendCoursesForPersonalGaps, 
  simulateCourseAddition,
  getRadarIndicators 
} from "@/lib/vectorUtils";
import RadarChart, { RadarSeriesItem } from "@/components/charts/RadarChart";
import { useAnalyticsContext } from "@/context/AnalyticsContext";
import { useLanguage } from "@/context/LanguageContext";

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

const SEMESTERS_LIST = [
  "すべて",
  "春学期",
  "秋学期",
  "前期",
  "後期",
  "集中"
];

export default function MicroRecommendationPage() {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // フィルタステート
  const [facultyFilter, setFacultyFilter] = useState("すべて");
  const [semesterFilter, setSemesterFilter] = useState("すべて");
  const [targetCategory, setTargetCategory] = useState<'all' | 'knowledge' | 'general'>('all');

  // 科目データステート
  const [candidateCourses, setCandidateCourses] = useState<CourseSkillVector[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // シミュレーション対象科目
  const [simulatedCourse, setSimulatedCourse] = useState<CourseSkillVector | null>(null);

  const { language, t } = useLanguage();
  const { setAnalyticsContext } = useAnalyticsContext();

  // LocalStorageから履修科目リスト取得
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setEnrolledCourses(parsed);
        }
      }
    } catch (e) {
      console.error(e);
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
      console.error(e);
    }
  }, []);

  // プロファイル計算
  const profile = useMemo(() => {
    return calculatePersonalSkillProfile(enrolledCourses);
  }, [enrolledCourses]);

  const enrolledCourseIds = useMemo(() => {
    return new Set(enrolledCourses.map((c) => c.course.id));
  }, [enrolledCourses]);

  // 推薦用候補科目のフェッチ（不足スキルやフィルタに合致する科目をロード）
  useEffect(() => {
    if (!isLoaded) return;
    const fetchCandidates = async () => {
      setIsLoadingCourses(true);
      try {
        let query = supabase
          .from('course_skill_vectors')
          .select('*')
          .eq('is_zero_vector', false)
          .limit(1000);

        if (facultyFilter !== "すべて") {
          query = query.eq('faculty_name', facultyFilter);
        }
        if (semesterFilter !== "すべて") {
          query = query.ilike('semester', `%${semesterFilter}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        setCandidateCourses(data || []);
      } catch (err) {
        console.error("Failed to fetch candidate courses", err);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCandidates();
  }, [isLoaded, facultyFilter, semesterFilter]);

  // 推薦科目の計算
  const recommendations = useMemo(() => {
    if (candidateCourses.length === 0) return [];
    return recommendCoursesForPersonalGaps(
      profile,
      candidateCourses,
      enrolledCourseIds,
      {
        facultyFilter: facultyFilter === "すべて" ? undefined : facultyFilter,
        semesterFilter: semesterFilter === "すべて" ? undefined : semesterFilter,
        targetCategory,
        topN: 15,
      }
    );
  }, [profile, candidateCourses, enrolledCourseIds, facultyFilter, semesterFilter, targetCategory]);

  // シミュレーション計算
  const simulationResult = useMemo(() => {
    if (!simulatedCourse) return null;
    return simulateCourseAddition(profile, simulatedCourse);
  }, [profile, simulatedCourse]);

  // 正式に履修登録する
  const handleEnrollFromRecommendation = (course: CourseSkillVector) => {
    if (enrolledCourseIds.has(course.id)) return;
    const newEnrolled: EnrolledCourse = {
      course,
      enrolledAt: new Date().toISOString(),
    };
    saveCourses([...enrolledCourses, newEnrolled]);
    if (simulatedCourse?.id === course.id) {
      setSimulatedCourse(null);
    }
  };

  // レーダーチャート（シミュレーション比較表示）用データ
  const maxVal = useMemo(() => {
    const currentMax = Math.max(
      ...profile.cumulativeKnowledgeVector,
      ...profile.cumulativeGeneralVector,
      0
    );
    const simMax = simulationResult
      ? Math.max(
          ...simulationResult.simulatedKnowledge,
          ...simulationResult.simulatedGeneral,
          0
        )
      : currentMax;
    return Math.max(9, Math.ceil((simMax + 1) / 3) * 3);
  }, [profile, simulationResult]);

  const indicatorsKnowledge = useMemo(() => {
    return getRadarIndicators('knowledge', { max: maxVal, language });
  }, [maxVal, language]);

  const indicatorsGeneral = useMemo(() => {
    return getRadarIndicators('general', { max: maxVal, language });
  }, [maxVal, language]);

  const seriesKnowledge: RadarSeriesItem[] = useMemo(() => {
    const list: RadarSeriesItem[] = [
      {
        name: t('charts.radar.current'),
        value: profile.cumulativeKnowledgeVector,
        color: "#6366f1", // indigo
      }
    ];
    if (simulationResult) {
      list.push({
        name: t('charts.radar.simulated'),
        value: simulationResult.simulatedKnowledge,
        color: "#10b981", // emerald
      });
    }
    return list;
  }, [profile.cumulativeKnowledgeVector, simulationResult, t]);

  const seriesGeneral: RadarSeriesItem[] = useMemo(() => {
    const list: RadarSeriesItem[] = [
      {
        name: t('charts.radar.current'),
        value: profile.cumulativeGeneralVector,
        color: "#3b82f6", // blue
      }
    ];
    if (simulationResult) {
      list.push({
        name: t('charts.radar.simulated'),
        value: simulationResult.simulatedGeneral,
        color: "#10b981", // emerald
      });
    }
    return list;
  }, [profile.cumulativeGeneralVector, simulationResult, t]);

  // AIエージェントコンテキスト更新
  useEffect(() => {
    if (!isLoaded) return;
    const isEn = language === 'en';
    setAnalyticsContext({
      pageTitle: t('micro.recommendation.title'),
      pagePath: "/micro/recommendation",
      summaryText: isEn
        ? `Course recommendation page based on student skill gaps. Current gaps: ${profile.weaknesses.map((w) => w.nameEn || w.nameJa).join(', ')}. Computing ${recommendations.length} recommendations.`
        : `学生個人の不足スキルを補填するための推奨科目一覧画面。現在の不足スキル: ${profile.weaknesses.map((w) => w.nameJa).join(', ')}。現在${recommendations.length}件の推奨科目を算出中。`,
      details: {
        enrolledCount: enrolledCourses.length,
        weaknesses: profile.weaknesses.map((w) => `${isEn ? (w.nameEn || w.nameJa) : w.nameJa} (${t('micro.recommendation.currentScore')} ${w.score}pt)`),
        simulatedCourse: simulatedCourse ? {
          name: simulatedCourse.course_name,
          faculty: simulatedCourse.faculty_name,
          credits: simulatedCourse.credits,
          gains: simulationResult?.gains.map((g) => `${isEn ? (g.nameEn || g.nameJa) : g.nameJa}: +${g.diff}`),
        } : null,
        topRecommendations: recommendations.slice(0, 3).map((r) => ({
          name: r.course.course_name,
          faculty: r.course.faculty_name,
          matchScore: `${r.matchScore}%`,
        })),
      },
      presetQuestions: isEn ? [
        "Which of the recommended courses fills my skill gaps most efficiently?",
        simulatedCourse 
          ? `How much will my skills grow if I take "${simulatedCourse.course_name}"?`
          : "Which general education courses boost generic competencies most?",
        "Are there any specific term or prerequisite considerations for filling my gaps?",
        "Should I prioritize filling specialized knowledge or generic competencies first?",
      ] : [
        "提示された推薦科目の中で最も効率的に弱点を埋められるものはどれ？",
        simulatedCourse 
          ? `「${simulatedCourse.course_name}」を履修するとどのスキルがどの程度伸びますか？`
          : "基幹教育科目の中から特に汎用スキルが伸びるおすすめは？",
        "私の不足スキルを補完する上で配慮すべき履修順序や学期はありますか？",
        "専門知識と汎用スキルのどちらを優先して補うべき？",
      ],
    });
  }, [isLoaded, enrolledCourses.length, profile.weaknesses, simulatedCourse, simulationResult, recommendations, setAnalyticsContext, language, t]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>{t('micro.recommendation.badge')}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('micro.recommendation.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('micro.recommendation.subtitle')}
          </p>
        </div>

        <Link
          href="/micro/portfolio"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition shadow-2xs self-start sm:self-auto"
        >
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          <span>{t('micro.recommendation.backToPortfolio')}</span>
        </Link>
      </div>

      {/* 不足スキルサマリーバー */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              {t('micro.recommendation.gapTitle')}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xs text-slate-400">{t('micro.recommendation.targetLabel')}</span>
            <button
              onClick={() => setTargetCategory('all')}
              className={`px-2.5 py-1 rounded text-2xs font-semibold transition ${targetCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
            >
              {t('micro.recommendation.categoryAll')}
            </button>
            <button
              onClick={() => setTargetCategory('knowledge')}
              className={`px-2.5 py-1 rounded text-2xs font-semibold transition ${targetCategory === 'knowledge' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
            >
              {t('micro.recommendation.categoryKnowledge')}
            </button>
            <button
              onClick={() => setTargetCategory('general')}
              className={`px-2.5 py-1 rounded text-2xs font-semibold transition ${targetCategory === 'general' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
            >
              {t('micro.recommendation.categoryGeneral')}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-3">
          {profile.weaknesses.length === 0 ? (
            <span className="text-xs text-slate-400">{t('micro.recommendation.gapEmpty')}</span>
          ) : (
            profile.weaknesses.map((w) => (
              <div
                key={w.code}
                className="px-3 py-1.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center space-x-2 text-xs"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{language === 'en' ? (w.nameEn || w.nameJa) : w.nameJa}</span>
                <span className="text-2xs text-rose-600 dark:text-rose-400 font-semibold">{t('micro.recommendation.currentScore')} {w.score}pt</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* メインレイアウト: 左側=推薦科目リスト(7/12) / 右側=シミュレーター＆ビフォーアフター(5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 左側: 推薦科目ランキング ＆ フィルタ */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 絞り込みバー */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-xs">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-medium">{t('micro.recommendation.filterFaculty')}</span>
                <select
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100"
                >
                  {FACULTIES_LIST.map((f) => (
                    <option key={f} value={f}>{f === 'すべて' ? t('common.all') : f}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-medium">{t('micro.recommendation.filterSemester')}</span>
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100"
                >
                  {SEMESTERS_LIST.map((s) => (
                    <option key={s} value={s}>{s === 'すべて' ? t('common.all') : s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-2xs text-slate-400">
              {isLoadingCourses
                ? t('micro.recommendation.calculating')
                : t('micro.recommendation.displayCount').replace('{{count}}', String(recommendations.length))}
            </div>
          </div>

          {/* 推薦科目カード一覧 */}
          <div className="space-y-3">
            {isLoadingCourses ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                {t('micro.recommendation.loadingDesc')}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                {t('micro.recommendation.noCourses')}
              </div>
            ) : (
              recommendations.map((item, index) => {
                const isSimulated = simulatedCourse?.id === item.course.id;
                const isEnrolled = enrolledCourseIds.has(item.course.id);

                return (
                  <div
                    key={item.course.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 shadow-xs space-y-3 ${
                      isSimulated
                        ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-2xs flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          {item.course.course_code && (
                            <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                              #{item.course.course_code}
                            </span>
                          )}
                          <span className="text-2xs font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                            {item.course.faculty_name}
                          </span>
                          <span className="text-2xs text-slate-400">
                            {item.course.credits ?? 2}{t('micro.recommendation.credits')}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate" title={item.course.course_name}>
                          {item.course.course_name}
                        </h3>
                        <div className="flex items-center gap-2 text-2xs text-slate-500 mt-0.5 flex-wrap">
                          {item.course.instructor ? (
                            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]" title={item.course.instructor.replace(/\n+/g, ', ')}>
                                {item.course.instructor.replace(/\n+/g, ', ')}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">{t('micro.recommendation.noInstructor')}</span>
                          )}
                          {(item.course.term_time || item.course.semester) && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[160px]" title={item.course.term_time || item.course.semester || ''}>
                                {item.course.term_time || item.course.semester}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 適合度スコアバッジ */}
                      <div className="text-right shrink-0">
                        <div className="text-2xs font-semibold text-slate-400">{t('micro.recommendation.gapFillScore')}</div>
                        <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                          {item.matchScore}%
                        </div>
                      </div>
                    </div>

                    {/* この科目で伸びる主要スキル */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-2xs text-slate-400 font-medium">{t('micro.recommendation.targetedGains')}</span>
                      {item.targetedSkills.map((ts) => (
                        <span
                          key={ts.code}
                          className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 text-2xs font-semibold"
                        >
                          {language === 'en' ? (ts.nameEn || ts.nameJa) : ts.nameJa} <strong className="text-blue-900 dark:text-blue-200">+{ts.gain}pt</strong>
                        </span>
                      ))}
                    </div>

                    {/* アクションボタン */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setSimulatedCourse(isSimulated ? null : item.course)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isSimulated
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isSimulated ? t('micro.recommendation.simulatedButton') : t('micro.recommendation.simulateButton')}</span>
                      </button>

                      <button
                        onClick={() => handleEnrollFromRecommendation(item.course)}
                        disabled={isEnrolled}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                          isEnrolled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isEnrolled ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('micro.recommendation.enrolledBadge')}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('micro.recommendation.enrollButton')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* 右側: 履修シミュレーター ＆ レーダー変化プレビュー */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 sticky top-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span>{t('micro.recommendation.simulatorTitle')}</span>
              </h2>
              <p className="text-2xs text-slate-500 mt-0.5">
                {t('micro.recommendation.simulatorDesc')}
              </p>
            </div>

            {simulatedCourse ? (
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold text-emerald-800 dark:text-emerald-300">
                    {t('micro.recommendation.simulatedCourseTitle')}
                  </span>
                  <button
                    onClick={() => setSimulatedCourse(null)}
                    className="text-2xs text-slate-400 hover:text-slate-600"
                  >
                    {t('micro.recommendation.cancelSimulation')}
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {simulatedCourse.course_code && (
                      <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 font-semibold">
                        #{simulatedCourse.course_code}
                      </span>
                    )}
                    <span className="text-2xs font-semibold text-slate-500">
                      {simulatedCourse.faculty_name}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {simulatedCourse.course_name}
                  </div>
                  {simulatedCourse.instructor && (
                    <div className="flex items-center gap-1 text-2xs text-slate-600 dark:text-slate-400">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{simulatedCourse.instructor.replace(/\n+/g, ', ')}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {simulationResult?.gains.slice(0, 3).map((g) => (
                    <span key={g.code} className="text-2xs bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-emerald-700 font-bold border border-emerald-100">
                      {language === 'en' ? (g.nameEn || g.nameJa) : g.nameJa}: +{g.diff}pt ({g.before} → {g.after})
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                {t('micro.recommendation.simulatorEmptyDesc')}
              </div>
            )}

            {/* レーダーチャート2面 */}
            <div className="space-y-4 pt-2">
              <div className="bg-slate-50/60 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <div className="text-center text-2xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                  {t('charts.radar.specializedSkills')}
                </div>
                <div className="h-64">
                  <RadarChart
                    indicators={indicatorsKnowledge}
                    seriesData={seriesKnowledge}
                    height="100%"
                    showLegend={true}
                  />
                </div>
              </div>

              <div className="bg-slate-50/60 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <div className="text-center text-2xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                  {t('charts.radar.genericSkills')}
                </div>
                <div className="h-64">
                  <RadarChart
                    indicators={indicatorsGeneral}
                    seriesData={seriesGeneral}
                    height="100%"
                    showLegend={true}
                  />
                </div>
              </div>
            </div>

            {simulatedCourse && (
              <div className="pt-2">
                <button
                  onClick={() => handleEnrollFromRecommendation(simulatedCourse)}
                  disabled={enrolledCourseIds.has(simulatedCourse.id)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('micro.recommendation.registerFormally')}</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
