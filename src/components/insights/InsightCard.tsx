import { useState } from 'react';
import type { Insight } from '../../types/insights';

interface InsightCardProps {
  insight: Insight;
}

const categoryIcons: Record<string, string> = {
  stagnation: '\u23F8', // Pause symbol
  improvement: '\u2191', // Up arrow
  streak: '\u26A1',      // Lightning
  pattern: '\u2609',     // Circle
  milestone: '\u2605',   // Star
};

const categoryColors: Record<string, string> = {
  stagnation: 'text-amber-400',
  improvement: 'text-green-400',
  streak: 'text-purple-400',
  pattern: 'text-blue-400',
  milestone: 'text-yellow-400',
};

const domainColors: Record<string, string> = {
  sprint: 'bg-red-900/30 border-red-700',
  lift: 'bg-blue-900/30 border-blue-700',
  meet: 'bg-purple-900/30 border-purple-700',
};

const severityBadges: Record<string, { bg: string; text: string }> = {
  info: { bg: 'bg-zinc-600', text: 'text-zinc-200' },
  notable: { bg: 'bg-blue-600', text: 'text-blue-100' },
  significant: { bg: 'bg-green-600', text: 'text-green-100' },
};

export function InsightCard({ insight }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);

  const icon = categoryIcons[insight.category] || '\u25CF';
  const iconColor = categoryColors[insight.category] || 'text-zinc-400';
  const domainStyle = domainColors[insight.domain] || 'bg-zinc-900 border-zinc-700';
  const badge = severityBadges[insight.severity] || severityBadges.info;

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`w-full rounded-lg p-4 text-left border transition-colors duration-150 ${domainStyle} hover:opacity-90 active:opacity-80`}
    >
      <div className="flex items-start gap-3">
        <span className={`text-xl ${iconColor}`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-zinc-100">{insight.title}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
            >
              {insight.severity}
            </span>
          </div>

          {expanded && (
            <div className="mt-2 text-sm text-zinc-300">
              {insight.description}
              {insight.value !== undefined && insight.previousValue !== undefined && (
                <div className="mt-2 flex gap-4 text-xs text-zinc-400">
                  <span>Previous: {insight.previousValue.toFixed(2)}</span>
                  <span>Current: {insight.value.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <span className="text-zinc-500 text-sm">
          {expanded ? '\u25B2' : '\u25BC'}
        </span>
      </div>
    </button>
  );
}
