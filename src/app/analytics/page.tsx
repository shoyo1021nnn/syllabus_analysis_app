"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Network, 
  GitCompare, 
  Radar, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  Compass,
  TrendingUp,
  Database,
  Building2
} from 'lucide-react';
import { useAnalyticsContext } from '@/context/AnalyticsContext';

export default function AnalyticsIndexPage() {
  const { setAnalyticsContext } = useAnalyticsContext();

  useEffect(() => {
    setAnalyticsContext({
      pageTitle: 'スキルベクトル分析ポータル',
      pagePath: '/analytics',
      primaryTarget: undefined,
      compareTarget: undefined,
      summaryText: 'シラバス分析ダッシュボードのトップポータル（3つの客観的分析機能を提供）',
      details: {
        availableFeatures: [
          { name: 'K-meansクラスタリング', path: '/analytics/clustering', purpose: '全国の学科のスキル分布をPCAで2次元に縮約・散布図表示し、全体傾向やグループ分けを把握' },
          { name: '類似度計算ランキング', path: '/analytics/similarity', purpose: '基準学科と他大学のカリキュラム類似度を計算し、類似学科を特定・ベンチマーク' },
          { name: 'スキルレーダーチャート', path: '/analytics/radar_chart', purpose: '知識12項目・汎用12項目の計24スキル構成比を2学科で直接重ね合わせ詳細対比' }
        ],
        recommendedWorkflow: [
          'ステップ1: K-meansクラスタリングで自学科が全体の中でどのような位置に属しているかを俯瞰',
          'ステップ2: 類似度計算ランキングで自学科と類似しているベンチマーク対象の他大学学科を特定',
          'ステップ3: スキルレーダーチャートでベンチマーク学科と自学科の24スキル構成比を重ね合わせ、強みや補強点を詳細比較'
        ],
        taxonomySummary: 'A群(知識スキル12項目: A-1〜A-12)およびB群(汎用スキル12項目: B-1〜B-12)の計24項目'
      },
      presetQuestions: [
        'Syllabus AIでできる分析の種類と特徴を教えて',
        '自学科のカリキュラムを見直すにはどの分析から始めるべき？',
        'シラバスから抽出される24のスキル体系とは何ですか？',
        'L1正規化によってどのようなバイアスが排除されますか？',
      ],
    });
  }, [setAnalyticsContext]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* ヒーローセクション */}
      <div className="bg-linear-to-r from-teal-950 via-teal-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-teal-200 border border-white/15 text-xs font-semibold">
            <BarChart3 className="w-4 h-4 text-teal-300" />
            <span>Curriculum Analytics & Skill Vector Mapping</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            スキルベクトル分析（全国カリキュラム俯瞰・比較）
          </h1>
          <p className="text-teal-100 text-sm max-w-2xl leading-relaxed">
            全国の大学・学部・学科が持つ24次元のスキル構成比（比率データ）を客観的に比較・マッピング。
            クラスタリングによる全体俯瞰、類似度計算によるベンチマーク特定、レーダーチャートによる直接対比の3つの視点からカリキュラムの客観的特徴を明らかにします。
          </p>
        </div>
      </div>

      {/* 分析基盤・ステータスサマリー */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Database className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              分析システムのデータ基盤と評価仕様
            </h2>
          </div>
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">
            全24スキル体系 準拠
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60">
            <div className="text-xs font-medium text-teal-700 dark:text-teal-300">分析対象階層</div>
            <div className="text-xl font-black text-teal-950 dark:text-white mt-1">
              大学・学部・学科
            </div>
            <p className="text-2xs text-slate-500 mt-0.5">全国の多様なカリキュラムデータを保持</p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">スキル分類次元</div>
            <div className="text-xl font-black text-emerald-950 dark:text-white mt-1">
              24 次元 <span className="text-xs font-normal text-slate-500">(12群×2)</span>
            </div>
            <p className="text-2xs text-slate-500 mt-0.5">知識A群12項目 ＆ 汎用B群12項目</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">客観評価手法</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              L1正規化 (100%)
            </div>
            <p className="text-2xs text-slate-500 mt-0.5">科目数格差を排除した比率比較</p>
          </div>
        </div>

        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Compass className="w-5 h-5 text-teal-600 shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong>推奨ワークフロー:</strong> 「Step 1: クラスタリング」で全体分布を俯瞰 → 「Step 2: 類似度」でベンチマーク学科を特定 → 「Step 3: レーダー」で詳細対比を行うと効果的です。
            </p>
          </div>
          <Link
            href="/analytics/clustering"
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs shrink-0 ml-4"
          >
            分析を開始する
          </Link>
        </div>
      </div>

      {/* 3大機能カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* カード 1: K-meansクラスタリング */}
        <Link
          href="/analytics/clustering"
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 p-6 shadow-xs hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800/80 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all duration-200 shadow-2xs">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                Step 1: 全体俯瞰
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors mt-0.5">
                K-meansクラスタリング
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                全国の学科のスキル分布を主成分分析(PCA)で2次元に縮約して散布図上に可視化。全体傾向や自学科が属するグループを直感的に俯瞰できます。
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-teal-600 dark:text-teal-400 font-bold text-xs">
            <span>クラスタリングを開く</span>
            <div className="w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>

        {/* カード 2: 類似度計算ランキング */}
        <Link
          href="/analytics/similarity"
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 p-6 shadow-xs hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800/80 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all duration-200 shadow-2xs">
              <GitCompare className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                Step 2: 類似探索
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors mt-0.5">
                類似度計算ランキング
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                コサイン類似度等の距離指標を用いて、選択した基準学科と教育内容・スキル構成が最も近い他大学・他学科を発見し、ベンチマーク分析を行います。
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-teal-600 dark:text-teal-400 font-bold text-xs">
            <span>類似度ランキングを開く</span>
            <div className="w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>

        {/* カード 3: スキルレーダーチャート */}
        <Link
          href="/analytics/radar_chart"
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 p-6 shadow-xs hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800/80 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all duration-200 shadow-2xs">
              <Radar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                Step 3: 詳細対比
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors mt-0.5">
                スキルレーダーチャート
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                専門知識12群・汎用スキル12群の全24スキル構成比を2つの学科で直接重ね合わせ、注力している学問分野や育成スキルのバランス差を詳細に対比します。
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-teal-600 dark:text-teal-400 font-bold text-xs">
            <span>レーダーチャートを開く</span>
            <div className="w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>

      </div>

      {/* 分析理論・評価仕様の解説カード */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>L1正規化による客観的評価と24スキル体系の意義</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-100">① 科目数バイアスの完全排除 (L1正規化):</span>
            <p className="leading-relaxed">
              開講科目数が多い大規模大学と、少数精鋭の単科大学・小規模学科をそのまま比較すると科目数による偏りが生じます。本システムでは全スキル値の総和が100%となるようL1正規化を適用し、カリキュラムの「重み付け配分比率」として公平に比較します。
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-100">② 専門知識(A群)と汎用スキル(B群)の網羅:</span>
            <p className="leading-relaxed">
              工学、ICT、自然科学、人文学などの学問領域（A群12項目）だけでなく、批判的思考、問題解決、チームワーク、倫理観といった社会で普遍的に求められる汎用ソフトスキル（B群12項目）を分離・統合して評価できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
