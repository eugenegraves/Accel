import { useNavigate } from 'react-router-dom';
import { useSprintDistanceSummaries } from '../hooks';
import { DistanceSummaryCard } from '../components/review';
import { Button } from '../components/ui/Button';

export function SprintReviewPage() {
  const navigate = useNavigate();
  const { summaries, loading } = useSprintDistanceSummaries();

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-800 border-b border-zinc-700 px-4 py-3 pt-safe-top">
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
          <h1 className="text-xl font-semibold text-zinc-100">Sprint Review</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 pb-safe-bottom">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-zinc-400">Loading...</div>
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-zinc-400 mb-4">No sprint data yet</div>
            <p className="text-zinc-500 text-sm mb-6">
              Log some sprint reps to see your distance trends and best times.
            </p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400 mb-4">
              {summaries.length} distance{summaries.length !== 1 ? 's' : ''} with logged reps
            </p>
            {summaries.map(summary => (
              <DistanceSummaryCard key={summary.distance} summary={summary} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
