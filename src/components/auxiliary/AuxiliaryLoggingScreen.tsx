import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuxiliary } from '../../hooks/useAuxiliary';
import { Button } from '../ui/Button';
import { ModeIndicator } from '../ui/ModeIndicator';
import { AuxiliaryEntryCard } from './AuxiliaryEntryCard';
import { NewAuxiliaryEntryModal } from './NewAuxiliaryEntryModal';
import { EditAuxiliaryEntryModal } from './EditAuxiliaryEntryModal';
import type { AuxiliaryEntry } from '../../types/models';
import { formatDate } from '../../utils/time';

interface AuxiliaryLoggingScreenProps {
  sessionId: string;
}

export function AuxiliaryLoggingScreen({ sessionId }: AuxiliaryLoggingScreenProps) {
  const navigate = useNavigate();
  const {
    session,
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    completeSession,
    reopenSession,
  } = useAuxiliary(sessionId);

  const [showNewModal, setShowNewModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AuxiliaryEntry | null>(null);

  const isLive = session?.status === 'active';

  const handleComplete = useCallback(async () => {
    if (confirm('Complete this session? You can reopen it later if needed.')) {
      await completeSession();
    }
  }, [completeSession]);

  const handleReopen = useCallback(async () => {
    await reopenSession();
  }, [reopenSession]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-400">Session not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 safe-area-inset-top">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-2 -ml-2 text-zinc-400 hover:text-zinc-200"
          aria-label="Back"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0 text-center">
          <h1 className="font-semibold text-zinc-100 truncate">
            {session.title || 'Auxiliary Session'}
          </h1>
          <p className="text-xs text-zinc-400">{formatDate(session.date)}</p>
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
        {/* Add entry button (Live mode) */}
        {isLive && (
          <div className="px-4 py-4 border-b border-zinc-800">
            <Button
              onClick={() => setShowNewModal(true)}
              className="w-full"
              size="lg"
            >
              + Add Auxiliary Work
            </Button>
          </div>
        )}

        {/* Entry list */}
        <div className="px-4 py-4 space-y-2 safe-area-inset-bottom">
          {entries.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">
              No entries yet. {isLive && 'Tap the button above to add your first entry.'}
            </p>
          ) : (
            entries.slice().reverse().map((entry) => (
              <AuxiliaryEntryCard
                key={entry.id}
                entry={entry}
                onEdit={setEditingEntry}
                onDelete={deleteEntry}
                showActions={isLive}
              />
            ))
          )}
        </div>
      </div>

      {/* New Entry Modal */}
      <NewAuxiliaryEntryModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSave={addEntry}
        sessionType="auxiliary"
      />

      {/* Edit Entry Modal */}
      <EditAuxiliaryEntryModal
        isOpen={editingEntry !== null}
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={updateEntry}
        onDelete={deleteEntry}
      />
    </div>
  );
}
