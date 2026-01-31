import { useState, useEffect, useCallback } from 'react';
import {
  db,
  getAuxiliarySessionWithEntries,
  getAuxiliaryEntriesForSession,
} from '../db/database';
import type {
  AuxiliarySession,
  AuxiliaryEntry,
  AuxiliaryEntryInput,
} from '../types/models';
import { generateId } from '../utils/uuid';
import { getCurrentDate, now } from '../utils/time';

export function useAuxiliary(sessionId: string | null) {
  const [session, setSession] = useState<AuxiliarySession | null>(null);
  const [entries, setEntries] = useState<AuxiliaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getAuxiliarySessionWithEntries(sessionId);
      if (data) {
        setSession(data.session);
        setEntries(data.entries);
      } else {
        setSession(null);
        setEntries([]);
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

  const createSession = useCallback(
    async (title?: string, date?: string): Promise<AuxiliarySession> => {
      const timestamp = now();
      const newSession: AuxiliarySession = {
        id: generateId(),
        date: date || getCurrentDate(),
        title,
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await db.auxiliarySessions.add(newSession);
      return newSession;
    },
    []
  );

  const addEntry = useCallback(
    async (input: AuxiliaryEntryInput): Promise<AuxiliaryEntry> => {
      if (!sessionId || !session) throw new Error('No active session');
      if (session.status !== 'active') throw new Error('Session is not active');

      const nextSequence = entries.length + 1;
      const timestamp = now();

      const newEntry: AuxiliaryEntry = {
        id: generateId(),
        sessionId,
        sessionType: 'auxiliary',
        category: input.category,
        name: input.name,
        volumeMetric: input.volumeMetric,
        volumeValue: input.volumeValue,
        intensity: input.intensity,
        notes: input.notes,
        sequence: nextSequence,
        createdAt: timestamp,
      };

      await db.auxiliaryEntries.add(newEntry);
      await db.auxiliarySessions.update(sessionId, { updatedAt: timestamp });

      setEntries((prev) => [...prev, newEntry]);
      return newEntry;
    },
    [sessionId, session, entries.length]
  );

  const updateEntry = useCallback(
    async (entryId: string, updates: Partial<AuxiliaryEntry>): Promise<void> => {
      if (!sessionId) throw new Error('No active session');

      const timestamp = now();
      await db.auxiliaryEntries.update(entryId, {
        ...updates,
        updatedAt: timestamp,
      });
      await db.auxiliarySessions.update(sessionId, { updatedAt: timestamp });

      await loadSession();
    },
    [sessionId, loadSession]
  );

  const deleteEntry = useCallback(
    async (entryId: string): Promise<void> => {
      if (!sessionId) throw new Error('No active session');

      await db.auxiliaryEntries.delete(entryId);
      await db.auxiliarySessions.update(sessionId, { updatedAt: now() });

      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    },
    [sessionId]
  );

  const completeSession = useCallback(async (): Promise<void> => {
    if (!sessionId || !session) throw new Error('No active session');

    await db.auxiliarySessions.update(sessionId, {
      status: 'completed',
      updatedAt: now(),
    });

    setSession((prev) => (prev ? { ...prev, status: 'completed' } : null));
  }, [sessionId, session]);

  const reopenSession = useCallback(async (): Promise<void> => {
    if (!sessionId || !session) throw new Error('No session');

    await db.auxiliarySessions.update(sessionId, {
      status: 'active',
      updatedAt: now(),
    });

    setSession((prev) => (prev ? { ...prev, status: 'active' } : null));
  }, [sessionId, session]);

  return {
    session,
    entries,
    loading,
    error,
    createSession,
    addEntry,
    updateEntry,
    deleteEntry,
    completeSession,
    reopenSession,
    reload: loadSession,
  };
}

// Hook for adding auxiliary entries to a sprint session
export function useSprintAuxiliary(sprintSessionId: string | null) {
  const [entries, setEntries] = useState<AuxiliaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    if (!sprintSessionId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getAuxiliaryEntriesForSession(sprintSessionId, 'sprint');
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [sprintSessionId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = useCallback(
    async (input: AuxiliaryEntryInput): Promise<AuxiliaryEntry> => {
      if (!sprintSessionId) throw new Error('No session');

      const nextSequence = entries.length + 1;
      const timestamp = now();

      const newEntry: AuxiliaryEntry = {
        id: generateId(),
        sessionId: sprintSessionId,
        sessionType: 'sprint',
        category: input.category,
        name: input.name,
        volumeMetric: input.volumeMetric,
        volumeValue: input.volumeValue,
        intensity: input.intensity,
        notes: input.notes,
        sequence: nextSequence,
        createdAt: timestamp,
      };

      await db.auxiliaryEntries.add(newEntry);
      setEntries((prev) => [...prev, newEntry]);
      return newEntry;
    },
    [sprintSessionId, entries.length]
  );

  const deleteEntry = useCallback(
    async (entryId: string): Promise<void> => {
      await db.auxiliaryEntries.delete(entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    },
    []
  );

  return {
    entries,
    loading,
    addEntry,
    deleteEntry,
    reload: loadEntries,
  };
}

// Hook for listing all auxiliary sessions
export function useAuxiliarySessions() {
  const [sessions, setSessions] = useState<AuxiliarySession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await db.auxiliarySessions.orderBy('createdAt').reverse().toArray();
    setSessions(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sessions, loading, reload: load };
}
