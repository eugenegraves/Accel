import type { WeeklyVolumeSummary } from '../../db/database';

interface VolumeTrendChartProps {
  data: WeeklyVolumeSummary[];
  height?: number;
  showLabels?: boolean;
}

export function VolumeTrendChart({
  data,
  height = 120,
  showLabels = true,
}: VolumeTrendChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-zinc-500 text-sm"
        style={{ height }}
      >
        No volume data yet
      </div>
    );
  }

  const maxVolume = Math.max(...data.map((d) => d.totalVolume), 1);
  const barWidth = 100 / data.length;
  const padding = 2; // Gap between bars

  // Format week label (show month/day of week start)
  const formatWeekLabel = (weekStart: string) => {
    const date = new Date(weekStart);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Format volume for tooltip
  const formatVolume = (m: number) => {
    if (m >= 1000) {
      return `${(m / 1000).toFixed(1)}km`;
    }
    return `${m}m`;
  };

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        {data.map((week, i) => {
          const barHeight = (week.totalVolume / maxVolume) * (height - 20);
          const x = i * barWidth + padding / 2;
          const y = height - 20 - barHeight;
          const width = barWidth - padding;

          // Calculate sprint vs tempo proportions
          const sprintHeight = week.sprintVolume > 0
            ? (week.sprintVolume / week.totalVolume) * barHeight
            : 0;
          const tempoHeight = barHeight - sprintHeight;

          return (
            <g key={week.weekStart}>
              {/* Tempo portion (bottom) */}
              {tempoHeight > 0 && (
                <rect
                  x={x}
                  y={y + sprintHeight}
                  width={width}
                  height={tempoHeight}
                  rx={2}
                  className="fill-blue-500/60"
                />
              )}
              {/* Sprint portion (top) */}
              {sprintHeight > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={sprintHeight}
                  rx={sprintHeight === barHeight ? 2 : 0}
                  className="fill-emerald-500"
                />
              )}
              {/* Hover area */}
              <title>
                {formatWeekLabel(week.weekStart)}: {formatVolume(week.totalVolume)}
                {week.sprintVolume > 0 && ` (${formatVolume(week.sprintVolume)} sprint)`}
                {week.tempoVolume > 0 && ` (${formatVolume(week.tempoVolume)} tempo)`}
              </title>
            </g>
          );
        })}
      </svg>

      {/* Week labels */}
      {showLabels && (
        <div className="flex mt-1">
          {data.map((week, i) => (
            <div
              key={week.weekStart}
              className="text-center text-[10px] text-zinc-500"
              style={{ width: `${barWidth}%` }}
            >
              {i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)
                ? formatWeekLabel(week.weekStart)
                : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Mini sparkline version for compact displays
export function VolumeSparkline({
  data,
  width = 80,
  height = 24,
}: {
  data: WeeklyVolumeSummary[];
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const maxVolume = Math.max(...data.map((d) => d.totalVolume), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.totalVolume / maxVolume) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-emerald-400"
      />
    </svg>
  );
}
