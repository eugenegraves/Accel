import { useState } from 'react';
import type { LiftRep } from '../../types/models';

interface LiftRepCardProps {
  rep: LiftRep;
  onEdit?: (rep: LiftRep) => void;
  onDelete?: (repId: string) => void;
  showActions?: boolean;
}

export function LiftRepCard({ rep, onEdit, onDelete, showActions = true }: LiftRepCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Color code velocity
  const getVelocityColor = (v: number | null): string => {
    if (v === null) return 'text-slate-500';  // Not measured
    if (v >= 1.0) return 'text-emerald-400';  // Fast/power
    if (v >= 0.5) return 'text-yellow-400';   // Moderate
    return 'text-red-400';                     // Slow/strength
  };

  const formatVelocity = (v: number | null): string => {
    if (v === null) return '-.--';
    return v.toFixed(2);
  };

  return (
    <div
      className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
      onClick={() => showActions && setShowMenu(!showMenu)}
    >
      <div className="flex items-center gap-3">
        <span className="text-slate-500 text-sm w-6">{rep.sequence}.</span>
        <span className={`font-mono font-semibold text-lg ${getVelocityColor(rep.peakVelocity)}`}>
          {formatVelocity(rep.peakVelocity)}
        </span>
        <span className="text-slate-500 text-sm">m/s</span>
      </div>

      <div className="flex items-center gap-2">
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

        {showMenu && showActions && onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this rep?')) {
                onDelete(rep.id);
              }
              setShowMenu(false);
            }}
            className="text-sm text-red-400 px-3 py-1 bg-slate-700 rounded-md hover:bg-slate-600"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
