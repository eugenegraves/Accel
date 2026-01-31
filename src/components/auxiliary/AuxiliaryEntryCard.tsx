import { useState } from 'react';
import type { AuxiliaryEntry } from '../../types/models';
import { AUXILIARY_CATEGORY_NAMES, VOLUME_METRIC_UNITS } from '../../types/models';

interface AuxiliaryEntryCardProps {
  entry: AuxiliaryEntry;
  onEdit?: (entry: AuxiliaryEntry) => void;
  onDelete?: (entryId: string) => void;
  showActions?: boolean;
}

export function AuxiliaryEntryCard({
  entry,
  onEdit,
  onDelete,
  showActions = true,
}: AuxiliaryEntryCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50"
      onClick={() => showActions && setShowMenu(!showMenu)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-zinc-500 text-sm w-6 flex-shrink-0">{entry.sequence}.</span>
          <div className="min-w-0">
            <p className="font-medium text-zinc-100 truncate">{entry.name}</p>
            <p className="text-xs text-zinc-500">
              {AUXILIARY_CATEGORY_NAMES[entry.category]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg font-mono font-medium text-emerald-400">
            {entry.volumeValue}
            <span className="text-sm text-zinc-400 ml-1">
              {VOLUME_METRIC_UNITS[entry.volumeMetric]}
            </span>
          </span>
          {entry.intensity && (
            <span className="text-xs text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
              @{entry.intensity}%
            </span>
          )}
          {showActions && onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
              }}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors duration-150"
              aria-label="Edit entry"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {entry.notes && (
        <p className="mt-2 text-sm text-zinc-400">{entry.notes}</p>
      )}

      {/* Action menu (on tap) */}
      {showMenu && showActions && (
        <div className="mt-3 pt-3 border-t border-zinc-700 flex gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
                setShowMenu(false);
              }}
              className="flex-1 py-2 text-sm text-zinc-300 bg-zinc-700 rounded-lg hover:bg-zinc-600"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this entry?')) {
                  onDelete(entry.id);
                }
                setShowMenu(false);
              }}
              className="flex-1 py-2 text-sm text-red-400 bg-zinc-700 rounded-lg hover:bg-zinc-600"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
