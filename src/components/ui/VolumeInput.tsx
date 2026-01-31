import type { VolumeMetric } from '../../types/models';
import { VOLUME_METRIC_UNITS } from '../../types/models';

interface VolumeInputProps {
  value: string;
  onChange: (value: string) => void;
  metric: VolumeMetric;
  onMetricChange?: (metric: VolumeMetric) => void;
  disabled?: boolean;
}

const METRICS: VolumeMetric[] = ['contacts', 'distance', 'reps', 'time', 'sets'];

export function VolumeInput({
  value,
  onChange,
  metric,
  onMetricChange,
  disabled = false,
}: VolumeInputProps) {
  // NumPad-style buttons
  const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '<'];

  const handleButton = (btn: string) => {
    if (btn === 'C') {
      onChange('');
    } else if (btn === '<') {
      onChange(value.slice(0, -1));
    } else {
      onChange(value + btn);
    }
  };

  return (
    <div className="space-y-3">
      {/* Metric selector (if changeable) */}
      {onMetricChange && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {METRICS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onMetricChange(m)}
              disabled={disabled}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-150
                ${metric === m
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {VOLUME_METRIC_UNITS[m]}
            </button>
          ))}
        </div>
      )}

      {/* Display */}
      <div className="bg-zinc-800 rounded-lg p-4 text-center">
        <span className="text-3xl font-mono font-semibold text-zinc-100">
          {value || '0'}
        </span>
        <span className="text-lg text-zinc-400 ml-2">
          {VOLUME_METRIC_UNITS[metric]}
        </span>
      </div>

      {/* NumPad */}
      <div className="grid grid-cols-3 gap-2">
        {buttons.map((btn) => (
          <button
            key={btn}
            type="button"
            onClick={() => handleButton(btn)}
            disabled={disabled}
            className={`
              py-4 rounded-lg text-lg font-medium transition-colors duration-150 min-h-[52px]
              ${btn === 'C'
                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                : btn === '<'
                  ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}

// Simple inline volume display (for session summaries)
export function VolumeDisplay({
  sprintVolume,
  tempoVolume,
  showBreakdown = true,
}: {
  sprintVolume: number;
  tempoVolume: number;
  showBreakdown?: boolean;
}) {
  const total = sprintVolume + tempoVolume;

  if (total === 0) return null;

  // Format as km if >= 1000m
  const formatDistance = (m: number) => {
    if (m >= 1000) {
      return `${(m / 1000).toFixed(1)}km`;
    }
    return `${m}m`;
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-zinc-400">Vol:</span>
      <span className="font-medium text-emerald-400">{formatDistance(total)}</span>
      {showBreakdown && (sprintVolume > 0 || tempoVolume > 0) && (
        <span className="text-zinc-500 text-xs">
          ({formatDistance(sprintVolume)} sprint
          {tempoVolume > 0 && ` / ${formatDistance(tempoVolume)} tempo`})
        </span>
      )}
    </div>
  );
}
