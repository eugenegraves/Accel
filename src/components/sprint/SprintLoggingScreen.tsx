import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveSprint } from '../../context/ActiveSprintContext';
import { NumPad } from '../ui/NumPad';
import { DistancePicker } from '../ui/DistancePicker';
import { TimingTypePicker } from '../ui/TimingTypePicker';
import { WorkTypePicker } from '../ui/WorkTypePicker';
import { IntensityPicker } from '../ui/IntensityPicker';
import { TimeDisplay } from '../ui/TimeDisplay';
import { RestTimer } from '../ui/RestTimer';
import { ModeIndicator } from '../ui/ModeIndicator';
import { Button } from '../ui/Button';
import { VolumeDisplay } from '../ui/VolumeInput';
import { LoadingScreen } from '../ui/LoadingScreen';
import { SprintRepCard } from './SprintRepCard';
import { SprintSetDivider } from './SprintSetDivider';
import { EditSprintRepModal } from './EditSprintRepModal';
import { NewAuxiliaryEntryModal } from '../auxiliary/NewAuxiliaryEntryModal';
import { AuxiliaryEntryCard } from '../auxiliary/AuxiliaryEntryCard';
import { DEFAULT_PREFERENCES, FLY_IN_DISTANCES, type FlyInDistance, type SprintRep } from '../../types/models';
import { parseTimeInput, formatDate } from '../../utils/time';

