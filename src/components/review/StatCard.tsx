interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;
  unit?: string;
  deltaLabel?: string;
  invertDelta?: boolean; // For times where negative delta is good
  size?: 'sm' | 'md' | 'lg';
}

export function StatCard({
  label,
  value,
  delta,
  unit,
  deltaLabel,
  invertDelta = false,
  size = 'md',
}: StatCardProps) {
  const sizeClasses = {
    sm: {
      container: 'p-2',
      label: 'text-xs',
      value: 'text-lg',
      delta: 'text-xs',
    },
    md: {
      container: 'p-3',
      label: 'text-xs',
      value: 'text-xl',
      delta: 'text-xs',
    },
    lg: {
      container: 'p-4',
      label: 'text-sm',
      value: 'text-2xl',
      delta: 'text-sm',
    },
  };

  const classes = sizeClasses[size];

  // Determine delta color
  let deltaColor = 'text-zinc-400';
  if (delta !== undefined && delta !== 0) {
    const isPositive = delta > 0;
    const isImprovement = invertDelta ? !isPositive : isPositive;
    deltaColor = isImprovement ? 'text-green-400' : 'text-red-400';
  }

  const formatDelta = (d: number) => {
    const prefix = d > 0 ? '+' : '';
    return `${prefix}${d.toFixed(2)}`;
  };

  return (
    <div className={`bg-zinc-900 rounded-lg ${classes.container}`}>
      <div className={`${classes.label} text-zinc-400 mb-1`}>{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`${classes.value} font-semibold text-zinc-100`}>
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
        {unit && (
          <span className={`${classes.label} text-zinc-400`}>{unit}</span>
        )}
      </div>
      {delta !== undefined && (
        <div className={`${classes.delta} ${deltaColor} mt-1`}>
          {formatDelta(delta)}
          {deltaLabel && ` ${deltaLabel}`}
        </div>
      )}
    </div>
  );
}
