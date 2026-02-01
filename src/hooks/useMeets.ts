import { useState, useEffect, useCallback } from 'react';
import { db, getMeetWithRaces } from '../db/database';
import type { Meet, Race, RaceInput, MeetVenue, TimingType } from '../types/models';
import { generateId } from '../utils/uuid';
import { getCurrentDate, now } from '../utils/time';
import { validateRace } from '../utils/validation';

export function useMeets(meetId: string | null) {
  const [meet, setMeet] = useState<Meet | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load meet data
  const loadMeet = useCallback(async () => {
    if (!meetId) {
      setMeet(null);
      setRaces([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getMeetWithRaces(meetId);
      if (data) {
        setMeet(data.meet);
        setRaces(data.races);
      } else {
        setMeet(null);
        setRaces([]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meet');
    } finally {
      setLoading(false);
    }
  }, [meetId]);

  useEffect(() => {
    loadMeet();
  }, [loadMeet]);

  // Create new meet
  const createMeet = useCallback(async (
    name: string,
    venue: MeetVenue,
    timingType: TimingType
  ): Promise<Meet> => {
    const timestamp = now();
    const newMeet: Meet = {
      id: generateId(),
      date: getCurrentDate(),
      name,
      venue,
      timingType,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.meets.add(newMeet);
    return newMeet;
  }, []);

  // Add a race
  const addRace = useCallback(async (input: RaceInput): Promise<Race> => {
    if (!meetId || !meet) throw new Error('No active meet');
    if (meet.status !== 'active') throw new Error('Meet is not active');

    // Validate
    const validation = validateRace(input.time, input.distance, meet.venue, input.wind);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Wind only allowed for outdoor meets
    const wind = meet.venue === 'outdoor' ? input.wind : undefined;

    const nextSequence = races.length + 1;
    const timestamp = now();

    const newRace: Race = {
      id: generateId(),
      meetId,
      sequence: nextSequence,
      distance: input.distance,
      round: input.round,
      time: input.time,
      wind,
      place: input.place,
      notes: input.notes,
      createdAt: timestamp,
    };

    await db.races.add(newRace);
    await db.meets.update(meetId, { updatedAt: timestamp });

    setRaces((prev) => [...prev, newRace]);
    return newRace;
  }, [meetId, meet, races]);

  // Update a race
  const updateRace = useCallback(async (raceId: string, updates: Partial<RaceInput>): Promise<void> => {
    if (!meetId) throw new Error('No active meet');

    // Wind only allowed for outdoor meets
    if (meet?.venue === 'indoor' && updates.wind !== undefined) {
      delete updates.wind;
    }

    await db.races.update(raceId, updates);
    await db.meets.update(meetId, { updatedAt: now() });

    await loadMeet();
  }, [meetId, meet, loadMeet]);

  // Delete a race
  const deleteRace = useCallback(async (raceId: string): Promise<void> => {
    if (!meetId) throw new Error('No active meet');

    await db.races.delete(raceId);
    await db.meets.update(meetId, { updatedAt: now() });

    setRaces((prev) => prev.filter((r) => r.id !== raceId));
  }, [meetId]);

  // Complete meet
  const completeMeet = useCallback(async (): Promise<void> => {
    if (!meetId || !meet) throw new Error('No active meet');

    await db.meets.update(meetId, {
      status: 'completed',
      updatedAt: now(),
    });

    setMeet((prev) => prev ? { ...prev, status: 'completed' } : null);
  }, [meetId, meet]);

  // Reopen meet
  const reopenMeet = useCallback(async (): Promise<void> => {
    if (!meetId || !meet) throw new Error('No meet');

    await db.meets.update(meetId, {
      status: 'active',
      updatedAt: now(),
    });

    setMeet((prev) => prev ? { ...prev, status: 'active' } : null);
  }, [meetId, meet]);

  // Delete meet (and all child records)
  const deleteMeet = useCallback(async (): Promise<void> => {
    if (!meetId) throw new Error('No meet to delete');

    await db.transaction('rw', [db.meets, db.races], async () => {
      await db.races.where('meetId').equals(meetId).delete();
      await db.meets.delete(meetId);
    });
  }, [meetId]);

  // Get best race at a distance
  const getBestRaceAtDistance = useCallback((distance: number): Race | null => {
    const racesAtDistance = races.filter((r) => r.distance === distance);
    if (racesAtDistance.length === 0) return null;
    return racesAtDistance.reduce((best, race) => race.time < best.time ? race : best);
  }, [races]);

  // Consider loading if meetId is set but meet doesn't match yet
  const isLoading = loading || (meetId !== null && meet?.id !== meetId);

  return {
    meet,
    races,
    loading: isLoading,
    error,
    createMeet,
    addRace,
    updateRace,
    deleteRace,
    completeMeet,
    reopenMeet,
    deleteMeet,
    getBestRaceAtDistance,
    reload: loadMeet,
  };
}

// Hook for listing all meets
export function useMeetsList() {
  const [meets, setMeets] = useState<Meet[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await db.meets.orderBy('createdAt').reverse().toArray();
    setMeets(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { meets, loading, reload: load };
}
