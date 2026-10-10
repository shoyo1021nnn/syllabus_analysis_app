import Link from 'next/link';

export default function AnalyticsIndexPage() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm border border-border">
      <h2 className="text-2xl font-bold mb-4">分析メニュー</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        表示したい分析グラフを選択してください。後ほど左側にナビゲーションメニューを追加する予定です。
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
