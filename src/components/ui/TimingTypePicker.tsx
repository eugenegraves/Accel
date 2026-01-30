import type { TimingType } from '../../types/models';

interface TimingTypePickerProps {
  value: TimingType;
  onChange: (type: TimingType) => void;
  disabled?: boolean;
  locked?: boolean;
}

export function TimingTypePicker({ value, onChange, disabled = false, locked = false }: TimingTypePickerProps) {
  const isDisabled = disabled || locked;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2" role="radiogroup" aria-label="Select timing type">
        <button
          type="button"
          role="radio"
          aria-checked={value === 'HAND'}
          disabled={isDisabled}
          onClick={() => onChange('HAND')}
          className={`
            flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors
            ${value === 'HAND'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          HAND
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === 'FAT'}
          disabled={isDisabled}
          onClick={() => onChange('FAT')}
          className={`
            flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors
            ${value === 'FAT'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          FAT
        </button>
      </div>
      {locked && (
        <p className="text-xs text-slate-500 text-center">
          Timing type locked after first rep
        </p>
      )}
    </div>
  );
}
