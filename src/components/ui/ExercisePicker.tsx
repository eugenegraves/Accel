import { useState, useMemo } from 'react';
import { COMMON_EXERCISES } from '../../types/models';

interface ExercisePickerProps {
  value: string;
  onChange: (exercise: string) => void;
  favorites?: string[];
  recentExercises?: string[];
  disabled?: boolean;
}

export function ExercisePicker({
  value,
  onChange,
  favorites = [],
  recentExercises = [],
  disabled = false,
}: ExercisePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Build ordered list: favorites, recent, then common
  const orderedExercises = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];

    // Add favorites first
    for (const ex of favorites) {
      if (!seen.has(ex)) {
        seen.add(ex);
        result.push(ex);
      }
    }

    // Add recent exercises
    for (const ex of recentExercises) {
      if (!seen.has(ex)) {
        seen.add(ex);
        result.push(ex);
      }
    }

    // Add common exercises
    for (const ex of COMMON_EXERCISES) {
      if (!seen.has(ex)) {
        seen.add(ex);
        result.push(ex);
      }
    }

    return result;
  }, [favorites, recentExercises]);

  // Filter by search query
  const filteredExercises = useMemo(() => {
    if (!searchQuery) return orderedExercises;
    const query = searchQuery.toLowerCase();
    return orderedExercises.filter((ex) => ex.toLowerCase().includes(query));
  }, [orderedExercises, searchQuery]);

  const handleSelect = (exercise: string) => {
    onChange(exercise);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCustomSubmit = () => {
    if (searchQuery.trim()) {
      handleSelect(searchQuery.trim());
    }
  };

  return (
    <div className="relative">
      {/* Selected value button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left bg-slate-800 border border-slate-700 rounded-lg
          flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-600'}
        `}
      >
        <span className={value ? 'text-slate-100' : 'text-slate-500'}>
          {value || 'Select exercise...'}
        </span>
        <svg
          className="w-5 h-5 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />

          {/* Dropdown content */}
          <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-80 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-slate-700">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or type custom..."
                autoFocus
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Exercise list */}
            <div className="overflow-y-auto max-h-56">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise}
                  type="button"
                  onClick={() => handleSelect(exercise)}
                  className={`
                    w-full px-4 py-2.5 text-left hover:bg-slate-700 transition-colors
                    ${exercise === value ? 'bg-emerald-900/30 text-emerald-400' : 'text-slate-200'}
                    ${favorites.includes(exercise) ? 'font-medium' : ''}
                  `}
                >
                  {exercise}
                  {favorites.includes(exercise) && (
                    <span className="ml-2 text-xs text-slate-500">Favorite</span>
                  )}
                </button>
              ))}

              {/* Custom entry option */}
              {searchQuery && !filteredExercises.some((ex) => ex.toLowerCase() === searchQuery.toLowerCase()) && (
                <button
                  type="button"
                  onClick={handleCustomSubmit}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-700 text-emerald-400"
                >
                  Add "{searchQuery}"
                </button>
              )}

              {filteredExercises.length === 0 && !searchQuery && (
                <div className="px-4 py-3 text-slate-500 text-center">
                  No exercises found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
