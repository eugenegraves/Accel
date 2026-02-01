import { useState, useEffect, useCallback } from 'react';
import { db, getSprintSessionWithData } from '../db/database';
import type { SprintSession, SprintSet, SprintRep, SprintRepInput } from '../types/models';
import { DEFAULT_REST_SECONDS } from '../types/models';
import { generateId } from '../utils/uuid';
import { getCurrentDate, now } from '../utils/time';
import { validateSprintRep, canChangeTimingType, getSessionTimingType } from '../utils/validation';

export function useSprints(sessionId: string | null) {
  const [session, setSession] = useState<SprintSession | null>(null);
  const [sets, setSets] = useState<SprintSet[]>([]);
  const [repsBySet, setRepsBySet] = useState<Map<string, SprintRep[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load session data
  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      setSets([]);
      setRepsBySet(new Map());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getSprintSessionWithData(sessionId);
      if (data) {
        setSession(data.session);
        setSets(data.sets);
        setRepsBySet(data.repsBySet);
      } else {
        setSession(null);
        setSets([]);
        setRepsBySet(new Map());
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Get all reps for the session (flattened)
  const allReps = Array.from(repsBySet.values()).flat();

  // Get timing type (locked after first rep)
  const sessionTimingType = getSessionTimingType(allReps);
  const canChangeTiming = canChangeTimingType(allReps);

  // Create new sprint session
  const createSession = useCallback(async (title?: string, location?: string, date?: string): Promise<SprintSession> => {
    const timestamp = now();
    const newSession: SprintSession = {
      id: generateId(),
      date: date || getCurrentDate(),
      title,
      location,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Create first set automatically
    const firstSet: SprintSet = {
      id: generateId(),
      sessionId: newSession.id,
      sequence: 1,
      createdAt: timestamp,
    };

    await db.transaction('rw', [db.sprintSessions, db.sprintSets], async () => {
      await db.sprintSessions.add(newSession);
      await db.sprintSets.add(firstSet);
    });

    return newSession;
  }, []);

  // Add a new set
  const addSet = useCallback(async (name?: string): Promise<SprintSet> => {
    if (!sessionId || !session) throw new Error('No active session');

    const nextSequence = sets.length + 1;
    const timestamp = now();
    const newSet: SprintSet = {
      id: generateId(),
      sessionId,
      sequence: nextSequence,
      name,
      createdAt: timestamp,
    };

    await db.sprintSets.add(newSet);
    await db.sprintSessions.update(sessionId, { updatedAt: timestamp });

    setSets((prev) => [...prev, newSet]);
    setRepsBySet((prev) => {
      const newMap = new Map(prev);
      newMap.set(newSet.id, []);
      return newMap;
    });

    return newSet;
  }, [sessionId, session, sets]);

  // Add a rep to a set
  const addRep = useCallback(async (setId: string, input: SprintRepInput): Promise<SprintRep> => {
    if (!sessionId || !session) throw new Error('No active session');
    if (session.status !== 'active') throw new Error('Session is not active');

    // Validate
    const validation = validateSprintRep({ ...input }, allReps);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const existingReps = repsBySet.get(setId) || [];
    const nextSequence = existingReps.length + 1;
    const timestamp = now();

    const newRep: SprintRep = {
      id: generateId(),
      setId,
      sequence: nextSequence,
      distance: input.distance,
      time: input.time,
      timingType: input.timingType,
      restAfter: input.restAfter ?? DEFAULT_REST_SECONDS,
      isFly: input.isFly,
      flyInDistance: input.isFly ? input.flyInDistance : undefined,
      intensity: input.intensity,
      workType: input.workType ?? 'sprint',
      notes: input.notes,
      createdAt: timestamp,
    };

    await db.sprintReps.add(newRep);
    await db.sprintSessions.update(sessionId, { updatedAt: timestamp });

    setRepsBySet((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(setId) || [];
      newMap.set(setId, [...existing, newRep]);
      return newMap;
    });

    return newRep;
  }, [sessionId, session, allReps, repsBySet]);

  // Update a rep (full editing support)
  const updateRep = useCallback(async (repId: string, updates: Partial<SprintRep>): Promise<void> => {
    if (!sessionId) throw new Error('No active session');

    const timestamp = now();

    // Build update object, handling flyInDistance properly
    const updateData: Partial<SprintRep> = {
      ...updates,
      updatedAt: timestamp,
    };

    // Clear flyInDistance if not a fly rep
    if (updates.isFly === false) {
      updateData.flyInDistance = undefined;
    }

    await db.sprintReps.update(repId, updateData);
    await db.sprintSessions.update(sessionId, { updatedAt: timestamp });

    // Reload to get fresh data
    await loadSession();
  }, [sessionId, loadSession]);

  // Reset all reps in the session (delete all)
  const resetAllReps = useCallback(async (): Promise<void> => {
    if (!sessionId) throw new Error('No active session');

    const timestamp = now();

    // Get all set IDs for this session
    const sessionSets = await db.sprintSets.where('sessionId').equals(sessionId).toArray();
    const setIds = sessionSets.map(s => s.id);

    // Delete all reps for these sets
    await db.transaction('rw', [db.sprintReps, db.sprintSessions], async () => {
      await db.sprintReps.where('setId').anyOf(setIds).delete();
      await db.sprintSessions.update(sessionId, { updatedAt: timestamp });
    });

    // Update local state
    setRepsBySet((prev) => {
      const newMap = new Map(prev);
      for (const setId of setIds) {
        newMap.set(setId, []);
      }
      return newMap;
    });
  }, [sessionId]);

  // Delete a rep
  const deleteRep = useCallback(async (repId: string): Promise<void> => {
    if (!sessionId) throw new Error('No active session');

    await db.sprintReps.delete(repId);
    await db.sprintSessions.update(sessionId, { updatedAt: now() });

    // Update local state
    setRepsBySet((prev) => {
      const newMap = new Map(prev);
      for (const [setId, reps] of newMap) {
        const filtered = reps.filter((r) => r.id !== repId);
        if (filtered.length !== reps.length) {
          newMap.set(setId, filtered);
          break;
        }
      }
      return newMap;
    });
  }, [sessionId]);

  // Complete session (Live -> Review)
  const completeSession = useCallback(async (): Promise<void> => {
    if (!sessionId || !session) throw new Error('No active session');

    await db.sprintSessions.update(sessionId, {
      status: 'completed',
      updatedAt: now(),
    });

    setSession((prev) => prev ? { ...prev, status: 'completed' } : null);
  }, [sessionId, session]);

  // Reopen session (Review -> Live)
  const reopenSession = useCallback(async (): Promise<void> => {
    if (!sessionId || !session) throw new Error('No session');

    await db.sprintSessions.update(sessionId, {
      status: 'active',
      updatedAt: now(),
    });

    setSession((prev) => prev ? { ...prev, status: 'active' } : null);
  }, [sessionId, session]);

  // Delete session (and all child records)
  const deleteSession = useCallback(async (): Promise<void> => {
    if (!sessionId) throw new Error('No session to delete');

    const sessionSets = await db.sprintSets.where('sessionId').equals(sessionId).toArray();
    const setIds = sessionSets.map(s => s.id);

    await db.transaction('rw', [db.sprintSessions, db.sprintSets, db.sprintReps, db.auxiliaryEntries], async () => {
      await db.sprintReps.where('setId').anyOf(setIds).delete();
      await db.sprintSets.where('sessionId').equals(sessionId).delete();
      await db.auxiliaryEntries.where(['sessionId', 'sessionType']).equals([sessionId, 'sprint']).delete();
      await db.sprintSessions.delete(sessionId);
    });
  }, [sessionId]);

  // Get best rep by distance within this session
  const getBestByDistance = useCallback((distance: number): SprintRep | null => {
    const repsAtDistance = allReps.filter((r) => r.distance === distance);
    if (repsAtDistance.length === 0) return null;
    return repsAtDistance.reduce((best, rep) => rep.time < best.time ? rep : best);
  }, [allReps]);

  // Consider loading if sessionId is set but session doesn't match yet
  const isLoading = loading || (sessionId !== null && session?.id !== sessionId);

  return {
    session,
    sets,
    repsBySet,
    allReps,
    loading: isLoading,
    error,
    sessionTimingType,
    canChangeTiming,
    createSession,
    addSet,
    addRep,
    updateRep,
    deleteRep,
    resetAllReps,
    completeSession,
    reopenSession,
    deleteSession,
    getBestByDistance,
    reload: loadSession,
  };
}

// Hook for listing all sprint sessions
export function useSprintSessions() {
  const [sessions, setSessions] = useState<SprintSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await db.sprintSessions.orderBy('createdAt').reverse().toArray();
    setSessions(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sessions, loading, reload: load };
}
