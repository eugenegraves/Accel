interface VolumeCardProps {
  sprintVolume: number;
  tempoVolume: number;
  label?: string;
  showBreakdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function VolumeCard({
  sprintVolume,
  tempoVolume,
  label = 'Volume',
  showBreakdown = true,
  size = 'md',
}: VolumeCardProps) {
  const total = sprintVolume + tempoVolume;

  // Format as km if >= 1000m
  const formatDistance = (m: number) => {
    if (m >= 1000) {
      return `${(m / 1000).toFixed(1)}km`;
    }
    return `${m}m`;
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  const valueClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`bg-zinc-800/50 rounded-lg ${sizeClasses[size]}`}>
      <p className="text-sm text-zinc-400 mb-1">{label}</p>
      <p className={`font-mono font-bold text-emerald-400 ${valueClasses[size]}`}>
        {formatDistance(total)}
      </p>
      {showBreakdown && total > 0 && (
        <div className="flex gap-3 mt-2 text-xs">
          {sprintVolume > 0 && (
            <span className="text-zinc-400">
              <span className="text-emerald-400">{formatDistance(sprintVolume)}</span> sprint
            </span>
          )}
          {tempoVolume > 0 && (
            <span className="text-zinc-400">
              <span className="text-blue-400">{formatDistance(tempoVolume)}</span> tempo
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Compact inline version
export function VolumeStatInline({
  sprintVolume,
  tempoVolume,
}: {
  sprintVolume: number;
  tempoVolume: number;
}) {
  const total = sprintVolume + tempoVolume;

  if (total === 0) return null;

  const formatDistance = (m: number) => {
    if (m >= 1000) {
      return `${(m / 1000).toFixed(1)}km`;
    }
    return `${m}m`;
  };

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-zinc-500">Vol:</span>
      <span className="font-medium text-emerald-400">{formatDistance(total)}</span>
    </div>
  );
}
