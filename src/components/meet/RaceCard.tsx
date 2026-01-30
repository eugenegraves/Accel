import { useState } from 'react';
import type { Race } from '../../types/models';
import { formatTime } from '../../utils/time';
import { formatWind } from '../../utils/validation';

interface RaceCardProps {
  race: Race;
  isBest: boolean;
  showWind: boolean;
  onDelete?: (raceId: string) => void;
  showActions?: boolean;
}

export function RaceCard({ race, isBest, showWind, onDelete, showActions = true }: RaceCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const roundLabel = {
    heat: 'Heat',
    semi: 'Semi',
    final: 'Final',
  }[race.round];

  const placeOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div
      className={`rep-card ${isBest ? 'best' : ''}`}
      onClick={() => showActions && setShowMenu(!showMenu)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium">{race.distance}m</span>
          <span className="text-sm text-zinc-400">{roundLabel}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xl font-mono font-semibold">{formatTime(race.time)}s</span>
          {isBest && <span className="text-green-400">★</span>}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 text-sm text-zinc-500">
        <div className="flex items-center gap-3">
          {showWind && (
            <span>Wind: {formatWind(race.wind)}</span>
          )}
        </div>
        {race.place && (
          <span className="font-medium text-zinc-300">{placeOrdinal(race.place)}</span>
        )}
      </div>

      {race.notes && (
        <p className="mt-2 text-sm text-zinc-400">{race.notes}</p>
      )}

      {/* Action menu */}
      {showMenu && showActions && onDelete && (
        <div className="mt-3 pt-3 border-t border-zinc-700 flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this race?')) {
                onDelete(race.id);
              }
              setShowMenu(false);
            }}
            className="flex-1 py-2 text-sm text-red-400 bg-zinc-700 rounded-lg hover:bg-zinc-600"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
