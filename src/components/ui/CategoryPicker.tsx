import type { AuxiliaryCategory } from '../../types/models';
import { AUXILIARY_CATEGORY_NAMES } from '../../types/models';

interface CategoryPickerProps {
  value: AuxiliaryCategory | null;
  onChange: (category: AuxiliaryCategory) => void;
  disabled?: boolean;
}

const CATEGORY_ICONS: Record<AuxiliaryCategory, string> = {
  plyometrics: 'Jump',
  strength_circuit: 'Lift',
  sled_work: 'Sled',
  wicket_runs: 'Wkts',
  tempo_runs: 'Run',
  general: 'Gen',
};

const CATEGORIES: AuxiliaryCategory[] = [
  'plyometrics',
  'strength_circuit',
  'sled_work',
  'wicket_runs',
  'tempo_runs',
  'general',
];

export function CategoryPicker({ value, onChange, disabled = false }: CategoryPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-zinc-400">Category</label>
      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            disabled={disabled}
            className={`
              flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-colors duration-150 min-h-[60px]
              ${value === category
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span className="text-xs font-medium opacity-70 mb-1">
              {CATEGORY_ICONS[category]}
            </span>
            <span className="text-xs font-medium text-center leading-tight">
              {AUXILIARY_CATEGORY_NAMES[category]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
