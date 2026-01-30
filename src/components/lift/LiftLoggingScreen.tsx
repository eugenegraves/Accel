import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveLift } from '../../context/ActiveLiftContext';
import { NumPad } from '../ui/NumPad';
import { ExercisePicker } from '../ui/ExercisePicker';
import { VelocityDisplay } from '../ui/TimeDisplay';
import { ModeIndicator } from '../ui/ModeIndicator';
import { Button } from '../ui/Button';
import { LiftSetCard } from './LiftSetCard';
import { EditLiftSetModal } from './EditLiftSetModal';
import { EditLiftRepModal } from './EditLiftRepModal';
import { DEFAULT_PREFERENCES, type LiftSet, type LiftRep } from '../../types/models';
import { formatDate } from '../../utils/time';

export function LiftLoggingScreen() {
  const navigate = useNavigate();
  const {
    session,
    sets,
    repsBySet,
    loading,
    entryState,
    setExercise,
    setLoad,
    setVelocityInput,
    addRep,
    addSet,
    updateSet,
    updateRep,
    deleteRep,
    deleteSet,
    completeSession,
    reopenSession,
    getRecentExercises,
  } = useActiveLift();

  const [submitting, setSubmitting] = useState(false);
  const [editingSet, setEditingSet] = useState<LiftSet | null>(null);
  const [editingRep, setEditingRep] = useState<LiftRep | null>(null);

  const isLive = session?.status === 'active';

  const handleAddRep = useCallback(async () => {
    // Velocity can be empty (null) now
    const velocityStr = entryState.velocityInput.trim();
    if (velocityStr) {
      const velocity = parseFloat(velocityStr);
      if (isNaN(velocity) || velocity <= 0) {
        alert('Please enter a valid velocity or leave empty');
        return;
      }
    }

    setSubmitting(true);
    try {
      await addRep();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add rep');
    } finally {
      setSubmitting(false);
    }
  }, [entryState.velocityInput, addRep]);

  const handleComplete = useCallback(async () => {
    if (confirm('Complete this session? You can reopen it later if needed.')) {
      await completeSession();
    }
  }, [completeSession]);

  const handleReopen = useCallback(async () => {
    await reopenSession();
  }, [reopenSession]);

  const handleNewSet = useCallback(async () => {
    await addSet();
  }, [addSet]);

  const handleEditSet = useCallback((set: LiftSet) => {
    setEditingSet(set);
  }, []);

  const handleSaveSet = useCallback(async (setId: string, updates: Partial<LiftSet>) => {
    await updateSet(setId, updates);
  }, [updateSet]);

  const handleEditRep = useCallback((rep: LiftRep) => {
    setEditingRep(rep);
  }, []);

  const handleSaveRep = useCallback(async (repId: string, updates: Partial<LiftRep>) => {
    await updateRep(repId, updates);
  }, [updateRep]);

  const handleDeleteRep = useCallback(async (repId: string) => {
    await deleteRep(repId);
  }, [deleteRep]);

  const handleDeleteSet = useCallback(async (setId: string) => {
    await deleteSet(setId);
  }, [deleteSet]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400">Session not found</div>
      </div>
    );
  }

  // Can submit if velocity is empty (null) or a valid positive number
  const velocityStr = entryState.velocityInput.trim();
  const canSubmit = !velocityStr || (parseFloat(velocityStr) > 0 && !isNaN(parseFloat(velocityStr)));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 safe-area-inset-top">
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
            {session.title || 'Lift Session'}
          </h1>
          <p className="text-xs text-slate-400">{formatDate(session.date)}</p>
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
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Entry section (only in Live mode) */}
        {isLive && (
          <div className="px-4 py-4 space-y-4 border-b border-slate-800">
            {/* Exercise picker */}
            <ExercisePicker
              value={entryState.exercise}
              onChange={setExercise}
              favorites={DEFAULT_PREFERENCES.favoriteExercises}
              recentExercises={getRecentExercises()}
            />

            {/* Load input */}
            <div className="flex items-center gap-4">
              <label className="text-slate-400">Load:</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLoad(Math.max(0, entryState.load - 5))}
                  className="w-10 h-10 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xl"
                >
                  -
                </button>
                <input
                  type="number"
                  value={entryState.load}
                  onChange={(e) => setLoad(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 text-center px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-lg font-mono"
                />
                <button
                  type="button"
                  onClick={() => setLoad(entryState.load + 5)}
                  className="w-10 h-10 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xl"
                >
                  +
                </button>
                <span className="text-slate-400">kg</span>
              </div>
            </div>

            {/* Velocity display */}
            <VelocityDisplay value={entryState.velocityInput} />

            {/* Numpad and actions */}
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3">
                <NumPad
                  value={entryState.velocityInput}
                  onChange={setVelocityInput}
                  onSubmit={canSubmit ? handleAddRep : undefined}
                  maxLength={4}
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
                <Button
                  onClick={handleNewSet}
                  variant="secondary"
                  size="sm"
                >
                  NEW SET
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sets list */}
        <div className="px-4 py-4 space-y-4 safe-area-inset-bottom">
          {sets.slice().reverse().map((set) => {
            const reps = repsBySet.get(set.id) || [];
            return (
              <LiftSetCard
                key={set.id}
                set={set}
                reps={reps}
                onEditSet={handleEditSet}
                onEditRep={handleEditRep}
                onDeleteRep={deleteRep}
                onDeleteSet={deleteSet}
                showActions={true}
              />
            );
          })}

          {sets.length === 0 && (
            <p className="text-center text-slate-600 py-8">
              {isLive ? 'Select an exercise and add your first rep' : 'No sets recorded'}
            </p>
          )}
        </div>
      </div>

      {/* Edit Set Modal */}
      <EditLiftSetModal
        isOpen={editingSet !== null}
        set={editingSet}
        recentExercises={getRecentExercises()}
        onClose={() => setEditingSet(null)}
        onSave={handleSaveSet}
        onDelete={handleDeleteSet}
      />

      {/* Edit Rep Modal */}
      <EditLiftRepModal
        isOpen={editingRep !== null}
        rep={editingRep}
        onClose={() => setEditingRep(null)}
        onSave={handleSaveRep}
        onDelete={handleDeleteRep}
      />
    </div>
  );
}
