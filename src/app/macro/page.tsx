"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { 
  Compass, 
  Sparkles, 
  UserPlus, 
  ArrowRight, 
  BookOpen, 
  Layers, 
  CheckCircle2,
  Users,
  Target,
  Workflow
} from 'lucide-react';
import { useAnalyticsContext } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';

export default function MacroMenuPage() {
  const { setAnalyticsContext } = useAnalyticsContext();
  const { language, t } = useLanguage();

  useEffect(() => {
    const isEn = language === 'en';
    setAnalyticsContext({
      pageTitle: t('macro.hub.pageTitle', 'マクロな学習支援ポータル'),
      pagePath: '/macro',
      primaryTarget: undefined,
      compareTarget: undefined,
      summaryText: t('macro.hub.summaryText', 'マクロな学習支援トップメニュー（3つの最適化・編成シミュレーション機能）'),
      details: {
        availableFeatures: [
          {
            name: isEn ? 'Skill Complementation Search' : 'スキル補完検索',
            path: '/macro/skill_complementation',
            purpose: isEn
              ? 'Ranks other universities/organizations capable of complementing weak skills to discover synergistic partners'
              : '自組織の不足スキルを補完できる他大学・他組織をランキングし、相乗効果のある連携先を発見'
          },
          {
            name: isEn ? 'Best Pairs Search' : 'ベスト・ペア検索',
            path: '/macro/best_pair',
            purpose: isEn
              ? 'Explores 1-on-1 pairs achieving highest overall skill uplift via Max or Mean pooling'
              : '2組織（1対1）で結合した際、最大値(Max)または平均値(Mean)で最高の総合スキル向上を達成するペアを探索'
          },
          {
            name: isEn ? 'Team Formation Support' : 'チーム編成支援',
            path: '/macro/greedy_team',
            purpose: isEn
              ? 'Simulates multi-member teams stepwise via greedy algorithm to satisfy member counts or skill thresholds'
              : '貪欲法(Greedy)により、指定人数または目標スキル閾値を達成する最適な多人数チームを段階的シミュレーション'
          }
        ],
        theoreticalFramework: isEn ? [
          'Max Pooling: Collaborative model where individual strengths and standout skills drive overall team outcomes',
          'Mean Pooling: Baseline model where all member skills average out to evaluate overall uplift',
          'Ideal Vector: Evaluated against an ideal state where all 24 skills are uniformly high (3.0)'
        ] : [
          '最大値結合(Max Pooling): 各組織の得意分野・突出した強みがチーム全体の成果に活かされる協働モデル',
          '平均値結合(Mean Pooling): 参加者全員のスキルが平均化され、チーム全体の総合的ベースラインを想定するモデル',
          '理想ベクトル(Ideal Vector): 全スキルが均等に高い水準(3.0)を満たす理想状態を目標として評価'
        ]
      },
      presetQuestions: isEn ? [
        'What are the differences and primary use cases of the 3 macro analysis methods?',
        'How do educational interpretations differ between Max Pooling and Mean Pooling?',
        'Which feature should an institution start with when exploring collaboration partners?',
        'What is the complementation approach designed to close gaps with the ideal vector?'
      ] : [
        'マクロな学習支援における3つの分析手法の違いと活用シーンは？',
        '「最大値結合」と「平均値結合」の教育的な解釈はどう違いますか？',
        '自組織のカリキュラム連携先を探す際、どの機能から始めるのがおすすめ？',
        '理想ベクトルとのギャップを埋める補完アプローチとは何ですか？'
      ],
    });
  }, [setAnalyticsContext, language, t]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* ヒーローセクション */}
      <div className="bg-linear-to-r from-orange-950 via-orange-900 to-amber-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-orange-200 border border-white/15 text-xs font-semibold">
            <Users className="w-4 h-4 text-orange-300" />
            <span>Macro Learning Support & Multi-Organization Synergy</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {t('macro.hub.title', 'マクロな学習支援（組織間連携・チーム編成）')}
          </h1>
          <p className="text-orange-100 text-sm max-w-2xl leading-relaxed">
            {t('macro.hub.subtitle', '自組織の不足スキルを補う連携パートナー探索や、相乗効果を最大化するベストペア・最適チーム編成を支援します。')}
          </p>
        </div>
      </div>

      {/* シミュレーション基盤・ステータスサマリー */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Layers className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {t('macro.hub.badge', '組織連携・カリキュラム最適化')}
            </h2>
          </div>
          <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800">
            Synergy Optimization
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/60">
            <div className="text-xs font-medium text-orange-700 dark:text-orange-300">
              {t('macro.hub.approachLabel', '支援アプローチ')}
            </div>
            <div className="text-xl font-black text-orange-950 dark:text-white mt-1">
              3 Approaches
            </div>
            <p className="text-2xs text-slate-500 mt-0.5">Complement / Best Pair / Greedy Team</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60">
            <div className="text-xs font-medium text-amber-700 dark:text-amber-300">{t('macro.bestPair.combineMethod', '合成方式:')}</div>
            <div className="text-xl font-black text-amber-950 dark:text-white mt-1">
              Max / Mean <span className="text-xs font-normal text-slate-500">Pooling</span>
            </div>
            <p className="text-2xs text-slate-500 mt-0.5">Complementary & Harmonious</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t('macro.hub.targetLevelLabel', '目標水準')}
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              Ideal Vector (3.0)
            </div>
            <p className="text-2xs text-slate-500 mt-0.5">Balanced & Multi-Disciplinary</p>
          </div>
        </div>

        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-orange-500 shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong>{t('home.cards.macro.title', 'マクロな学習支援')}:</strong> {t('home.cards.macro.desc', '自組織の不足スキルを補う連携パートナー探索や、理想的なスキルバランスを達成するベストペア・最適チーム編成を支援します。')}
            </p>
          </div>
          <Link
            href="/macro/skill_complementation"
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-xs shrink-0 ml-4"
          >
            {t('home.cards.macro.action', '学習支援メニュー')}
          </Link>
        </div>
      </div>

      {/* 3大機能カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* カード 1: スキル補完検索 */}
        <Link
          href="/macro/skill_complementation"
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 p-6 shadow-xs hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800/80 group-hover:scale-105 group-hover:bg-orange-600 group-hover:text-white transition-all duration-200 shadow-2xs">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                {t('macro.hub.cards.complementation.step', 'Step 1: 弱点相補')}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors mt-0.5">
                {t('macro.hub.cards.complementation.title', 'スキル補完検索')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {t('macro.hub.cards.complementation.desc', '自組織で相対的に手薄なスキル群を特定し、それを最も強力に補える他大学・学部のパートナーを算出します。')}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-orange-600 dark:text-orange-400 font-bold text-xs">
            <span>{t('macro.hub.cards.complementation.action', '補完パートナーを探す')}</span>
            <div className="w-7 h-7 rounded-full bg-orange-50 dark:bg-orange-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>

        {/* カード 2: ベスト・ペア検索 */}
        <Link
          href="/macro/best_pair"
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 p-6 shadow-xs hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800/80 group-hover:scale-105 group-hover:bg-orange-600 group-hover:text-white transition-all duration-200 shadow-2xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                {t('macro.hub.cards.bestPair.step', 'Step 2: 1対1結合')}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors mt-0.5">
                {t('macro.hub.cards.bestPair.title', 'ベスト・ペア検索')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {t('macro.hub.cards.bestPair.desc', '2組織が合わさった際に全スキルのバランスが最大化される、相乗効果（シナジー）の高い組み合わせを発見します。')}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-orange-600 dark:text-orange-400 font-bold text-xs">
            <span>{t('macro.hub.cards.bestPair.action', 'ベストペアを探索する')}</span>
            <div className="w-7 h-7 rounded-full bg-orange-50 dark:bg-orange-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>

        {/* カード 3: チーム編成支援 */}
        <Link
          href="/macro/greedy_team"
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 p-6 shadow-xs hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800/80 group-hover:scale-105 group-hover:bg-orange-600 group-hover:text-white transition-all duration-200 shadow-2xs">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                {t('macro.hub.cards.greedyTeam.step', 'Step 3: 多人数編成')}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors mt-0.5">
                {t('macro.hub.cards.greedyTeam.title', 'チーム編成支援')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {t('macro.hub.cards.greedyTeam.desc', '貪欲法アルゴリズムにより、指定人数で理想的な全方位スキルバランスを達成する学際的チームを自動編成します。')}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-orange-600 dark:text-orange-400 font-bold text-xs">
            <span>{t('macro.hub.cards.greedyTeam.action', '最適チームを編成する')}</span>
            <div className="w-7 h-7 rounded-full bg-orange-50 dark:bg-orange-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>

      </div>

      {/* 理論・背景解説カード */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-orange-600" />
          <span>{t('macro.hub.theory.title', 'マクロな学習支援の理論的背景と結合モデル')}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-100">{t('macro.hub.theory.poolingTitle', '① 結合アプローチの定義 (Max vs Mean):')}</span>
            <p className="leading-relaxed">
              {t('macro.hub.theory.maxPoolingDesc', '最大値結合(Max Pooling): 各組織の突出した強みを最大限に活かすアプローチです。チーム内で誰か一人でも高い専門性を持っていればそのスキルがチーム能力として反映されます。')}
            </p>
            <p className="leading-relaxed pt-1">
              {t('macro.hub.theory.meanPoolingDesc', '平均値結合(Mean Pooling): 組織全員のスキルの平均をとるアプローチです。チーム全体の底上げや共通基盤の充実度を評価します。')}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-100">{t('macro.hub.theory.idealTitle', '② 目標としての「理想ベクトル」:')}</span>
            <p className="leading-relaxed">
              {t('macro.hub.theory.idealDesc', '全24スキルがバランスよく習得できる状態（各次元が均等に高水準な3.0を満たすベクトル）を「理想ベクトル」と定義し、連携によってどれだけ理想ベクトルに近づけるかを定量的に評価します。')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
