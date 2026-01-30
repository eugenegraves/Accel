import type { RaceRound } from '../../types/models';

interface RoundPickerProps {
  value: RaceRound;
  onChange: (round: RaceRound) => void;
  disabled?: boolean;
}

const rounds: { value: RaceRound; label: string }[] = [
  { value: 'heat', label: 'Heat' },
  { value: 'semi', label: 'Semi' },
  { value: 'final', label: 'Final' },
];

export function RoundPicker({ value, onChange, disabled = false }: RoundPickerProps) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Select round">
      {rounds.map((round) => (
        <button
          key={round.value}
          type="button"
          role="radio"
          aria-checked={value === round.value}
          disabled={disabled}
          onClick={() => onChange(round.value)}
          className={`
            flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors
            ${value === round.value
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {round.label}
        </button>
      ))}
    </div>
  );
}
