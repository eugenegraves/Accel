import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInsights } from '../hooks';
import { InsightList, InsightFilter } from '../components/insights';
import type { InsightDomain } from '../types/insights';

export function InsightsPage() {
  const navigate = useNavigate();
  const [selectedDomain, setSelectedDomain] = useState<InsightDomain | 'all'>('all');
  const { insights, loading, error, reload } = useInsights();

  const filteredInsights = useMemo(() => {
    if (selectedDomain === 'all') return insights;
    return insights.filter(insight => insight.domain === selectedDomain);
  }, [insights, selectedDomain]);

  
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 pt-safe-top">
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
          <h1 className="text-xl font-semibold text-zinc-100">Insights</h1>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="bg-zinc-900/50 px-4 py-3 border-b border-zinc-800">
        <InsightFilter
          selectedDomain={selectedDomain}
          onDomainChange={setSelectedDomain}
        />
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 pb-safe-bottom">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-zinc-400">Analyzing your data...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={reload}
              className="text-red-400 hover:text-red-300"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {filteredInsights.length > 0 && (
              <p className="text-sm text-zinc-400 mb-4">
                {filteredInsights.length} insight{filteredInsights.length !== 1 ? 's' : ''} found
              </p>
            )}
            <InsightList
              insights={filteredInsights}
              emptyMessage={
                selectedDomain === 'all'
                  ? 'No insights yet. Keep logging sessions!'
                  : `No ${selectedDomain} insights yet.`
              }
            />
          </>
        )}
      </main>
    </div>
  );
}
