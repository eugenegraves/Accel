import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { getCurrentDate } from '../../utils/time';

interface NewAuxiliarySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title?: string, date?: string) => Promise<void>;
}

export function NewAuxiliarySessionModal({ isOpen, onClose, onSubmit }: NewAuxiliarySessionModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getCurrentDate());
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(title.trim() || undefined, date);
      setTitle('');
      setDate(getCurrentDate());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Auxiliary Session">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="aux-date" className="block text-sm text-zinc-400 mb-1">
            Session Date
          </label>
          <input
            id="aux-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="aux-title" className="block text-sm text-zinc-400 mb-1">
            Session Name (optional)
          </label>
          <input
            id="aux-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Recovery Day, Mobility"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
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
            className="!bg-emerald-600 hover:!bg-emerald-700"
          >
            {submitting ? 'Creating...' : 'Start Session'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
