import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveMeet } from '../../context/ActiveMeetContext';
import { NumPad } from '../ui/NumPad';
import { DistancePicker } from '../ui/DistancePicker';
import { RoundPicker } from '../ui/RoundPicker';
import { TimeDisplay } from '../ui/TimeDisplay';
import { ModeIndicator } from '../ui/ModeIndicator';
import { Button } from '../ui/Button';
import { RaceCard } from './RaceCard';
import { DEFAULT_PREFERENCES } from '../../types/models';
import { parseTimeInput } from '../../utils/time';

export function MeetLoggingScreen() {
  const navigate = useNavigate();
  const {
    meet,
    races,
    loading,
    entryState,
    setDistance,
    setTimeInput,
    setRound,
    setWindInput,
    setPlaceInput,
    addRace,
    deleteRace,
    completeMeet,
    reopenMeet,
    getBestRaceAtDistance,
  } = useActiveMeet();

  const [submitting, setSubmitting] = useState(false);

  const isLive = meet?.status === 'active';
  const isOutdoor = meet?.venue === 'outdoor';

  const handleAddRace = useCallback(async () => {
    const time = parseTimeInput(entryState.timeInput);
    if (!time || time <= 0) return;

    setSubmitting(true);
    try {
      await addRace();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add race');
    } finally {
      setSubmitting(false);
    }
  }, [entryState.timeInput, addRace]);

  const handleComplete = useCallback(async () => {
    if (confirm('Complete this meet? You can reopen it later if needed.')) {
      await completeMeet();
    }
  }, [completeMeet]);

  const handleReopen = useCallback(async () => {
    await reopenMeet();
  }, [reopenMeet]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!meet) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400">Meet not found</div>
      </div>
    );
  }

  const canSubmit = parseTimeInput(entryState.timeInput) !== null && parseTimeInput(entryState.timeInput)! > 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="px-4 py-3 border-b border-slate-800 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-200"
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 text-center">
            <h1 className="font-semibold text-slate-100 truncate">
              {meet.name}
            </h1>
            <p className="text-xs text-slate-500">
              {meet.venue === 'indoor' ? 'Indoor' : 'Outdoor'} · {meet.timingType}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ModeIndicator status={meet.status} compact />
            {isLive ? (
              <Button variant="ghost" size="sm" onClick={handleComplete}>
                Done
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleReopen}>
                Reopen
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Entry section (only in Live mode) */}
        {isLive && (
          <div className="px-4 py-4 space-y-4 border-b border-slate-800">
            {/* Distance picker */}
            <DistancePicker
              value={entryState.distance}
              onChange={setDistance}
              favorites={DEFAULT_PREFERENCES.favoriteDistances}
            />

            {/* Round picker */}
            <RoundPicker
              value={entryState.round}
              onChange={setRound}
            />

            {/* Time display */}
            <TimeDisplay value={entryState.timeInput} />

            {/* Wind and Place inputs */}
            <div className="flex gap-4">
              {isOutdoor && (
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">Wind (m/s)</label>
                  <input
                    type="text"
                    value={entryState.windInput}
                    onChange={(e) => setWindInput(e.target.value)}
                    placeholder="+1.2"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 text-center"
                  />
                </div>
              )}
              <div className="flex-1">
                <label className="block text-sm text-slate-400 mb-1">Place</label>
                <input
                  type="number"
                  value={entryState.placeInput}
                  onChange={(e) => setPlaceInput(e.target.value)}
                  placeholder="1"
                  min="1"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 text-center"
                />
              </div>
            </div>

            {/* Numpad and actions */}
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3">
                <NumPad
                  value={entryState.timeInput}
                  onChange={setTimeInput}
                  onSubmit={canSubmit ? handleAddRace : undefined}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleAddRace}
                  disabled={!canSubmit || submitting}
                  className="flex-1"
                  size="lg"
                >
                  ADD
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Races list */}
        <div className="px-4 py-4 space-y-3 safe-area-inset-bottom">
          <h2 className="text-sm font-medium text-slate-400">RACES</h2>

          {races.slice().reverse().map((race) => (
            <RaceCard
              key={race.id}
              race={race}
              isBest={getBestRaceAtDistance(race.distance)?.id === race.id}
              showWind={isOutdoor}
              onDelete={deleteRace}
              showActions={true}
            />
          ))}

          {races.length === 0 && (
            <p className="text-center text-slate-600 py-8">
              {isLive ? 'Add your first race' : 'No races recorded'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
