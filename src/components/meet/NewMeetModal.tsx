import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { MeetVenue, TimingType } from '../../types/models';

interface NewMeetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, venue: MeetVenue, timingType: TimingType) => Promise<void>;
}

export function NewMeetModal({ isOpen, onClose, onSubmit }: NewMeetModalProps) {
  const [name, setName] = useState('');
  const [venue, setVenue] = useState<MeetVenue>('outdoor');
  const [timingType, setTimingType] = useState<TimingType>('FAT');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(name.trim(), venue, timingType);
      setName('');
      setVenue('outdoor');
      setTimingType('FAT');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Meet">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm text-slate-400 mb-1">
            Meet Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Conference Championships"
            required
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Venue</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVenue('outdoor')}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${venue === 'outdoor'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }
              `}
            >
              Outdoor
            </button>
            <button
              type="button"
              onClick={() => setVenue('indoor')}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${venue === 'indoor'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }
              `}
            >
              Indoor
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Timing</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTimingType('FAT')}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${timingType === 'FAT'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }
              `}
            >
              FAT
            </button>
            <button
              type="button"
              onClick={() => setTimingType('HAND')}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${timingType === 'HAND'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }
              `}
            >
              HAND
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            All races in this meet will use {timingType} timing
          </p>
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
            disabled={!name.trim() || submitting}
            fullWidth
          >
            {submitting ? 'Creating...' : 'Start Meet'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
