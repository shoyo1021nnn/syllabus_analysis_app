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
  GraduationCap
} from "lucide-react";

export default function HomePage() {
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

        {/* 2大メイン導線カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full pt-4">
          
          {/* カード 1: スキルベクトル分析結果（ティール基調） */}
          <Link
            href="/analytics"
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 p-8 shadow-sm hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* 上部背景アクセントグラデーション */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-teal-500 to-teal-600 group-hover:h-2 transition-all duration-300"></div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800/80 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                  Analytics
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  スキルベクトル分析結果
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  全国の大学・学部・学科が持つ24次元のスキル構成比を客観的に比較・マッピングし、カリキュラムの現在地やベンチマーク対象を明確にします。
                </p>
              </div>

              {/* 含まれる3つの機能プレビュー */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <Network className="w-4 h-4 text-teal-600 shrink-0" />
                  <span><strong>K-meansクラスタリング:</strong> 全体分布をPCA散布図で俯瞰</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <GitCompare className="w-4 h-4 text-teal-600 shrink-0" />
                  <span><strong>類似度計算ランキング:</strong> ベンチマーク類似学科を算出</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <Radar className="w-4 h-4 text-teal-600 shrink-0" />
                  <span><strong>スキルレーダーチャート:</strong> 24項目の強み・弱みを直接対比</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 flex items-center justify-between text-teal-600 dark:text-teal-400 font-bold text-sm">
              <span>分析ダッシュボードを開く</span>
              <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* カード 2: マクロな学習支援（テラコッタオレンジ基調） */}
          <Link
            href="/macro"
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 p-8 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* 上部背景アクセントグラデーション */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-orange-500 to-orange-600 group-hover:h-2 transition-all duration-300"></div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800/80 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Users className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                  Macro Support
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  マクロな学習支援
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  自組織の不足スキルを補う連携パートナーの探索や、理想的なスキルバランスを達成するためのベストペア・最適チーム編成をシミュレーションします。
                </p>
              </div>

              {/* 含まれる3つの機能プレビュー */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <Compass className="w-4 h-4 text-orange-500 shrink-0" />
                  <span><strong>スキル補完検索:</strong> 不足を補い合う相補パートナー探索</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
                  <span><strong>ベスト・ペア検索:</strong> 1対1結合(Max/Mean)で最高シナジーを特定</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <UserPlus className="w-4 h-4 text-orange-500 shrink-0" />
                  <span><strong>チーム編成支援:</strong> 貪欲法による多人数スキルカバレッジ最適化</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 flex items-center justify-between text-orange-600 dark:text-orange-400 font-bold text-sm">
              <span>学習支援メニューを開く</span>
              <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
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
