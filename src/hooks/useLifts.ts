import { useState, useEffect, useCallback } from 'react';
import { db, getLiftSessionWithData } from '../db/database';
import type { LiftSession, LiftSet, LiftRep, LiftRepInput, LiftSetInput } from '../types/models';
import { generateId } from '../utils/uuid';
import { getCurrentDate, now } from '../utils/time';
import { validateLiftRep } from '../utils/validation';

export function useLifts(sessionId: string | null) {
  const [session, setSession] = useState<LiftSession | null>(null);
  const [sets, setSets] = useState<LiftSet[]>([]);
  const [repsBySet, setRepsBySet] = useState<Map<string, LiftRep[]>>(new Map());
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
      const data = await getLiftSessionWithData(sessionId);
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

  // Create new lift session
  const createSession = useCallback(async (title?: string, notes?: string, date?: string): Promise<LiftSession> => {
    const timestamp = now();
    const newSession: LiftSession = {
      id: generateId(),
      date: date || getCurrentDate(),
      title,
      notes,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.liftSessions.add(newSession);
    return newSession;
  }, []);

  // Add a new set (with exercise and load)
  const addSet = useCallback(async (input: LiftSetInput): Promise<LiftSet> => {
    if (!sessionId || !session) throw new Error('No active session');

    const nextSequence = sets.length + 1;
    const timestamp = now();
    const newSet: LiftSet = {
      id: generateId(),
      sessionId,
      sequence: nextSequence,
      exercise: input.exercise,
      load: input.load,
      notes: input.notes,
      createdAt: timestamp,
    };

    await db.liftSets.add(newSet);
    await db.liftSessions.update(sessionId, { updatedAt: timestamp });

    setSets((prev) => [...prev, newSet]);
    setRepsBySet((prev) => {
      const newMap = new Map(prev);
      newMap.set(newSet.id, []);
      return newMap;
    });

    return newSet;
  }, [sessionId, session, sets]);

  // Add a rep to a set
  const addRep = useCallback(async (setId: string, input: LiftRepInput): Promise<LiftRep> => {
    if (!sessionId || !session) throw new Error('No active session');
    if (session.status !== 'active') throw new Error('Session is not active');

    // Get set to validate
    const set = sets.find((s) => s.id === setId);
    if (!set) throw new Error('Set not found');

    // Validate (velocity can be null)
    const validation = validateLiftRep(input.peakVelocity, set.load);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const existingReps = repsBySet.get(setId) || [];
    const nextSequence = existingReps.length + 1;
    const timestamp = now();

    const newRep: LiftRep = {
      id: generateId(),
      setId,
      sequence: nextSequence,
      peakVelocity: input.peakVelocity,
      notes: input.notes,
      createdAt: timestamp,
    };

    await db.liftReps.add(newRep);
    await db.liftSessions.update(sessionId, { updatedAt: timestamp });

    setRepsBySet((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(setId) || [];
      newMap.set(setId, [...existing, newRep]);
      return newMap;
    });

    return newRep;
  }, [sessionId, session, sets, repsBySet]);

  // Update a set (full editing support)
  const updateSet = useCallback(async (setId: string, updates: Partial<LiftSet>): Promise<void> => {
    if (!sessionId) throw new Error('No active session');

    const timestamp = now();

    await db.liftSets.update(setId, {
      ...updates,
      updatedAt: timestamp,
    });
    await db.liftSessions.update(sessionId, { updatedAt: timestamp });

    // Reload to get fresh data
    await loadSession();
  }, [sessionId, loadSession]);

  // Update a rep (full editing support, null velocity allowed)
  const updateRep = useCallback(async (repId: string, updates: Partial<LiftRep>): Promise<void> => {
    if (!sessionId) throw new Error('No active session');

    const timestamp = now();

    await db.liftReps.update(repId, {
      ...updates,
      updatedAt: timestamp,
    });
    await db.liftSessions.update(sessionId, { updatedAt: timestamp });

    // Reload to get fresh data
    await loadSession();
  }, [sessionId, loadSession]);

  // Delete a rep
  const deleteRep = useCallback(async (repId: string): Promise<void> => {
    if (!sessionId) throw new Error('No active session');

    await db.liftReps.delete(repId);
    await db.liftSessions.update(sessionId, { updatedAt: now() });

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

  // Delete a set (and all its reps)
  const deleteSet = useCallback(async (setId: string): Promise<void> => {
    if (!sessionId) throw new Error('No active session');

    const setReps = repsBySet.get(setId) || [];
    const repIds = setReps.map((r) => r.id);

    await db.transaction('rw', [db.liftSets, db.liftReps, db.liftSessions], async () => {
      await db.liftReps.bulkDelete(repIds);
      await db.liftSets.delete(setId);
      await db.liftSessions.update(sessionId, { updatedAt: now() });
    });

    setSets((prev) => prev.filter((s) => s.id !== setId));
    setRepsBySet((prev) => {
      const newMap = new Map(prev);
      newMap.delete(setId);
      return newMap;
    });
  }, [sessionId, repsBySet]);

  // Complete session
  const completeSession = useCallback(async (): Promise<void> => {
    if (!sessionId || !session) throw new Error('No active session');

    await db.liftSessions.update(sessionId, {
      status: 'completed',
      updatedAt: now(),
    });

    setSession((prev) => prev ? { ...prev, status: 'completed' } : null);
  }, [sessionId, session]);

  // Reopen session
  const reopenSession = useCallback(async (): Promise<void> => {
    if (!sessionId || !session) throw new Error('No session');

    await db.liftSessions.update(sessionId, {
      status: 'active',
      updatedAt: now(),
    });

    setSession((prev) => prev ? { ...prev, status: 'active' } : null);
  }, [sessionId, session]);

  // Delete session (and all child records)
  const deleteSession = useCallback(async (): Promise<void> => {
    if (!sessionId) throw new Error('No session to delete');

    const sessionSets = await db.liftSets.where('sessionId').equals(sessionId).toArray();
    const setIds = sessionSets.map(s => s.id);

    await db.transaction('rw', [db.liftSessions, db.liftSets, db.liftReps], async () => {
      await db.liftReps.where('setId').anyOf(setIds).delete();
      await db.liftSets.where('sessionId').equals(sessionId).delete();
      await db.liftSessions.delete(sessionId);
    });
  }, [sessionId]);

  // Get last used load for an exercise
  const getLastLoadForExercise = useCallback((exercise: string): number | null => {
    const matchingSets = sets.filter((s) => s.exercise === exercise);
    if (matchingSets.length === 0) return null;
    return matchingSets[matchingSets.length - 1].load;
  }, [sets]);

  // Get recent exercises (unique, ordered by recency)
  const getRecentExercises = useCallback((): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (let i = sets.length - 1; i >= 0; i--) {
      const ex = sets[i].exercise;
      if (!seen.has(ex)) {
        seen.add(ex);
        result.push(ex);
      }
      if (result.length >= 10) break;
    }
    return result;
  }, [sets]);

  // Consider loading if sessionId is set but session doesn't match yet
  const isLoading = loading || (sessionId !== null && session?.id !== sessionId);

  return {
    session,
    sets,
    repsBySet,
    loading: isLoading,
    error,
    createSession,
    addSet,
    updateSet,
    addRep,
    updateRep,
    deleteRep,
    deleteSet,
    completeSession,
    reopenSession,
    deleteSession,
    getLastLoadForExercise,
    getRecentExercises,
    reload: loadSession,
  };
}

// Hook for listing all lift sessions
export function useLiftSessions() {
  const [sessions, setSessions] = useState<LiftSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await db.liftSessions.orderBy('createdAt').reverse().toArray();
    setSessions(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sessions, loading, reload: load };
}
