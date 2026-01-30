import type { Insight } from '../../types/insights';
import { InsightCard } from './InsightCard';

interface InsightListProps {
  insights: Insight[];
  emptyMessage?: string;
}

export function InsightList({
  insights,
  emptyMessage = 'No insights to show',
}: InsightListProps) {
  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">{'\u{1F50D}'}</div>
        <div className="text-slate-400">{emptyMessage}</div>
        <p className="text-slate-500 text-sm mt-2">
          Keep training to generate insights about your progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map(insight => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}