export function SprintLoggingScreen() {
  const navigate = useNavigate();
  const {
    session,
    sets,
    repsBySet,
    allReps,
    loading,
    entryState,
    setDistance,
    setTimeInput,
    setTimingType,
    setIsFly,
    setFlyInDistance,
    setIntensity,
    setWorkType,
    restTimerRunning,
    restTimerSeconds,
    stopRestTimer,
    sessionVolume,
    auxiliaryEntries,
    addAuxiliaryEntry,
    deleteAuxiliaryEntry,
    addSet,
    addRep,
    updateRep,
    deleteRep,
    resetAllReps,
    completeSession,
    reopenSession,
    deleteSession,
    getBestByDistance,
  } = useActiveSprint();

  const [submitting, setSubmitting] = useState(false);
  const [editingRep, setEditingRep] = useState<SprintRep | null>(null);
  const [showAuxiliaryModal, setShowAuxiliaryModal] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const isLive = session?.status === 'active';
  const isTempo = entryState.workType === 'tempo';

  const handleAddRep = useCallback(async () => {
    const time = parseTimeInput(entryState.timeInput);
    if (!time || time <= 0) return;

    setSubmitting(true);
    try {
      await addRep();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add rep');
    } finally {
      setSubmitting(false);
    }
  }, [entryState.timeInput, addRep]);

  const handleComplete = useCallback(async () => {
    if (confirm('Complete this session? You can reopen it later if needed.')) {
      await completeSession();
    }
  }, [completeSession]);

  const handleReopen = useCallback(async () => {
    await reopenSession();
  }, [reopenSession]);

  const handleDelete = useCallback(async () => {
    if (confirm('Delete this session? All reps and auxiliary work will be permanently removed.')) {
      try {
        await deleteSession();
        navigate('/');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete session');
      }
    }
  }, [deleteSession, navigate]);

  const handleAddSet = useCallback(async () => {
    await addSet();
    stopRestTimer();
  }, [addSet, stopRestTimer]);

  const handleResetAll = useCallback(async () => {
    if (allReps.length === 0) return;
    if (!confirm(`Delete all ${allReps.length} reps in this session? This cannot be undone.`)) return;
    await resetAllReps();
    stopRestTimer();
  }, [allReps.length, resetAllReps, stopRestTimer]);

  const handleEditRep = useCallback((rep: SprintRep) => {
    setEditingRep(rep);
  }, []);

  const handleSaveRep = useCallback(async (repId: string, updates: Partial<SprintRep>) => {
    await updateRep(repId, updates);
  }, [updateRep]);

  const handleDeleteRep = useCallback(async (repId: string) => {
    await deleteRep(repId);
  }, [deleteRep]);

  if (loading || !minTimeElapsed) {
    return <LoadingScreen message="Loading sprint session..." />;
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-400">Session not found</div>
      </div>
    );
  }

  const canSubmit = parseTimeInput(entryState.timeInput) !== null && parseTimeInput(entryState.timeInput)! > 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 safe-area-inset-top">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-2 -ml-2 text-zinc-400 hover:text-zinc-200"
          aria-label="Back"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0 text-center">
          <h1 className="font-semibold text-zinc-100 truncate">
            {session.title || 'Sprint Session'}
          </h1>
          <p className="text-xs text-zinc-400">{formatDate(session.date)}</p>
        </div>

        <div className="flex items-center gap-2">
          <ModeIndicator status={session.status} compact />
          {isLive ? (
            <Button variant="ghost" size="sm" onClick={handleComplete}>
              Done
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleReopen}>
              Reopen
            </Button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
            aria-label="Delete session"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Entry section (only in Live mode) */}
        {isLive && (
          <div className="px-4 py-4 space-y-4 border-b border-zinc-800">
            {/* Rest timer */}
            {restTimerRunning && (
              <div className="mb-4">
                <RestTimer
                  initialSeconds={restTimerSeconds}
                  isRunning={restTimerRunning}
                  onComplete={stopRestTimer}
                  onReset={stopRestTimer}
                />
              </div>
            )}

            {/* Session volume summary */}
            {sessionVolume.totalVolume > 0 && (
              <div className="bg-zinc-800/30 rounded-lg px-3 py-2">
                <VolumeDisplay
                  sprintVolume={sessionVolume.sprintVolume}
                  tempoVolume={sessionVolume.tempoVolume}
                />
              </div>
            )}

            {/* Work type picker (Sprint / Tempo) */}
            <WorkTypePicker
              value={entryState.workType}
              onChange={setWorkType}
            />

            {/* Distance picker */}
            <DistancePicker
              value={entryState.distance}
              onChange={setDistance}
              favorites={DEFAULT_PREFERENCES.favoriteDistances}
            />

            {/* Timing type (selectable per rep - no lock) */}
            <TimingTypePicker
              value={entryState.timingType}
              onChange={setTimingType}
              locked={false}
            />

            {/* Intensity picker (required for tempo, optional for sprint) */}
            {(isTempo || entryState.intensity !== null) && (
              <IntensityPicker
                value={entryState.intensity}
                onChange={setIntensity}
                required={isTempo}
              />
            )}

            {/* Show intensity option for sprints if not already showing */}
            {!isTempo && entryState.intensity === null && (
              <button
                type="button"
                onClick={() => setIntensity(95)}
                className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                + Add intensity
              </button>
            )}

            {/* Time display */}
            <TimeDisplay value={entryState.timeInput} />

            {/* Numpad and actions */}
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3">
                <NumPad
                  value={entryState.timeInput}
                  onChange={setTimeInput}
                  onSubmit={canSubmit ? handleAddRep : undefined}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleAddRep}
                  disabled={!canSubmit || submitting}
                  className="flex-1"
                  size="lg"
                >
                  ADD
                </Button>
                <button
                  type="button"
                  onClick={() => setIsFly(!entryState.isFly)}
                  className={`
                    py-2 px-3 text-sm rounded-lg transition-colors duration-150 min-h-[44px]
                    ${entryState.isFly
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }
                  `}
                >
                  FLY
                </button>
                {entryState.isFly && (
                  <select
                    value={entryState.flyInDistance}
                    onChange={(e) => setFlyInDistance(Number(e.target.value) as FlyInDistance)}
                    className="py-2 px-2 text-sm bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-200"
                  >
                    {FLY_IN_DISTANCES.map((d) => (
                      <option key={d} value={d}>{d}m</option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => setShowAuxiliaryModal(true)}
                  className="py-2 px-3 text-sm rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors duration-150 min-h-[44px]"
                >
                  +AUX
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rep list */}
        <div className="px-4 py-4 safe-area-inset-bottom">
          {/* Reset All button (when there are reps) */}
          {allReps.length > 0 && (
            <div className="flex justify-end mb-4">
              <Button
                variant="danger"
                size="sm"
                onClick={handleResetAll}
              >
                Reset All ({allReps.length})
              </Button>
            </div>
          )}

          {sets.slice().reverse().map((set, idx) => {
            const reps = repsBySet.get(set.id) || [];
            const isLastSet = idx === 0;

            return (
              <div key={set.id} className="mb-4">
                <SprintSetDivider
                  set={set}
                  repCount={reps.length}
                  onAddSet={isLive && isLastSet ? handleAddSet : undefined}
                  isLastSet={isLastSet}
                />
                <div className="space-y-2">
                  {reps.slice().reverse().map((rep) => (
                    <SprintRepCard
                      key={rep.id}
                      rep={rep}
                      isBest={getBestByDistance(rep.distance)?.id === rep.id}
                      onEdit={handleEditRep}
                      onDelete={deleteRep}
                      showActions={true}
                    />
                  ))}
                  {reps.length === 0 && (
                    <p className="text-center text-zinc-600 py-4">
                      No reps yet
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Auxiliary entries */}
          {auxiliaryEntries.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Auxiliary Work</h3>
              <div className="space-y-2">
                {auxiliaryEntries.map((entry) => (
                  <AuxiliaryEntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={deleteAuxiliaryEntry}
                    showActions={isLive}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Rep Modal */}
      <EditSprintRepModal
        isOpen={editingRep !== null}
        rep={editingRep}
        onClose={() => setEditingRep(null)}
        onSave={handleSaveRep}
        onDelete={handleDeleteRep}
      />

      {/* New Auxiliary Entry Modal */}
      <NewAuxiliaryEntryModal
        isOpen={showAuxiliaryModal}
        onClose={() => setShowAuxiliaryModal(false)}
        onSave={addAuxiliaryEntry}
        sessionType="sprint"
      />
    </div>
  );
}
