"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useAnalyticsContext } from '@/context/AnalyticsContext';
import { Compass, Sparkles, UserPlus, ArrowRight, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import BackButton from '@/components/BackButton';

export default function MacroMenuPage() {
  const { setAnalyticsContext } = useAnalyticsContext();

  useEffect(() => {
    setAnalyticsContext({
      pageTitle: 'マクロな学習支援メニュー',
      primaryTarget: undefined,
      compareTarget: undefined,
      summaryText: 'マクロな学習支援トップメニュー（3つの最適化・編成シミュレーション機能）',
      details: {
        availableFeatures: [
          {
            name: 'スキル補完検索',
            path: '/macro/skill_complementation',
            purpose: '自組織の不足スキルを補完できる他大学・他組織をランキングし、相乗効果のある連携先を発見'
          },
          {
            name: 'ベスト・ペア検索',
            path: '/macro/best_pair',
            purpose: '2組織（1対1）で結合した際、最大値(Max)または平均値(Mean)で最高の総合スキル向上を達成するペアを探索'
          },
          {
            name: 'チーム編成支援',
            path: '/macro/greedy_team',
            purpose: '貪欲法(Greedy)により、指定人数または目標スキル閾値を達成する最適な多人数チームを段階的シミュレーション'
          }
        ],
        theoreticalFramework: [
          '最大値結合(Max Pooling): 各組織の得意分野・突出した強みがチーム全体の成果に活かされる協働モデル',
          '平均値結合(Mean Pooling): 参加者全員のスキルが平均化され、チーム全体の総合的ベースラインを想定するモデル',
          '理想ベクトル(Ideal Vector): 全スキルが均等に高い水準(3.0)を満たす理想状態を目標として評価'
        ]
      },
      presetQuestions: [
        'マクロな学習支援における3つの分析手法の違いと活用シーンは？',
        '「最大値結合」と「平均値結合」の教育的な解釈はどう違いますか？',
        '自組織のカリキュラム連携先を探す際、どの機能から始めるのがおすすめ？',
        '理想ベクトルとのギャップを埋める補完アプローチとは何ですか？'
      ],
    });
  }, [setAnalyticsContext]);

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      {/* ナビゲーション戻るボタン */}
      <div className="flex items-center">
        <BackButton label="ホーム画面に戻る" fallbackHref="/" />
      </div>

      {/* ページタイトル & 概要 */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-orange-50 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 rounded-xl border border-orange-200/80 dark:border-orange-800/60">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              マクロな学習支援
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              単一カリキュラムの分析を超え、組織間の相乗効果（シナジー）を創出する3つの学習支援シミュレーション
            </p>
          </div>
        </div>
      </div>

      {/* 3つのメイン機能ボタン（カードグリッド） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* 1. スキル補完検索 */}
        <Link
          href="/macro/skill_complementation"
          className="group bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 p-6 shadow-xs hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                相補パートナー探索
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                1. スキル補完検索
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                自組織の弱点スキル（不足スキル）を補完できるパートナー組織を探索。専門一致＋相補やギャップ補填など多角的アプローチに対応。
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-orange-600 dark:text-orange-400 font-bold text-xs">
            <span>スキル補完検索を開く</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* 2. ベスト・ペア検索 */}
        <Link
          href="/macro/best_pair"
          className="group bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 p-6 shadow-xs hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                1対1 最高シナジー
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                2. ベスト・ペア検索
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                2組織が組んだ際に最大のシナジーを発揮する相手を探索。最大値結合（強み特化）と平均値結合（総合力向上）の2方式で比較可能。
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-orange-600 dark:text-orange-400 font-bold text-xs">
            <span>ベスト・ペア検索を開く</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* 3. チーム編成支援 */}
        <Link
          href="/macro/greedy_team"
          className="group bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 p-6 shadow-xs hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                <UserPlus className="w-6 h-6" />
              </div>
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                Greedy多人数編成
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                3. チーム編成支援
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                貪欲法により、目標人数またはスキル閾値を達成するまで最適なパートナーを1組織ずつ追加。多人数チームの段階的スキル補強を可視化。
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-orange-600 dark:text-orange-400 font-bold text-xs">
            <span>チーム編成支援を開く</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

      </div>

      {/* 理論・背景解説アコーディオン/カード */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          マクロな学習支援の理論的背景
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-100">結合アプローチの定義:</span>
            <p className="leading-relaxed">
              <strong>最大値結合:</strong> 各組織の突出した強みを最大限に活かすアプローチです。チーム内で誰か一人でも高い専門性を持っていればそのスキルがチーム能力として反映されます。
            </p>
            <p className="leading-relaxed pt-1">
              <strong>平均値結合:</strong> 組織全員のスキルの平均をとるアプローチです。チーム全体の底上げや共通基盤の充実を評価します。
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-100">目標としての理想ベクトル:</span>
            <p className="leading-relaxed">
              全24スキルがバランスよく習得できる状態（各次元が均等に高水準なベクトル）を「理想ベクトル」と定義し、連携によってどれだけ理想ベクトルに近づけるかを定量的に評価します。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
