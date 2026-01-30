import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, getRepsByDistance } from '../db/database';
import { useSprintDistanceTrend } from '../hooks';
import { TrendSparkline, RollingAverageDisplay } from '../components/review';
import type { SprintRep, SprintSession } from '../types/models';
import { formatTime, formatDateShort } from '../utils/time';

interface RepWithSession {
  rep: SprintRep;
  session: SprintSession | null;
}

export function DistancePage() {
  const { meters } = useParams<{ meters: string }>();
  const navigate = useNavigate();
  const distance = parseInt(meters || '0', 10);

  const [reps, setReps] = useState<RepWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [bestRep, setBestRep] = useState<RepWithSession | null>(null);
  const { trend } = useSprintDistanceTrend(distance);

  useEffect(() => {
    async function loadData() {
      if (!distance) return;

      setLoading(true);
      const distanceReps = await getRepsByDistance(distance);

      // Sort by time (fastest first)
      distanceReps.sort((a, b) => a.time - b.time);

      // Load session info for each rep
      const repsWithSessions: RepWithSession[] = [];
      const sessionCache = new Map<string, SprintSession | null>();

      for (const rep of distanceReps) {
        // Get session via set
        const set = await db.sprintSets.get(rep.setId);
        if (!set) {
          repsWithSessions.push({ rep, session: null });
          continue;
        }

        if (!sessionCache.has(set.sessionId)) {
          const session = await db.sprintSessions.get(set.sessionId);
          sessionCache.set(set.sessionId, session || null);
        }

        repsWithSessions.push({
          rep,
          session: sessionCache.get(set.sessionId) || null,
        });
      }

      setReps(repsWithSessions);
      setBestRep(repsWithSessions[0] || null);
      setLoading(false);
    }

    loadData();
  }, [distance]);

  if (!distance) {
    navigate('/');
    return null;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-4 py-3 border-b border-zinc-800 safe-area-inset-top">
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
        <h1 className="flex-1 text-center text-xl font-bold text-zinc-100">
          {distance}m
        </h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 safe-area-inset-bottom">
        {loading ? (
          <div className="text-center text-zinc-400 py-8">Loading...</div>
        ) : (
          <>
            {/* Best rep */}
            {bestRep && (
              <div className="mb-6 p-4 bg-green-900/20 border border-green-600 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-green-400 mb-1">BEST</p>
                    <p className="text-4xl font-mono font-bold text-zinc-100">
                      {formatTime(bestRep.rep.time)}s
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">
                      {bestRep.rep.timingType}
                      {bestRep.session && ` · ${formatDateShort(bestRep.session.date)}`}
                      {bestRep.session?.title && ` · ${bestRep.session.title}`}
                    </p>
                  </div>
                  {trend && trend.recentTimes.length >= 2 && (
                    <TrendSparkline
                      data={trend.recentTimes}
                      width={100}
                      height={40}
                      color="#22c55e"
                      invertTrend={true}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Rolling Averages */}
            {trend && trend.rollingAverages.length > 0 && (
              <div className="mb-6 p-4 bg-zinc-900 rounded-xl">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">ROLLING AVERAGES</h3>
                <RollingAverageDisplay
                  averages={trend.rollingAverages}
                  unit="s"
                  invertTrend={true}
                />
              </div>
            )}

            {/* Recent reps */}
            <h2 className="text-sm font-medium text-zinc-400 mb-3">ALL REPS</h2>
            {reps.length > 0 ? (
              <div className="space-y-2">
                {reps.map(({ rep, session }, idx) => (
                  <div
                    key={rep.id}
                    className={`
                      p-3 rounded-lg border
                      ${idx === 0 ? 'bg-green-900/20 border-green-600' : 'bg-zinc-900 border-zinc-800'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-mono font-semibold text-zinc-100">
                          {formatTime(rep.time)}s
                        </span>
                        {idx === 0 && <span className="text-green-400">★</span>}
                      </div>
                      <span className="text-sm text-zinc-500">{rep.timingType}</span>
                    </div>
                    <div className="text-sm text-zinc-500 mt-1">
                      {session && (
                        <>
                          {formatDateShort(session.date)}
                          {session.title && ` · ${session.title}`}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-600 py-8">No reps at this distance</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
