"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  GraduationCap, 
  Sparkles, 
  ArrowRight, 
  Award, 
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { EnrolledCourse } from "@/types/database";
import { calculatePersonalSkillProfile } from "@/lib/vectorUtils";
import { useAnalyticsContext } from "@/context/AnalyticsContext";
import { useLanguage } from "@/context/LanguageContext";

const STORAGE_KEY = "syllabus_enrolled_courses";

export default function MicroIndexPage() {
  const { t, language } = useLanguage();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { setAnalyticsContext } = useAnalyticsContext();

  // LocalStorageから履修科目リストを取得
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
      console.error("Failed to load enrolled courses from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // プロファイルの算出
  const profile = calculatePersonalSkillProfile(enrolledCourses);

  // AIエージェント用コンテキストを更新
  useEffect(() => {
    if (!isLoaded) return;
    const isEn = language === 'en';
    setAnalyticsContext({
      pageTitle: t('micro.hub.pageTitle', 'ミクロな学習支援ポータル'),
      pagePath: "/micro",
      summaryText: isEn
        ? `Top portal for student course enrollment and cumulative skill portfolio. Currently enrolled: ${enrolledCourses.length} courses, Total: ${profile.totalCredits} credits.`
        : `学生個人の履修状況とスキル累積ポートフォリオのトップ画面。現在登録済み科目数: ${enrolledCourses.length}科目、総単位数: ${profile.totalCredits}単位。`,
      details: {
        enrolledCount: enrolledCourses.length,
        totalCredits: profile.totalCredits,
        topStrengths: profile.strengths.map((s) => `${isEn ? (s.nameEn || s.nameJa) : s.nameJa} (${s.score}pt)`),
        weaknesses: profile.weaknesses.map((s) => `${isEn ? (s.nameEn || s.nameJa) : s.nameJa} (${s.score}pt)`),
      },
      presetQuestions: isEn ? [
        "What kind of analysis can I perform in Micro Learning Support?",
        "How are my 24-dimensional skills calculated from enrolled courses?",
        "What criteria are used to recommend courses for filling skill gaps?",
        "What strengths can be expected from my currently enrolled courses?",
      ] : [
        "ミクロな学習支援ではどのような分析ができますか？",
        "履修科目を登録するとスキルはどのように計算されますか？",
        "弱点スキルを補う科目はどのような基準で推薦されますか？",
        "現在登録されている履修内容から見込める強みは？",
      ],
    });
  }, [isLoaded, enrolledCourses.length, profile.totalCredits, setAnalyticsContext, language, t]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* ヒーローセクション */}
      <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 border border-white/15 text-xs font-semibold">
            <GraduationCap className="w-4 h-4 text-indigo-300" />
            <span>{t('micro.hub.badge', 'Personal Learning Portfolio & Course Recommendation')}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {t('micro.hub.title', 'ミクロな学習支援（個人向け履修・スキル分析）')}
          </h1>
          <p className="text-indigo-100 text-sm max-w-2xl leading-relaxed">
            {t('micro.hub.subtitle', '九州大学全12学部および基幹教育科目（全5,903科目）のシラバス分析データを活用。あなたが履修した科目を選択することで、獲得した24次元スキルがリアルタイムに蓄積・可視化され、自分に不足しているスキルを効率的に補完できる推奨科目を自動計算します。')}
          </p>
        </div>
      </div>

      {/* 現在の履修状況クイックサマリー */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {t('micro.hub.statusTitle', '現在のあなたの履修ステータス')}
            </h2>
          </div>
          <Link
            href="/micro/portfolio"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold inline-flex items-center space-x-1"
          >
            <span>{t('micro.hub.editCourses', '履修科目を編集・追加する')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
            <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{t('micro.hub.enrolledCountLabel', '登録済み科目数')}</div>
            <div className="text-2xl font-black text-indigo-950 dark:text-white mt-1">
              {enrolledCourses.length} <span className="text-xs font-normal text-slate-500">{t('common.subjectCount', '科目')}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-300">{t('micro.hub.creditsLabel', '獲得単位数（推定）')}</div>
            <div className="text-2xl font-black text-blue-950 dark:text-white mt-1">
              {profile.totalCredits} <span className="text-xs font-normal text-slate-500">{t('micro.portfolio.credits', '単位')}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{t('micro.hub.topSkillLabel', '現在の筆頭スキル')}</div>
            <div className="text-base font-bold text-emerald-950 dark:text-emerald-100 mt-1 truncate">
              {profile.strengths.length > 0 
                ? (language === 'en' ? profile.strengths[0].nameEn || profile.strengths[0].nameJa : profile.strengths[0].nameJa)
                : t('micro.hub.notEnrolled', '未登録')}
            </div>
          </div>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {t('micro.hub.noCoursesNotice', 'まだ履修科目が登録されていません。まずは「履修・スキルポートフォリオ」から受講済み科目を追加しましょう。')}
              </p>
            </div>
            <Link
              href="/micro/portfolio"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs shrink-0 ml-4"
            >
              {t('micro.hub.addCoursesBtn', '科目を登録する')}
            </Link>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">{t('micro.hub.previewLabel', '登録科目プレビュー:')}</span>
            {enrolledCourses.slice(0, 5).map((e) => (
              <span
                key={e.course.id}
                className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {e.course.course_name}
              </span>
            ))}
            {enrolledCourses.length > 5 && (
              <span className="text-slate-400">
                {language === 'en' ? `+${enrolledCourses.length - 5} more` : `他 ${enrolledCourses.length - 5} 科目`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2大機能カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* カード 1: 履修・スキルポートフォリオ */}
        <Link
          href="/micro/portfolio"
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 p-7 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/80 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                {t('micro.hub.cards.portfolio.step', 'Step 1: 蓄積 ＆ 可視化')}
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors mt-0.5">
                {t('micro.hub.cards.portfolio.title', '履修・スキルポートフォリオ')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {t('micro.hub.cards.portfolio.desc', '5,903科目から受講した科目を自在に検索・チェック。履修科目のスキル値が累積加算され、知識A群・汎用B群の2面レーダーチャートで現在のスキルバランスを直感的に把握できます。')}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            <span>{t('micro.hub.cards.portfolio.action', 'ポートフォリオを開く')}</span>
            <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>

        {/* カード 2: 不足スキル補完・科目推薦 */}
        <Link
          href="/micro/recommendation"
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 p-7 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/80 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                {t('micro.hub.cards.recommendation.step', 'Step 2: ギャップ分析 ＆ 補完')}
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors mt-0.5">
                {t('micro.hub.cards.recommendation.title', '不足スキル補完・科目推薦')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {t('micro.hub.cards.recommendation.desc', 'あなたの手薄なスキル項目を自動検出し、それを集中的に補完できる科目をランキング提示。履修シミュレーターで「もし履修したらどう伸びるか」を事前確認できます。')}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold text-xs">
            <span>{t('micro.hub.cards.recommendation.action', '科目推薦シミュレーターを開く')}</span>
            <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>
      </div>

      {/* スキル蓄積（案B）の解説カード */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>{t('micro.hub.theoryTitle', 'スキル累積加算（案B）による成長実感')}</span>
        </h3>
        <p className="leading-relaxed">
          {t('micro.hub.theoryDesc', '本ミクロ支援システムでは、科目を履修するごとに各科目が持つ24次元のスキル値（0〜9点）が加算され、個人のスキル多角形が外側へと成長していきます。単なる平均比率ではなく、「どれだけ多様な専門知識や汎用能力を学んだか」がダイナミックに可視化されるため、自己の学習成果の客観的な振り返りや、次学期の履修計画立案に役立てることができます。')}
        </p>
      </div>
    </div>
  );
}
