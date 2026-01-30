import type { TrendDataPoint } from '../../types/insights';

interface TrendSparklineProps {
  data: TrendDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showTrendArrow?: boolean;
  invertTrend?: boolean; // For times where lower is better
}

export function TrendSparkline({
  data,
  width = 80,
  height = 24,
  color = '#10b981', // emerald-500
  showTrendArrow = true,
  invertTrend = false,
}: TrendSparklineProps) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-slate-500 text-xs"
        style={{ width, height }}
      >
        --
      </div>
    );
  }

  // Calculate min/max for scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Create points for polyline
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    // Invert Y since SVG coordinates go top-down
    const y = padding + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Calculate trend direction
  const firstHalf = data.slice(0, Math.ceil(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
  if (changePercent > 2) trendDirection = 'up';
  else if (changePercent < -2) trendDirection = 'down';

  // For times, down is improving. For velocity/load, up is improving.
  const isImproving = invertTrend
    ? trendDirection === 'down'
    : trendDirection === 'up';

  const trendColor = isImproving ? '#10b981' : trendDirection === 'stable' ? '#64748b' : '#ef4444';

  return (
    <div className="flex items-center gap-1">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Highlight the last point */}
        {data.length > 0 && (
          <circle
            cx={padding + chartWidth}
            cy={padding + chartHeight - ((data[data.length - 1].value - minValue) / range) * chartHeight}
            r="2"
            fill={color}
          />
        )}
      </svg>
      {showTrendArrow && (
        <span className="text-xs" style={{ color: trendColor }}>
          {trendDirection === 'up' && (invertTrend ? '\u2193' : '\u2191')}
          {trendDirection === 'down' && (invertTrend ? '\u2191' : '\u2193')}
          {trendDirection === 'stable' && '\u2192'}
        </span>
      )}
    </div>
  );
}
