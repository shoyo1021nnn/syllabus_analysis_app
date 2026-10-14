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
  BookOpen, 
  GraduationCap,
  Layers
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* トップヘッダー */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg bg-clip-text text-transparent bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600">
                Syllabus Analysis App
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                L1正規化対応版
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>24スキル体系（知識12 + 汎用12）</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">AI連動中</span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col justify-center space-y-12">
        {/* ヒーローセクション */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>大学カリキュラム・シラバス総合分析プラットフォーム</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            カリキュラムを可視化し、
            <br />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600">
              相乗効果ある学びの連携
            </span>
            をデザインする
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            全国の大学シラバスから抽出した24のスキル構成比（L1正規化）をもとに、現状の教育カリキュラムの客観的分析と、組織間のスキル相補・チーム編成シミュレーションを提供します。
          </p>
        </div>

        {/* 2大メイン導線カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full pt-4">
          
          {/* カード 1: スキルベクトル分析結果 */}
          <Link
            href="/analytics"
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 p-8 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* 上部背景アクセントグラデーション */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-blue-500 to-indigo-600 group-hover:h-2 transition-all duration-300"></div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/80 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  Analytics
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  スキルベクトル分析結果
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  全国の大学・学部・学科が持つ24次元のスキル構成比を客観的に比較・マッピングし、カリキュラムの現在地やベンチマーク対象を明確にします。
                </p>
              </div>

              {/* 含まれる3つの機能プレビュー */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <Network className="w-4 h-4 text-blue-500 shrink-0" />
                  <span><strong>K-meansクラスタリング:</strong> 全体分布をPCA散布図で俯瞰</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <GitCompare className="w-4 h-4 text-blue-500 shrink-0" />
                  <span><strong>類似度計算ランキング:</strong> ベンチマーク類似学科を算出</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <Radar className="w-4 h-4 text-blue-500 shrink-0" />
                  <span><strong>スキルレーダーチャート:</strong> 24項目の強み・弱みを直接対比</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold text-sm">
              <span>分析ダッシュボードを開く</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* カード 2: マクロな学習支援 */}
          <Link
            href="/macro"
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* 上部背景アクセントグラデーション */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-indigo-500 to-purple-600 group-hover:h-2 transition-all duration-300"></div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/80 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Users className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                  Macro Support
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  マクロな学習支援
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  自組織の不足スキルを補う連携パートナーの探索や、理想的なスキルバランスを達成するためのベストペア・最適チーム編成をシミュレーションします。
                </p>
              </div>

              {/* 含まれる3つの機能プレビュー */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <Compass className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span><strong>スキル補完検索:</strong> 不足を補い合う相補パートナー探索</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span><strong>ベスト・ペア検索:</strong> 1対1結合(Max/Mean)で最高シナジーを特定</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <UserPlus className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span><strong>チーム編成支援:</strong> 貪欲法による多人数スキルカバレッジ最適化</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <span>学習支援メニューを開く</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

        </div>

        {/* 下部情報カード: 24スキル体系 & L1正規化の解説 */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-xl p-6 border border-slate-200 dark:border-slate-800 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
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
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
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
