import { useParams, useNavigate } from 'react-router-dom';
import { useLiftExerciseTrend } from '../hooks';
import { TrendSparkline, StatCard } from '../components/review';
import { Button } from '../components/ui/Button';

export function LiftExerciseReviewPage() {
  const { exercise: encodedExercise } = useParams<{ exercise: string }>();
  const exercise = decodeURIComponent(encodedExercise || '');
  const navigate = useNavigate();
  const { trend, loading, error } = useLiftExerciseTrend(exercise);

  if (!exercise) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-400">No exercise specified</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-800 border-b border-zinc-700 px-4 py-3 safe-area-inset-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/review/lifts')}
            className="p-1 text-zinc-400 hover:text-zinc-200"
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-zinc-100">{exercise}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 safe-area-inset-bottom">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-zinc-400">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-red-400 mb-4">{error}</div>
            <Button onClick={() => navigate('/review/lifts')}>Go Back</Button>
          </div>
        ) : !trend ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-zinc-400 mb-4">No data for {exercise}</div>
            <Button onClick={() => navigate('/review/lifts')}>Go Back</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Max Load"
                value={trend.maxLoad}
                unit="kg"
                size="lg"
              />
              <StatCard
                label="Total Sets"
                value={trend.totalSets}
                size="lg"
              />
            </div>

            {/* Max Load Info */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="text-sm text-zinc-400 mb-1">Max load achieved</div>
              <div className="text-lg text-zinc-100 font-semibold">
                {trend.maxLoad}kg
              </div>
              <div className="text-sm text-zinc-500">
                on {trend.maxLoadDate}
              </div>
            </div>

            {/* Peak Velocities Chart */}
            {trend.peakVelocities.length >= 2 && (
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="text-sm text-zinc-400 mb-3">Peak Velocity Trend</div>
                <div className="flex items-center gap-4">
                  <TrendSparkline
                    data={trend.peakVelocities}
                    width={200}
                    height={48}
                    color="#3b82f6"
                    invertTrend={false}
                  />
                </div>
              </div>
            )}

            {/* Velocity by Load */}
            {trend.velocityByLoad.length > 0 && (
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="text-sm text-zinc-400 mb-3">Velocity by Load</div>
                <div className="space-y-3">
                  {trend.velocityByLoad.slice(-5).map(({ load, dataPoints }) => {
                    const latestVelocity = dataPoints[dataPoints.length - 1]?.value;
                    return (
                      <div key={load} className="flex items-center justify-between">
                        <span className="text-zinc-300">{load}kg</span>
                        <div className="flex items-center gap-3">
                          {dataPoints.length >= 2 && (
                            <TrendSparkline
                              data={dataPoints}
                              width={60}
                              height={20}
                              color="#3b82f6"
                              showTrendArrow={false}
                            />
                          )}
                          {latestVelocity && (
                            <span className="text-blue-400 font-medium">
                              {latestVelocity.toFixed(2)} m/s
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
