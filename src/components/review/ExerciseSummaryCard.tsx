import { useNavigate } from 'react-router-dom';
import type { ExerciseSummary } from '../../hooks/useLiftAnalytics';

interface ExerciseSummaryCardProps {
  summary: ExerciseSummary;
}

export function ExerciseSummaryCard({ summary }: ExerciseSummaryCardProps) {
  const navigate = useNavigate();

  // URL-encode the exercise name for the route
  const encodedExercise = encodeURIComponent(summary.exercise);

  return (
    <button
      onClick={() => navigate(`/review/lift/${encodedExercise}`)}
      className="w-full bg-slate-800 rounded-lg p-4 text-left hover:bg-slate-750 transition-colors active:bg-slate-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-lg font-semibold text-slate-100">
            {summary.exercise}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-blue-400">
              Max: {summary.maxLoad}kg
            </span>
            <span className="text-sm text-slate-400">
              {summary.setCount} sets
            </span>
          </div>
          {summary.avgPeakVelocity !== null && (
            <div className="text-xs text-slate-500 mt-1">
              Avg velocity: {summary.avgPeakVelocity.toFixed(2)} m/s
            </div>
          )}
          <div className="text-xs text-slate-500 mt-1">
            Last: {summary.lastSessionDate}
          </div>
        </div>
      </div>
    </button>
  );
}
