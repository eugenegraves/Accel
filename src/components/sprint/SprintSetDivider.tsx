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
        <h3 className="text-sm font-medium text-zinc-400">
          {set.name || `Set ${set.sequence}`}
        </h3>
        <span className="text-xs text-zinc-600">
          {repCount} {repCount === 1 ? 'rep' : 'reps'}
        </span>
      </div>

      {isLastSet && onAddSet && (
        <button
          type="button"
          onClick={onAddSet}
          className="text-sm text-red-400 hover:text-red-300 transition-colors duration-150"
        >
          + SET
        </button>
      )}
    </div>
  );
}
