import { useState } from 'react';
import type { SprintRep } from '../../types/models';
import { formatTime } from '../../utils/time';
import { RestTimerDisplay } from '../ui/RestTimer';

interface SprintRepCardProps {
  rep: SprintRep;
  isBest: boolean;
  onEdit?: (rep: SprintRep) => void;
  onDelete?: (repId: string) => void;
  showActions?: boolean;
}

export function SprintRepCard({ rep, isBest, onEdit, onDelete, showActions = true }: SprintRepCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`rep-card ${isBest ? 'best' : ''}`}
      onClick={() => showActions && setShowMenu(!showMenu)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-sm w-6">{rep.sequence}.</span>
          <span className="font-medium">
            {rep.isFly && <span className="text-emerald-400 text-sm mr-1">FLY{rep.flyInDistance}</span>}
            {rep.distance}m
          </span>
          <span className="text-xl font-mono font-semibold">{formatTime(rep.time)}s</span>
          {isBest && <span className="text-emerald-400">★</span>}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">{rep.timingType}</span>
          <RestTimerDisplay seconds={rep.restAfter} />
          {/* Edit button always visible */}
          {showActions && onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(rep);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
              aria-label="Edit rep"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {rep.notes && (
        <p className="mt-2 text-sm text-slate-400">{rep.notes}</p>
      )}

      {/* Action menu (on tap) */}
      {showMenu && showActions && (
        <div className="mt-3 pt-3 border-t border-slate-700 flex gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(rep);
                setShowMenu(false);
              }}
              className="flex-1 py-2 text-sm text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this rep?')) {
                  onDelete(rep.id);
                }
                setShowMenu(false);
              }}
              className="flex-1 py-2 text-sm text-red-400 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
