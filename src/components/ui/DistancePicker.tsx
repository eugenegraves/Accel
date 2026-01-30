import { useRef, useEffect } from 'react';
import { DISTANCES } from '../../types/models';

interface DistancePickerProps {
  value: number;
  onChange: (distance: number) => void;
  favorites?: number[];
  disabled?: boolean;
}

export function DistancePicker({
  value,
  onChange,
  favorites = [30, 40, 60, 100, 200],
  disabled = false,
}: DistancePickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll selected into view on mount
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'instant',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, []);

  // Sort: favorites first (in order), then remaining distances
  const orderedDistances = [
    ...favorites.filter((d) => DISTANCES.includes(d as (typeof DISTANCES)[number])),
    ...DISTANCES.filter((d) => !favorites.includes(d)),
  ];

  return (
    <div
      ref={scrollRef}
      className="distance-picker"
      role="listbox"
      aria-label="Select distance"
    >
      {orderedDistances.map((distance) => {
        const isSelected = distance === value;
        const isFavorite = favorites.includes(distance);

        return (
          <button
            key={distance}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={disabled}
            onClick={() => onChange(distance)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-colors duration-150 min-h-[44px] flex items-center
              ${isSelected
                ? 'bg-red-600 text-white'
                : isFavorite
                  ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {distance}m
          </button>
        );
      })}
    </div>
  );
}
