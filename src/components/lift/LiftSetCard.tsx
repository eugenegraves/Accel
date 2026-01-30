import type { LiftSet, LiftRep } from '../../types/models';
import { LiftRepCard } from './LiftRepCard';

interface LiftSetCardProps {
  set: LiftSet;
  reps: LiftRep[];
  onEditSet?: (set: LiftSet) => void;
  onEditRep?: (rep: LiftRep) => void;
  onDeleteRep?: (repId: string) => void;
  onDeleteSet?: (setId: string) => void;
  showActions?: boolean;
}

export function LiftSetCard({ set, reps, onEditSet, onEditRep, onDeleteRep, onDeleteSet, showActions = true }: LiftSetCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      {/* Set header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50">
        <div>
          <h3 className="font-medium text-slate-100">{set.exercise}</h3>
          <p className="text-sm text-slate-400">{set.load} kg</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Set {set.sequence}</span>
          {showActions && onEditSet && (
            <button
              type="button"
              onClick={() => onEditSet(set)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-600 rounded transition-colors"
              aria-label="Edit set"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {showActions && onDeleteSet && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete this set and all its reps?`)) {
                  onDeleteSet(set.id);
                }
              }}
              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
              aria-label="Delete set"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Reps */}
      <div className="px-4 py-2">
        {reps.length > 0 ? (
          <div className="space-y-2">
            {reps.map((rep) => (
              <LiftRepCard
                key={rep.id}
                rep={rep}
                onEdit={onEditRep}
                onDelete={onDeleteRep}
                showActions={showActions}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-600 py-2 text-sm">
            No reps yet
          </p>
        )}
      </div>
    </div>
  );
}
