import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { SprintSession, SprintSet, SprintRep, SprintRepInput, TimingType, FlyInDistance } from '../types/models';
import { DEFAULT_REST_SECONDS, DEFAULT_PREFERENCES } from '../types/models';
import { useSprints } from '../hooks/useSprints';

interface SprintEntryState {
  distance: number;
  timeInput: string;
  timingType: TimingType;
  isFly: boolean;
  flyInDistance: FlyInDistance;
  restAfter: number;
}

interface ActiveSprintContextValue {
  // Session data
  sessionId: string | null;
  session: SprintSession | null;
  sets: SprintSet[];
  repsBySet: Map<string, SprintRep[]>;
  allReps: SprintRep[];
  loading: boolean;
  error: string | null;

  // Timing type state
  sessionTimingType: TimingType | null;
  canChangeTiming: boolean;

  // Entry state
  entryState: SprintEntryState;
  setDistance: (distance: number) => void;
  setTimeInput: (input: string) => void;
  setTimingType: (type: TimingType) => void;
  setIsFly: (isFly: boolean) => void;
  setFlyInDistance: (distance: FlyInDistance) => void;
  setRestAfter: (seconds: number) => void;
  clearEntry: () => void;

  // Rest timer state
  restTimerRunning: boolean;
  restTimerSeconds: number;
  startRestTimer: (seconds?: number) => void;
  stopRestTimer: () => void;

  // Actions
  setSessionId: (id: string | null) => void;
  createSession: (title?: string, location?: string, date?: string) => Promise<SprintSession>;
  addSet: (name?: string) => Promise<SprintSet>;
  addRep: () => Promise<SprintRep>;
  updateRep: (repId: string, updates: Partial<SprintRep>) => Promise<void>;
  deleteRep: (repId: string) => Promise<void>;
  resetAllReps: () => Promise<void>;
  completeSession: () => Promise<void>;
  reopenSession: () => Promise<void>;

  // Helpers
  getBestByDistance: (distance: number) => SprintRep | null;
  getCurrentSetId: () => string | null;
}

const ActiveSprintContext = createContext<ActiveSprintContextValue | null>(null);

export function ActiveSprintProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const sprint = useSprints(sessionId);

  // Entry state
  const [entryState, setEntryState] = useState<SprintEntryState>({
    distance: DEFAULT_PREFERENCES.favoriteDistances[0] || 60,
    timeInput: '',
    timingType: DEFAULT_PREFERENCES.defaultTimingType,
    isFly: false,
    flyInDistance: 20,
    restAfter: DEFAULT_REST_SECONDS,
  });

  // Rest timer state
  const [restTimerRunning, setRestTimerRunning] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(DEFAULT_REST_SECONDS);

  const setDistance = useCallback((distance: number) => {
    setEntryState((prev) => ({ ...prev, distance }));
  }, []);

  const setTimeInput = useCallback((input: string) => {
    setEntryState((prev) => ({ ...prev, timeInput: input }));
  }, []);

  const setTimingType = useCallback((timingType: TimingType) => {
    // Timing type can always be changed now - no lock
    setEntryState((prev) => ({ ...prev, timingType }));
  }, []);

  const setIsFly = useCallback((isFly: boolean) => {
    setEntryState((prev) => ({ ...prev, isFly }));
  }, []);

  const setFlyInDistance = useCallback((flyInDistance: FlyInDistance) => {
    setEntryState((prev) => ({ ...prev, flyInDistance }));
  }, []);

  const setRestAfter = useCallback((restAfter: number) => {
    setEntryState((prev) => ({ ...prev, restAfter }));
  }, []);

  const clearEntry = useCallback(() => {
    setEntryState((prev) => ({
      ...prev,
      timeInput: '',
    }));
  }, []);

  const startRestTimer = useCallback((seconds?: number) => {
    setRestTimerSeconds(seconds ?? entryState.restAfter);
    setRestTimerRunning(true);
  }, [entryState.restAfter]);

  const stopRestTimer = useCallback(() => {
    setRestTimerRunning(false);
  }, []);

  const getCurrentSetId = useCallback((): string | null => {
    if (sprint.sets.length === 0) return null;
    return sprint.sets[sprint.sets.length - 1].id;
  }, [sprint.sets]);

  const addRep = useCallback(async (): Promise<SprintRep> => {
    const setId = getCurrentSetId();
    if (!setId) throw new Error('No set available');

    const input: SprintRepInput = {
      distance: entryState.distance,
      time: parseFloat(entryState.timeInput) || 0,
      timingType: entryState.timingType, // Use entry state timing type directly (no lock)
      restAfter: entryState.restAfter,
      isFly: entryState.isFly,
      flyInDistance: entryState.isFly ? entryState.flyInDistance : undefined,
    };

    const rep = await sprint.addRep(setId, input);

    // Clear time input and start rest timer
    clearEntry();
    startRestTimer(entryState.restAfter);

    return rep;
  }, [
    getCurrentSetId,
    entryState,
    sprint,
    clearEntry,
    startRestTimer,
  ]);

  // Use the entry state timing type (no longer locked by session)
  const effectiveTimingType = entryState.timingType;

  const value: ActiveSprintContextValue = {
    sessionId,
    session: sprint.session,
    sets: sprint.sets,
    repsBySet: sprint.repsBySet,
    allReps: sprint.allReps,
    loading: sprint.loading,
    error: sprint.error,
    sessionTimingType: sprint.sessionTimingType,
    canChangeTiming: sprint.canChangeTiming,
    entryState: {
      ...entryState,
      timingType: effectiveTimingType,
    },
    setDistance,
    setTimeInput,
    setTimingType,
    setIsFly,
    setFlyInDistance,
    setRestAfter,
    clearEntry,
    restTimerRunning,
    restTimerSeconds,
    startRestTimer,
    stopRestTimer,
    setSessionId,
    createSession: sprint.createSession,
    addSet: sprint.addSet,
    addRep,
    updateRep: sprint.updateRep,
    deleteRep: sprint.deleteRep,
    resetAllReps: sprint.resetAllReps,
    completeSession: sprint.completeSession,
    reopenSession: sprint.reopenSession,
    getBestByDistance: sprint.getBestByDistance,
    getCurrentSetId,
  };

  return (
    <ActiveSprintContext.Provider value={value}>
      {children}
    </ActiveSprintContext.Provider>
  );
}

export function useActiveSprint() {
  const context = useContext(ActiveSprintContext);
  if (!context) {
    throw new Error('useActiveSprint must be used within ActiveSprintProvider');
  }
  return context;
}
