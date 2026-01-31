import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuxiliarySession, AuxiliaryEntry, AuxiliaryEntryInput } from '../types/models';
import { useAuxiliary } from '../hooks/useAuxiliary';

interface ActiveAuxiliaryContextValue {
  // Session data
  sessionId: string | null;
  session: AuxiliarySession | null;
  entries: AuxiliaryEntry[];
  loading: boolean;
  error: string | null;

  // Actions
  setSessionId: (id: string | null) => void;
  createSession: (title?: string, date?: string) => Promise<AuxiliarySession>;
  addEntry: (input: AuxiliaryEntryInput) => Promise<AuxiliaryEntry>;
  updateEntry: (entryId: string, updates: Partial<AuxiliaryEntry>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  completeSession: () => Promise<void>;
  reopenSession: () => Promise<void>;
}

const ActiveAuxiliaryContext = createContext<ActiveAuxiliaryContextValue | null>(null);

export function ActiveAuxiliaryProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const auxiliary = useAuxiliary(sessionId);

  const value: ActiveAuxiliaryContextValue = {
    sessionId,
    session: auxiliary.session,
    entries: auxiliary.entries,
    loading: auxiliary.loading,
    error: auxiliary.error,
    setSessionId,
    createSession: auxiliary.createSession,
    addEntry: auxiliary.addEntry,
    updateEntry: auxiliary.updateEntry,
    deleteEntry: auxiliary.deleteEntry,
    completeSession: auxiliary.completeSession,
    reopenSession: auxiliary.reopenSession,
  };

  return (
    <ActiveAuxiliaryContext.Provider value={value}>
      {children}
    </ActiveAuxiliaryContext.Provider>
  );
}

export function useActiveAuxiliary() {
  const context = useContext(ActiveAuxiliaryContext);
  if (!context) {
    throw new Error('useActiveAuxiliary must be used within ActiveAuxiliaryProvider');
  }
  return context;
}
