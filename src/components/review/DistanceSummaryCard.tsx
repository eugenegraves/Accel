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
    improving: 'text-emerald-400',
    declining: 'text-red-400',
    stable: 'text-slate-400',
  };

  return (
    <button
      onClick={() => navigate(`/distance/${summary.distance}`)}
      className="w-full bg-slate-800 rounded-lg p-4 text-left hover:bg-slate-750 transition-colors active:bg-slate-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-100">
              {summary.distance}m
            </span>
            <span className={`text-sm ${trendColor[summary.trendDirection]}`}>
              {trendIcon[summary.trendDirection]}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-emerald-400">
              PR: {formatTime(summary.bestTime)}
            </span>
            <span className="text-sm text-slate-400">
              {summary.repCount} reps
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Last: {summary.lastSessionDate}
          </div>
        </div>

        {sparklineData && sparklineData.length >= 2 && (
          <TrendSparkline
            data={sparklineData}
            width={80}
            height={32}
            color="#10b981"
            showTrendArrow={false}
            invertTrend={true}
          />
        )}
      </div>
    </button>
  );
}
