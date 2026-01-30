import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { getCurrentDate } from '../../utils/time';

interface NewSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title?: string, location?: string, date?: string) => Promise<void>;
}

export function NewSprintModal({ isOpen, onClose, onSubmit }: NewSprintModalProps) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(getCurrentDate());
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(title.trim() || undefined, location.trim() || undefined, date);
      setTitle('');
      setLocation('');
      setDate(getCurrentDate());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Sprint Session">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm text-zinc-400 mb-1">
            Session Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:border-red-500"
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm text-zinc-400 mb-1">
            Session Name (optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Speed Day"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm text-zinc-400 mb-1">
            Location (optional)
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Track, Gym"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
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
