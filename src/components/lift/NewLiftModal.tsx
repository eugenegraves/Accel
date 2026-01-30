import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { getCurrentDate } from '../../utils/time';

interface NewLiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title?: string, notes?: string, date?: string) => Promise<void>;
}

export function NewLiftModal({ isOpen, onClose, onSubmit }: NewLiftModalProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(getCurrentDate());
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(title.trim() || undefined, notes.trim() || undefined, date);
      setTitle('');
      setNotes('');
      setDate(getCurrentDate());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Lift Session">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm text-slate-400 mb-1">
            Session Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm text-slate-400 mb-1">
            Session Name (optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Leg Day, Upper Body"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm text-slate-400 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this session..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            fullWidth
          >
            {submitting ? 'Creating...' : 'Start Session'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
