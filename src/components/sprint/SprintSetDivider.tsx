import type { SprintSet } from '../../types/models';

interface SprintSetDividerProps {
  set: SprintSet;
  repCount: number;
  onAddSet?: () => void;
  isLastSet?: boolean;
}

export function SprintSetDivider({ set, repCount, onAddSet, isLastSet = false }: SprintSetDividerProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-slate-400">
          {set.name || `Set ${set.sequence}`}
        </h3>
        <span className="text-xs text-slate-600">
          {repCount} {repCount === 1 ? 'rep' : 'reps'}
        </span>
      </div>

      {isLastSet && onAddSet && (
        <button
          type="button"
          onClick={onAddSet}
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          + SET
        </button>
      )}
    </div>
  );
}
