import type { SessionStatus } from '../../types/models';

interface ModeIndicatorProps {
  status: SessionStatus;
  compact?: boolean;
}

export function ModeIndicator({ status, compact = false }: ModeIndicatorProps) {
  const isLive = status === 'active';

  if (compact) {
    return (
      <span
        className={`
          inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
          ${isLive ? 'bg-green-900/50 text-green-400' : 'bg-zinc-700 text-zinc-400'}
        `}
      >
        {isLive && (
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-pulse" />
        )}
        {isLive ? 'LIVE' : 'DONE'}
      </span>
    );
  }

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
        ${isLive ? 'bg-green-900/50 text-green-400' : 'bg-zinc-700 text-zinc-400'}
      `}
    >
      {isLive && (
        <span className="w-2 h-2 rounded-full bg-green-400 live-pulse" />
      )}
      {isLive ? 'Live' : 'Completed'}
    </div>
  );
}
