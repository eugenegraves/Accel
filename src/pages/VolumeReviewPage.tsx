import { useNavigate } from 'react-router-dom';
import { useWeeklyVolume, useDailyVolume } from '../hooks/useVolume';
import { VolumeCard } from '../components/review/VolumeCard';
import { VolumeTrendChart } from '../components/review/VolumeTrendChart';

export function VolumeReviewPage() {
  const navigate = useNavigate();
  const { summaries, stats, loading: weeklyLoading } = useWeeklyVolume(8);
  const { dataPoints, totals, loading: dailyLoading } = useDailyVolume(30);

  const loading = weeklyLoading || dailyLoading;

  // Format volume
  const formatVolume = (m: number) => {
    if (m >= 1000) {
      return `${(m / 1000).toFixed(1)}km`;
    }
    return `${m}m`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 safe-area-inset-top">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-zinc-400 hover:text-zinc-200"
          aria-label="Back"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-semibold text-zinc-100">Volume Tracking</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-zinc-400">Loading...</p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-6 safe-area-inset-bottom">
            {/* Weekly volume chart */}
            <section>
              <h2 className="text-sm font-medium text-zinc-400 mb-3">Weekly Volume (8 weeks)</h2>
              <div className="bg-zinc-800/30 rounded-lg p-4">
                <VolumeTrendChart data={summaries} height={140} />
              </div>
            </section>

            {/* Stats cards */}
            <section className="grid grid-cols-2 gap-3">
              <VolumeCard
                sprintVolume={stats.totalSprintVolume}
                tempoVolume={stats.totalTempoVolume}
                label="8-Week Total"
                size="md"
              />
              <VolumeCard
                sprintVolume={Math.round(stats.avgWeeklyVolume * (stats.totalSprintVolume / (stats.totalSprintVolume + stats.totalTempoVolume || 1)))}
                tempoVolume={Math.round(stats.avgWeeklyVolume * (stats.totalTempoVolume / (stats.totalSprintVolume + stats.totalTempoVolume || 1)))}
                label="Avg Weekly"
                size="md"
              />
            </section>

            {/* Week-over-week change */}
            {summaries.length >= 2 && (
              <section className="bg-zinc-800/30 rounded-lg p-4">
                <h3 className="text-sm text-zinc-400 mb-2">Week-over-Week Change</h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xl font-mono font-bold ${
                      stats.weekOverWeekChange > 0
                        ? 'text-emerald-400'
                        : stats.weekOverWeekChange < 0
                          ? 'text-red-400'
                          : 'text-zinc-400'
                    }`}
                  >
                    {stats.weekOverWeekChange > 0 ? '+' : ''}
                    {stats.weekOverWeekChange.toFixed(1)}%
                  </span>
                  <span className="text-zinc-500 text-sm">
                    ({formatVolume(summaries[summaries.length - 2]?.totalVolume || 0)} →{' '}
                    {formatVolume(summaries[summaries.length - 1]?.totalVolume || 0)})
                  </span>
                </div>
              </section>
            )}

            {/* Daily breakdown for last 30 days */}
            <section>
              <h2 className="text-sm font-medium text-zinc-400 mb-3">Last 30 Days</h2>
              {dataPoints.length === 0 ? (
                <p className="text-zinc-500 text-sm">No training sessions in the last 30 days</p>
              ) : (
                <div className="space-y-2">
                  {dataPoints.slice().reverse().map((dp) => (
                    <div
                      key={dp.date}
                      className="flex items-center justify-between py-2 border-b border-zinc-800/50"
                    >
                      <span className="text-zinc-300">
                        {new Date(dp.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <div className="flex items-center gap-3">
                        {dp.sprintVolume > 0 && (
                          <span className="text-emerald-400 font-mono text-sm">
                            {formatVolume(dp.sprintVolume)} sprint
                          </span>
                        )}
                        {dp.tempoVolume > 0 && (
                          <span className="text-blue-400 font-mono text-sm">
                            {formatVolume(dp.tempoVolume)} tempo
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Totals for period */}
            <section className="bg-zinc-800/30 rounded-lg p-4">
              <h3 className="text-sm text-zinc-400 mb-2">30-Day Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-mono font-bold text-emerald-400">
                    {formatVolume(totals.totalVolume)}
                  </p>
                  <p className="text-xs text-zinc-500">Total</p>
                </div>
                <div>
                  <p className="text-xl font-mono font-bold text-emerald-400">
                    {formatVolume(totals.sprintVolume)}
                  </p>
                  <p className="text-xs text-zinc-500">Sprint</p>
                </div>
                <div>
                  <p className="text-xl font-mono font-bold text-blue-400">
                    {formatVolume(totals.tempoVolume)}
                  </p>
                  <p className="text-xs text-zinc-500">Tempo</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
