"use client";

import Link from "next/link";
import { 
  BarChart3, 
  Users, 
  Network, 
  GitCompare, 
  Radar, 
  Sparkles,
  Compass, 
  UserPlus, 
  ArrowRight, 
  CheckCircle2,
  Layers,
  GraduationCap,
  Building2
} from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* トップヘッダー */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-teal-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg bg-clip-text text-transparent bg-linear-to-r from-teal-600 via-teal-700 to-orange-600">
                Syllabus Analysis App
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/universities"
              className="flex items-center space-x-2 text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50/50 dark:hover:bg-slate-700 hover:border-emerald-500 transition-colors shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t("nav.universitiesTitle", "大学・学部・学科の基本情報")}</span>
            </Link>
            <span className="text-slate-200 dark:text-slate-700">|</span>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col justify-center space-y-12">
        {/* ヒーローセクション */}
        <div className="text-center flex flex-col items-center justify-center space-y-4 max-w-3xl mx-auto pt-4 pb-2">
          <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-teal-600 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/25 border border-white/20">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-teal-600 via-teal-700 to-orange-600">
            Syllabus Analysis App
          </h1>
        </div>

        {/* 3大メイン導線カード */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full pt-4">
          
          {/* カード 1: スキルベクトル分析結果（ティール基調） */}
          <Link
            href="/analytics"
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 p-7 shadow-xs hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* 上部背景アクセントグラデーション */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-teal-500 to-teal-600 group-hover:h-2 transition-all duration-300"></div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800/80 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-xs">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                  Analytics
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {t('home.cards.analytics.title', 'スキル分析結果')}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {t('home.cards.analytics.desc', '全国の大学・学部・学科が持つ24次元のスキル構成比を客観的に比較・マッピングし、カリキュラムの現在地やベンチマーク対象を明確にします。')}
                </p>
              </div>

              {/* 含まれる3つの機能プレビュー */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                  <Network className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>{t('home.cards.analytics.clustering', 'クラスタリング: PCA散布図で俯瞰')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                  <GitCompare className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>{t('home.cards.analytics.similarity', '類似度ランキング: 類似学科を算出')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                  <Radar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>{t('home.cards.analytics.radar', 'レーダーチャート: 強み・弱みを対比')}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 flex items-center justify-between text-teal-600 dark:text-teal-400 font-bold text-xs">
              <span>{t('home.cards.analytics.action', '分析ダッシュボード')}</span>
              <div className="w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>

          {/* カード 2: マクロな学習支援（テラコッタオレンジ基調） */}
          <Link
            href="/macro"
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 p-7 shadow-xs hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* 上部背景アクセントグラデーション */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-orange-500 to-orange-600 group-hover:h-2 transition-all duration-300"></div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800/80 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                  Macro Support
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {t('home.cards.macro.title', 'マクロな学習支援')}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {t('home.cards.macro.desc', '自組織の不足スキルを補う連携パートナー探索や、理想的なスキルバランスを達成するベストペア・最適チーム編成を支援します。')}
                </p>
              </div>

              {/* 含まれる3つの機能プレビュー */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                  <Compass className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{t('home.cards.macro.complementation', 'スキル補完検索: 弱点を最大補完')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{t('home.cards.macro.bestPair', 'ベスト・ペア検索: 相乗効果の最大化')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                  <UserPlus className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{t('home.cards.macro.greedyTeam', 'チーム編成支援: 貪欲法で最適チーム')}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 flex items-center justify-between text-orange-600 dark:text-orange-400 font-bold text-xs">
              <span>{t('home.cards.macro.action', '学習支援メニュー')}</span>
              <div className="w-7 h-7 rounded-full bg-orange-50 dark:bg-orange-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>

          {/* カード 3: ミクロな学習支援（インディゴ基調） */}
          <Link
            href="/micro"
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 p-7 shadow-xs hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* 上部背景アクセントグラデーション */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-indigo-500 to-indigo-600 group-hover:h-2 transition-all duration-300"></div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/80 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                  Micro Support
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {t('home.cards.micro.title', 'ミクロな教育支援')}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {t('home.cards.micro.desc', '学生個人の履修登録データや成績通知書PDFから24次元スキル蓄積を可視化し、不足スキルを補う最適な履修科目を推薦します。')}
                </p>
              </div>

              {/* 含まれる3つの機能プレビュー */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{t('home.cards.micro.portfolio', '履修ポートフォリオ: 取得スキル蓄積')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                  <Radar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{t('home.cards.micro.pdfImport', 'PDF成績取り込み: 自動パース・登録')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{t('home.cards.micro.recommendation', '不足スキル補完: 弱点科目の推薦')}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              <span>{t('home.cards.micro.action', '教育支援メニュー')}</span>
              <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        </div>

        {/* 大学・学部・学科の基本情報ページ 導線カード */}
        <div className="max-w-6xl mx-auto w-full">
          <Link
            href="/universities"
            className="group relative block bg-linear-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:shadow-emerald-900/20 border border-slate-700/60 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden"
          >
            {/* 背景装飾 */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/15 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center space-x-4 sm:space-x-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 group-hover:scale-105 group-hover:bg-emerald-500/30 transition-all duration-300">
                  <Building2 className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                      Directory & Profiles
                    </span>
                    <span className="text-xs text-slate-400">{t('universities.badge', '組織データ')}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-emerald-200 transition-colors">
                    {t('universities.title', '大学・学部・学科の基本情報')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    {t('universities.subtitle', '全国の主要大学における組織構造（学部・学科）および科目数と公式リンクを一覧表示します。')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/30 group-hover:translate-x-1 transition-all">
                <span>{t('common.detail', '基本情報を見る')}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        {/* 下部情報カード: 24スキル体系 & L1正規化の解説 */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-xl p-6 border border-slate-200 dark:border-slate-800 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-lg shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">
                L1正規化による客観的評価
              </h3>
              <p className="leading-relaxed">
                総科目数の差（大規模大学と小規模大学の科目数格差）によるバイアスを排除するため、全スキル構成比の合計が100%となるようL1正規化を適用し、公平な比較を実現しています。
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 rounded-lg shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">
                24スキル体系（知識12群・汎用12群）
              </h3>
              <p className="leading-relaxed">
                専門知識に関するA群12項目（ICT、自然科学、人文学等）と、社会で活用する汎用スキルに関するB群12項目（論理思考、問題解決、チームワーク等）を網羅的に捉えます。
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* フッター */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>© Syllabus Analysis App - 大学シラバス・カリキュラム分析 ＆ マクロな学習支援システム</p>
      </footer>
    </div>
  );
}
