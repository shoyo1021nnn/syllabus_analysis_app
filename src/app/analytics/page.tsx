"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useAnalyticsContext } from '@/context/AnalyticsContext';

export default function AnalyticsIndexPage() {
  const { setAnalyticsContext } = useAnalyticsContext();

  useEffect(() => {
    setAnalyticsContext({
      pageTitle: '分析メニュー',
      primaryTarget: undefined,
      compareTarget: undefined,
      summaryText: 'シラバス分析ダッシュボードのトップメニュー（3つの分析機能を提供）',
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
        'Syllabus Analysis Appでできる分析の種類と特徴を教えて',
        '自学科のカリキュラムを見直すにはどの分析から始めるべき？',
        'シラバスから抽出される24のスキル体系とは何ですか？',
      ],
    });
  }, [setAnalyticsContext]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm border border-border">
      <h2 className="text-2xl font-bold mb-4">分析メニュー</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        表示したい分析結果を選択してください。
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/analytics/clustering"
          className="p-4 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-center font-medium"
        >
          K-meansクラスタリング
        </Link>
        <Link
          href="/analytics/similarity"
          className="p-4 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-center font-medium"
        >
          類似度計算ランキング
        </Link>
        <Link
          href="/analytics/radar_chart"
          className="p-4 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-center font-medium"
        >
          スキルレーダーチャート
        </Link>
      </div>
    </div>
  );
}
