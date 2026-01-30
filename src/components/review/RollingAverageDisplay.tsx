import type { RollingAverage } from '../../types/insights';

interface RollingAverageDisplayProps {
  averages: RollingAverage[];
  unit?: string;
  invertTrend?: boolean; // For times where lower is better
}

export function RollingAverageDisplay({
  averages,
  unit = 's',
  invertTrend = false,
}: RollingAverageDisplayProps) {
  if (averages.length === 0) {
    return (
      <div className="text-sm text-slate-500">
        Not enough data for rolling averages
      </div>
    );
  }

  const getChangeColor = (change: number) => {
    if (Math.abs(change) < 0.5) return 'text-slate-400';
    const isImproving = invertTrend ? change < 0 : change > 0;
    return isImproving ? 'text-emerald-400' : 'text-red-400';
  };

  const formatChange = (avg: RollingAverage) => {
    const prefix = avg.change > 0 ? '+' : '';
    return `${prefix}${avg.change.toFixed(2)}${unit} (${prefix}${avg.changePercent.toFixed(1)}%)`;
  };

  return (
    <div className="space-y-2">
      {averages.map(avg => (
        <div
          key={avg.period}
          className="flex items-center justify-between text-sm"
        >
          <span className="text-slate-400">{avg.period}d avg</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-100 font-medium">
              {avg.value.toFixed(2)}{unit}
            </span>
            <span className={`text-xs ${getChangeColor(avg.change)}`}>
              {formatChange(avg)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
