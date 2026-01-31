import type { SprintWorkType } from '../../types/models';

interface WorkTypePickerProps {
  value: SprintWorkType;
  onChange: (type: SprintWorkType) => void;
  disabled?: boolean;
}

export function WorkTypePicker({ value, onChange, disabled = false }: WorkTypePickerProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange('sprint')}
        disabled={disabled}
        className={`
          flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-colors duration-150 min-h-[44px]
          ${value === 'sprint'
            ? 'bg-emerald-600 text-white'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        Sprint
      </button>
      <button
        type="button"
        onClick={() => onChange('tempo')}
        disabled={disabled}
        className={`
          flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-colors duration-150 min-h-[44px]
          ${value === 'tempo'
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        Tempo
      </button>
    </div>
  );
}
