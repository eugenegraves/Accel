import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Meet, Race, RaceInput, RaceRound, MeetVenue, TimingType } from '../types/models';
import { DEFAULT_PREFERENCES } from '../types/models';
import { useMeets } from '../hooks/useMeets';

interface RaceEntryState {
  distance: number;
  timeInput: string;
  round: RaceRound;
  windInput: string;
  placeInput: string;
}

interface ActiveMeetContextValue {
  // Meet data
  meetId: string | null;
  meet: Meet | null;
  races: Race[];
  loading: boolean;
  error: string | null;

  // Entry state
  entryState: RaceEntryState;
  setDistance: (distance: number) => void;
  setTimeInput: (input: string) => void;
  setRound: (round: RaceRound) => void;
  setWindInput: (input: string) => void;
  setPlaceInput: (input: string) => void;
  clearEntry: () => void;

  // Actions
  setMeetId: (id: string | null) => void;
  createMeet: (name: string, venue: MeetVenue, timingType: TimingType) => Promise<Meet>;
  addRace: () => Promise<Race>;
  updateRace: (raceId: string, updates: Partial<RaceInput>) => Promise<void>;
  deleteRace: (raceId: string) => Promise<void>;
  completeMeet: () => Promise<void>;
  reopenMeet: () => Promise<void>;
  deleteMeet: () => Promise<void>;

  // Helpers
  getBestRaceAtDistance: (distance: number) => Race | null;
}

const ActiveMeetContext = createContext<ActiveMeetContextValue | null>(null);

export function ActiveMeetProvider({ children }: { children: ReactNode }) {
  const [meetId, setMeetId] = useState<string | null>(null);

  const meetHook = useMeets(meetId);

  // Entry state
  const [entryState, setEntryState] = useState<RaceEntryState>({
    distance: DEFAULT_PREFERENCES.favoriteDistances[0] || 100,
    timeInput: '',
    round: 'heat',
    windInput: '',
    placeInput: '',
  });

  const setDistance = useCallback((distance: number) => {
    setEntryState((prev) => ({ ...prev, distance }));
  }, []);

  const setTimeInput = useCallback((timeInput: string) => {
    setEntryState((prev) => ({ ...prev, timeInput }));
  }, []);

  const setRound = useCallback((round: RaceRound) => {
    setEntryState((prev) => ({ ...prev, round }));
  }, []);

  const setWindInput = useCallback((windInput: string) => {
    setEntryState((prev) => ({ ...prev, windInput }));
  }, []);

  const setPlaceInput = useCallback((placeInput: string) => {
    setEntryState((prev) => ({ ...prev, placeInput }));
  }, []);

  const clearEntry = useCallback(() => {
    setEntryState((prev) => ({
      ...prev,
      timeInput: '',
      windInput: '',
      placeInput: '',
    }));
  }, []);

  const addRace = useCallback(async (): Promise<Race> => {
    const time = parseFloat(entryState.timeInput);
    if (!time || time <= 0) throw new Error('Invalid time');

    const wind = entryState.windInput ? parseFloat(entryState.windInput) : undefined;
    const place = entryState.placeInput ? parseInt(entryState.placeInput, 10) : undefined;

    const input: RaceInput = {
      distance: entryState.distance,
      round: entryState.round,
      time,
      wind: isNaN(wind as number) ? undefined : wind,
      place: isNaN(place as number) ? undefined : place,
    };

    const race = await meetHook.addRace(input);
    clearEntry();
    return race;
  }, [entryState, meetHook, clearEntry]);

  const value: ActiveMeetContextValue = {
    meetId,
    meet: meetHook.meet,
    races: meetHook.races,
    loading: meetHook.loading,
    error: meetHook.error,
    entryState,
    setDistance,
    setTimeInput,
    setRound,
    setWindInput,
    setPlaceInput,
    clearEntry,
    setMeetId,
    createMeet: meetHook.createMeet,
    addRace,
    updateRace: meetHook.updateRace,
    deleteRace: meetHook.deleteRace,
    completeMeet: meetHook.completeMeet,
    reopenMeet: meetHook.reopenMeet,
    deleteMeet: meetHook.deleteMeet,
    getBestRaceAtDistance: meetHook.getBestRaceAtDistance,
  };

  return (
    <ActiveMeetContext.Provider value={value}>
      {children}
    </ActiveMeetContext.Provider>
  );
}

export function useActiveMeet() {
  const context = useContext(ActiveMeetContext);
  if (!context) {
    throw new Error('useActiveMeet must be used within ActiveMeetProvider');
  }
  return context;
}
