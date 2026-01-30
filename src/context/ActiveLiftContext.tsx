import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { LiftSession, LiftSet, LiftRep, LiftRepInput, LiftSetInput } from '../types/models';
import { DEFAULT_PREFERENCES } from '../types/models';
import { useLifts } from '../hooks/useLifts';

interface LiftEntryState {
  exercise: string;
  load: number;
  velocityInput: string;
}

interface ActiveLiftContextValue {
  // Session data
  sessionId: string | null;
  session: LiftSession | null;
  sets: LiftSet[];
  repsBySet: Map<string, LiftRep[]>;
  loading: boolean;
  error: string | null;

  // Entry state
  entryState: LiftEntryState;
  setExercise: (exercise: string) => void;
  setLoad: (load: number) => void;
  setVelocityInput: (input: string) => void;
  clearEntry: () => void;

  // Actions
  setSessionId: (id: string | null) => void;
  createSession: (title?: string, notes?: string, date?: string) => Promise<LiftSession>;
  addSet: () => Promise<LiftSet>;
  updateSet: (setId: string, updates: Partial<LiftSet>) => Promise<void>;
  addRep: () => Promise<LiftRep>;
  updateRep: (repId: string, updates: Partial<LiftRep>) => Promise<void>;
  deleteRep: (repId: string) => Promise<void>;
  deleteSet: (setId: string) => Promise<void>;
  completeSession: () => Promise<void>;
  reopenSession: () => Promise<void>;

  // Helpers
  getLastLoadForExercise: (exercise: string) => number | null;
  getRecentExercises: () => string[];
  getCurrentSetId: () => string | null;
  getCurrentSet: () => LiftSet | null;
}

const ActiveLiftContext = createContext<ActiveLiftContextValue | null>(null);

export function ActiveLiftProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const lift = useLifts(sessionId);

  // Entry state
  const [entryState, setEntryState] = useState<LiftEntryState>({
    exercise: DEFAULT_PREFERENCES.favoriteExercises[0] || 'Back Squat',
    load: 60,
    velocityInput: '',
  });

  const setExercise = useCallback((exercise: string) => {
    setEntryState((prev) => {
      // Auto-fill last used load for this exercise
      const lastLoad = lift.getLastLoadForExercise(exercise);
      return {
        ...prev,
        exercise,
        load: lastLoad ?? prev.load,
      };
    });
  }, [lift]);

  const setLoad = useCallback((load: number) => {
    setEntryState((prev) => ({ ...prev, load }));
  }, []);

  const setVelocityInput = useCallback((velocityInput: string) => {
    setEntryState((prev) => ({ ...prev, velocityInput }));
  }, []);

  const clearEntry = useCallback(() => {
    setEntryState((prev) => ({
      ...prev,
      velocityInput: '',
    }));
  }, []);

  const getCurrentSetId = useCallback((): string | null => {
    if (lift.sets.length === 0) return null;
    return lift.sets[lift.sets.length - 1].id;
  }, [lift.sets]);

  const getCurrentSet = useCallback((): LiftSet | null => {
    if (lift.sets.length === 0) return null;
    return lift.sets[lift.sets.length - 1];
  }, [lift.sets]);

  const addSet = useCallback(async (): Promise<LiftSet> => {
    const input: LiftSetInput = {
      exercise: entryState.exercise,
      load: entryState.load,
    };
    return lift.addSet(input);
  }, [entryState.exercise, entryState.load, lift]);

  const addRep = useCallback(async (): Promise<LiftRep> => {
    let setId = getCurrentSetId();

    // Auto-create set if none exists
    if (!setId) {
      const newSet = await addSet();
      setId = newSet.id;
    }

    // Check if current set matches the entry exercise/load
    const currentSet = getCurrentSet();
    if (currentSet && (currentSet.exercise !== entryState.exercise || currentSet.load !== entryState.load)) {
      // Create a new set for the new exercise/load
      const newSet = await addSet();
      setId = newSet.id;
    }

    // Parse velocity - empty string means null (not measured)
    const velocityValue = entryState.velocityInput.trim();
    const peakVelocity = velocityValue ? parseFloat(velocityValue) || null : null;

    const input: LiftRepInput = {
      peakVelocity,
    };

    const rep = await lift.addRep(setId, input);
    clearEntry();
    return rep;
  }, [getCurrentSetId, getCurrentSet, entryState, lift, addSet, clearEntry]);

  const value: ActiveLiftContextValue = {
    sessionId,
    session: lift.session,
    sets: lift.sets,
    repsBySet: lift.repsBySet,
    loading: lift.loading,
    error: lift.error,
    entryState,
    setExercise,
    setLoad,
    setVelocityInput,
    clearEntry,
    setSessionId,
    createSession: lift.createSession,
    addSet,
    updateSet: lift.updateSet,
    addRep,
    updateRep: lift.updateRep,
    deleteRep: lift.deleteRep,
    deleteSet: lift.deleteSet,
    completeSession: lift.completeSession,
    reopenSession: lift.reopenSession,
    getLastLoadForExercise: lift.getLastLoadForExercise,
    getRecentExercises: lift.getRecentExercises,
    getCurrentSetId,
    getCurrentSet,
  };

  return (
    <ActiveLiftContext.Provider value={value}>
      {children}
    </ActiveLiftContext.Provider>
  );
}

export function useActiveLift() {
  const context = useContext(ActiveLiftContext);
  if (!context) {
    throw new Error('useActiveLift must be used within ActiveLiftProvider');
  }
  return context;
}
