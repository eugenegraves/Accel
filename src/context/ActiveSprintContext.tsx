import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type {
  SprintSession,
  SprintSet,
  SprintRep,
  SprintRepInput,
  TimingType,
  FlyInDistance,
  SprintWorkType,
  AuxiliaryEntry,
  AuxiliaryEntryInput,
} from '../types/models';
import { DEFAULT_REST_SECONDS, DEFAULT_PREFERENCES } from '../types/models';
import { useSprints } from '../hooks/useSprints';
import { useSprintAuxiliary } from '../hooks/useAuxiliary';
import { useSessionVolume } from '../hooks/useVolume';

interface SprintEntryState {
  distance: number;
  timeInput: string;
  timingType: TimingType;
  isFly: boolean;
  flyInDistance: FlyInDistance;
  restAfter: number;
  intensity: number | null;     // null = not set
  workType: SprintWorkType;     // 'sprint' | 'tempo'
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
  setIntensity: (intensity: number | null) => void;
  setWorkType: (workType: SprintWorkType) => void;
  clearEntry: () => void;

  // Rest timer state
  restTimerRunning: boolean;
  restTimerSeconds: number;
  startRestTimer: (seconds?: number) => void;
  stopRestTimer: () => void;

  // Volume data
  sessionVolume: {
    sprintVolume: number;
    tempoVolume: number;
    totalVolume: number;
  };

  // Auxiliary entries
  auxiliaryEntries: AuxiliaryEntry[];
  addAuxiliaryEntry: (input: AuxiliaryEntryInput) => Promise<AuxiliaryEntry>;
  deleteAuxiliaryEntry: (entryId: string) => Promise<void>;

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
  const auxiliary = useSprintAuxiliary(sessionId);
  const volumeData = useSessionVolume(sessionId);

  // Reload volume when reps change
  useEffect(() => {
    if (sessionId) {
      volumeData.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprint.allReps.length, sessionId]);

  // Entry state
  const [entryState, setEntryState] = useState<SprintEntryState>({
    distance: DEFAULT_PREFERENCES.favoriteDistances[0] || 60,
    timeInput: '',
    timingType: DEFAULT_PREFERENCES.defaultTimingType,
    isFly: false,
    flyInDistance: 20,
    restAfter: DEFAULT_REST_SECONDS,
    intensity: null,
    workType: 'sprint',
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

  const setIntensity = useCallback((intensity: number | null) => {
    setEntryState((prev) => ({ ...prev, intensity }));
  }, []);

  const setWorkType = useCallback((workType: SprintWorkType) => {
    setEntryState((prev) => ({ ...prev, workType }));
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

    // Require intensity for tempo runs
    if (entryState.workType === 'tempo' && entryState.intensity === null) {
      throw new Error('Intensity is required for tempo runs');
    }

    const input: SprintRepInput = {
      distance: entryState.distance,
      time: parseFloat(entryState.timeInput) || 0,
      timingType: entryState.timingType,
      restAfter: entryState.restAfter,
      isFly: entryState.isFly,
      flyInDistance: entryState.isFly ? entryState.flyInDistance : undefined,
      intensity: entryState.intensity ?? undefined,
      workType: entryState.workType,
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
    setIntensity,
    setWorkType,
    clearEntry,
    restTimerRunning,
    restTimerSeconds,
    startRestTimer,
    stopRestTimer,
    sessionVolume: {
      sprintVolume: volumeData.sprintVolume,
      tempoVolume: volumeData.tempoVolume,
      totalVolume: volumeData.totalVolume,
    },
    auxiliaryEntries: auxiliary.entries,
    addAuxiliaryEntry: auxiliary.addEntry,
    deleteAuxiliaryEntry: auxiliary.deleteEntry,
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
