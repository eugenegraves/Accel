import { useState } from 'react';

interface IntensityPickerProps {
  value: number | null;
  onChange: (intensity: number | null) => void;
  required?: boolean;
  disabled?: boolean;
}

const PRESETS = [75, 80, 85, 90, 95, 100];

export function IntensityPicker({
  value,
  onChange,
  required = false,
  disabled = false,
}: IntensityPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handlePresetClick = (preset: number) => {
    if (value === preset && !required) {
      onChange(null); // Toggle off
    } else {
      onChange(preset);
    }
    setShowCustom(false);
  };

  const handleCustomSubmit = () => {
    const parsed = parseInt(customValue, 10);
    if (!isNaN(parsed) && parsed >= 50 && parsed <= 100) {
      onChange(parsed);
      setShowCustom(false);
      setCustomValue('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-zinc-400">
          Intensity {required && <span className="text-red-400">*</span>}
        </label>
        {value !== null && (
          <span className="text-sm font-medium text-emerald-400">@{value}%</span>
        )}
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePresetClick(preset)}
            disabled={disabled}
            className={`
              py-2.5 px-1 rounded-lg text-sm font-medium transition-colors duration-150 min-h-[44px]
              ${value === preset
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {preset}%
          </button>
        ))}
      </div>

      {/* Custom intensity option */}
      {!showCustom ? (
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          disabled={disabled}
          className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Custom intensity...
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="number"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="50-100"
            min={50}
            max={100}
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-200 text-sm"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500"
          >
            Set
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCustom(false);
              setCustomValue('');
            }}
            className="px-3 py-2 bg-zinc-700 text-zinc-300 rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Clear button if not required and has value */}
      {!required && value !== null && !showCustom && (
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          className="w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Clear intensity
        </button>
      )}
    </div>
  );
}
