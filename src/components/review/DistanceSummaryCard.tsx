import { useNavigate } from 'react-router-dom';
import { TrendSparkline } from './TrendSparkline';
import { formatTime } from '../../utils/time';
import type { DistanceSummary } from '../../hooks/useSprintAnalytics';
import type { TrendDataPoint } from '../../types/insights';

interface DistanceSummaryCardProps {
  summary: DistanceSummary;
  sparklineData?: TrendDataPoint[];
}

export function DistanceSummaryCard({ summary, sparklineData }: DistanceSummaryCardProps) {
  const navigate = useNavigate();

  const trendIcon = {
    improving: '\u2191',
    declining: '\u2193',
    stable: '\u2192',
  };

  const trendColor = {
    improving: 'text-green-400',
    declining: 'text-red-400',
    stable: 'text-zinc-400',
  };

  return (
    <button
      onClick={() => navigate(`/distance/${summary.distance}`)}
      className="w-full bg-zinc-900 rounded-lg p-4 text-left hover:bg-zinc-800 transition-colors duration-150 active:bg-zinc-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-zinc-100">
              {summary.distance}m
            </span>
            <span className={`text-sm ${trendColor[summary.trendDirection]}`}>
              {trendIcon[summary.trendDirection]}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-green-400">
              PR: {formatTime(summary.bestTime)}
            </span>
            <span className="text-sm text-zinc-400">
              {summary.repCount} reps
            </span>
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Last: {summary.lastSessionDate}
          </div>
        </div>

        {sparklineData && sparklineData.length >= 2 && (
          <TrendSparkline
            data={sparklineData}
            width={80}
            height={32}
            color="#22c55e"
            showTrendArrow={false}
            invertTrend={true}
          />
        )}
      </div>
    </button>
  );
}
