import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRaceDistanceSummaries, useMeetDistanceTrend } from '../hooks';
import { TrendSparkline } from '../components/review';
import { Button } from '../components/ui/Button';
import { formatTime } from '../utils/time';

interface RaceDistanceCardProps {
  distance: number;
  pr: number;
  prDate: string;
  prMeetName: string;
  seasonBest: number;
  raceCount: number;
  deltaFromPr: number;
}

function RaceDistanceCard({
  distance,
  pr,
  prDate,
  prMeetName,
  seasonBest,
  raceCount,
  deltaFromPr,
}: RaceDistanceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { trend } = useMeetDistanceTrend(distance);

  const deltaColor = deltaFromPr <= 0 ? 'text-green-400' : 'text-red-400';
  const deltaPrefix = deltaFromPr > 0 ? '+' : '';

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full bg-zinc-900 rounded-lg p-4 text-left hover:bg-zinc-800 transition-colors duration-150 active:bg-zinc-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-zinc-100">
              {distance}m
            </span>
            {deltaFromPr !== 0 && (
              <span className={`text-sm ${deltaColor}`}>
                {deltaPrefix}{deltaFromPr.toFixed(2)}s
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-purple-400">
              PR: {formatTime(pr)}
            </span>
            <span className="text-sm text-zinc-400">
              {raceCount} race{raceCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {trend && trend.allRaces.length >= 2 && (
          <TrendSparkline
            data={trend.allRaces}
            width={80}
            height={32}
            color="#a855f7"
            showTrendArrow={false}
            invertTrend={true}
          />
        )}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-700 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">PR Meet</span>
            <span className="text-zinc-300">{prMeetName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">PR Date</span>
            <span className="text-zinc-300">{prDate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Season Best</span>
            <span className="text-purple-400">{formatTime(seasonBest)}</span>
          </div>
        </div>
      )}
    </button>
  );
}

export function MeetReviewPage() {
  const navigate = useNavigate();
  const { summaries, loading } = useRaceDistanceSummaries();

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 safe-area-inset-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1 text-zinc-400 hover:text-zinc-200"
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-zinc-100">Meet Review</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 safe-area-inset-bottom">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-zinc-400">Loading...</div>
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-zinc-400 mb-4">No race data yet</div>
            <p className="text-zinc-500 text-sm mb-6">
              Log races at meets to see your PRs and season bests.
            </p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400 mb-4">
              {summaries.length} distance{summaries.length !== 1 ? 's' : ''} with race results
            </p>
            {summaries.map(summary => (
              <RaceDistanceCard key={summary.distance} {...summary} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
