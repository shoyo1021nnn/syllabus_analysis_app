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
    return getRadarIndicators('knowledge', { max: maxVal, language: 'ja' });
  }, [maxVal]);

  const indicatorsGeneral = useMemo(() => {
    return getRadarIndicators('general', { max: maxVal, language: 'ja' });
  }, [maxVal]);

  const seriesKnowledge: RadarSeriesItem[] = useMemo(() => {
    const list: RadarSeriesItem[] = [
      {
        name: "現在",
        value: profile.cumulativeKnowledgeVector,
        color: "#6366f1", // indigo
      }
    ];
    if (simulationResult) {
      list.push({
        name: "仮追加後 (シミュレーション)",
        value: simulationResult.simulatedKnowledge,
        color: "#10b981", // emerald
      });
    }
    return list;
  }, [profile.cumulativeKnowledgeVector, simulationResult]);

  const seriesGeneral: RadarSeriesItem[] = useMemo(() => {
    const list: RadarSeriesItem[] = [
      {
        name: "現在",
        value: profile.cumulativeGeneralVector,
        color: "#3b82f6", // blue
      }
    ];
    if (simulationResult) {
      list.push({
        name: "仮追加後 (シミュレーション)",
        value: simulationResult.simulatedGeneral,
        color: "#10b981", // emerald
      });
    }
    return list;
  }, [profile.cumulativeGeneralVector, simulationResult]);

  // AIエージェントコンテキスト更新
  useEffect(() => {
    if (!isLoaded) return;
    setAnalyticsContext({
      pageTitle: "不足スキル補完・科目推薦",
      pagePath: "/micro/recommendation",
      summaryText: `学生個人の不足スキルを補填するための推奨科目一覧画面。現在の不足スキル: ${profile.weaknesses.map((w) => w.nameJa).join(', ')}。現在${recommendations.length}件の推奨科目を算出中。`,
      details: {
        enrolledCount: enrolledCourses.length,
        weaknesses: profile.weaknesses.map((w) => `${w.nameJa} (現在${w.score}点)`),
        simulatedCourse: simulatedCourse ? {
          name: simulatedCourse.course_name,
          faculty: simulatedCourse.faculty_name,
          credits: simulatedCourse.credits,
          gains: simulationResult?.gains.map((g) => `${g.nameJa}: +${g.diff}`),
        } : null,
        topRecommendations: recommendations.slice(0, 3).map((r) => ({
          name: r.course.course_name,
          faculty: r.course.faculty_name,
          matchScore: `${r.matchScore}%`,
        })),
      },
      presetQuestions: [
        "提示された推薦科目の中で最も効率的に弱点を埋められるものはどれ？",
        simulatedCourse 
          ? `「${simulatedCourse.course_name}」を履修するとどのスキルがどの程度伸びますか？`
          : "基幹教育科目の中から特に汎用スキルが伸びるおすすめは？",
        "私の不足スキルを補完する上で配慮すべき履修順序や学期はありますか？",
        "専門知識と汎用スキルのどちらを優先して補うべき？",
      ],
    });
  }, [isLoaded, enrolledCourses.length, profile.weaknesses, simulatedCourse, simulationResult, recommendations, setAnalyticsContext]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>ミクロな学習支援 &gt; Step 2</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            不足スキル補完・科目推薦
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            あなたの弱点・手薄なスキル項目を自動検出し、九州大学のシラバス群から最も効率的に補填できる科目を推薦します。
          </p>
        </div>

        <Link
          href="/micro/portfolio"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition shadow-2xs self-start sm:self-auto"
        >
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          <span>履修ポートフォリオに戻る</span>
        </Link>
      </div>

      {/* 不足スキルサマリーバー */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              補完対象となるあなたの不足スキル (ギャップ)
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xs text-slate-400">重点対象:</span>
            <button
              onClick={() => setTargetCategory('all')}
              className={`px-2.5 py-1 rounded text-2xs font-semibold transition ${targetCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
            >
              全スキル
            </button>
            <button
              onClick={() => setTargetCategory('knowledge')}
              className={`px-2.5 py-1 rounded text-2xs font-semibold transition ${targetCategory === 'knowledge' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
            >
              専門知識 (A群)
            </button>
            <button
              onClick={() => setTargetCategory('general')}
              className={`px-2.5 py-1 rounded text-2xs font-semibold transition ${targetCategory === 'general' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
            >
              汎用スキル (B群)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-3">
          {profile.weaknesses.length === 0 ? (
            <span className="text-xs text-slate-400">履修科目が登録されると不足スキルが判定されます</span>
          ) : (
            profile.weaknesses.map((w) => (
              <div
                key={w.code}
                className="px-3 py-1.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center space-x-2 text-xs"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{w.nameJa}</span>
                <span className="text-2xs text-rose-600 dark:text-rose-400 font-semibold">現在 {w.score}pt</span>
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
                <span className="text-slate-500 font-medium">学部:</span>
                <select
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100"
                >
                  {FACULTIES_LIST.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-medium">学期:</span>
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100"
                >
                  {SEMESTERS_LIST.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-2xs text-slate-400">
              {isLoadingCourses ? "推薦計算中..." : `上位 ${recommendations.length} 科目を表示`}
            </div>
          </div>

          {/* 推薦科目カード一覧 */}
          <div className="space-y-3">
            {isLoadingCourses ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                シラバスデータを分析し、あなたに最適な補完科目を計算しています...
              </div>
            ) : recommendations.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                条件に一致する推薦科目が見つかりませんでした。絞り込み条件を緩和してください。
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
                            {item.course.credits ?? 2}単位
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
                            <span className="text-slate-400">教員未記載</span>
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
                        <div className="text-2xs font-semibold text-slate-400">補完適合度</div>
                        <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                          {item.matchScore}%
                        </div>
                      </div>
                    </div>

                    {/* この科目で伸びる主要スキル */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-2xs text-slate-400 font-medium">獲得見込み:</span>
                      {item.targetedSkills.map((ts) => (
                        <span
                          key={ts.code}
                          className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 text-2xs font-semibold"
                        >
                          {ts.nameJa} <strong className="text-blue-900 dark:text-blue-200">+{ts.gain}pt</strong>
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
                        <span>{isSimulated ? "シミュレーション中 (解除)" : "仮追加してシミュレーション"}</span>
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
                            <span>履修登録済み</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>正式に履修追加</span>
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
                <span>履修シミュレーター (Before / After)</span>
              </h2>
              <p className="text-2xs text-slate-500 mt-0.5">
                科目を仮追加すると、スキルの伸び（エメラルド色の線）がリアルタイムに重なります
              </p>
            </div>

            {simulatedCourse ? (
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold text-emerald-800 dark:text-emerald-300">
                    シミュレーション対象科目
                  </span>
                  <button
                    onClick={() => setSimulatedCourse(null)}
                    className="text-2xs text-slate-400 hover:text-slate-600"
                  >
                    解除
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
                      {g.nameJa}: +{g.diff}pt ({g.before} → {g.after})
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                左の一覧から「仮追加してシミュレーション」をクリックすると、スキルの変化が確認できます
              </div>
            )}

            {/* レーダーチャート2面 */}
            <div className="space-y-4 pt-2">
              <div className="bg-slate-50/60 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <div className="text-center text-2xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                  専門知識スキル (A系列)
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
                  汎用スキル (B系列)
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
                  <span>この科目を履修リストに正式登録する</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
