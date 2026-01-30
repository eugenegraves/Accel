import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { NumPad } from '../ui/NumPad';
import { DistancePicker } from '../ui/DistancePicker';
import { TimingTypePicker } from '../ui/TimingTypePicker';
import { TimeDisplay } from '../ui/TimeDisplay';
import type { SprintRep, TimingType, FlyInDistance } from '../../types/models';
import { DEFAULT_PREFERENCES, FLY_IN_DISTANCES, DEFAULT_REST_SECONDS } from '../../types/models';
import { formatTime, formatRestTime, parseRestInput } from '../../utils/time';

interface EditSprintRepModalProps {
  isOpen: boolean;
  rep: SprintRep | null;
  onClose: () => void;
  onSave: (repId: string, updates: Partial<SprintRep>) => Promise<void>;
  onDelete: (repId: string) => Promise<void>;
}

export function EditSprintRepModal({ isOpen, rep, onClose, onSave, onDelete }: EditSprintRepModalProps) {
  const [distance, setDistance] = useState(60);
  const [timeInput, setTimeInput] = useState('');
  const [timingType, setTimingType] = useState<TimingType>('HAND');
  const [restInput, setRestInput] = useState('3:00');
  const [isFly, setIsFly] = useState(false);
  const [flyInDistance, setFlyInDistance] = useState<FlyInDistance>(20);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when rep changes
  useEffect(() => {
    if (rep) {
      setDistance(rep.distance);
      setTimeInput(formatTime(rep.time));
      setTimingType(rep.timingType);
      setRestInput(formatRestTime(rep.restAfter));
      setIsFly(rep.isFly);
      setFlyInDistance(rep.flyInDistance || 20);
      setNotes(rep.notes || '');
    }
  }, [rep]);

  const handleSave = async () => {
    if (!rep) return;

    const time = parseFloat(timeInput);
    if (!time || time <= 0) {
      alert('Please enter a valid time');
      return;
    }

    const restSeconds = parseRestInput(restInput) ?? DEFAULT_REST_SECONDS;

    setSubmitting(true);
    try {
      await onSave(rep.id, {
        distance,
        time,
        timingType,
        restAfter: restSeconds,
        isFly,
        flyInDistance: isFly ? flyInDistance : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!rep) return;
    if (!confirm('Delete this rep?')) return;

    setSubmitting(true);
    try {
      await onDelete(rep.id);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  if (!rep) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Rep">
      <div className="space-y-4">
        {/* Distance picker */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Distance</label>
          <DistancePicker
            value={distance}
            onChange={setDistance}
            favorites={DEFAULT_PREFERENCES.favoriteDistances}
          />
        </div>

        {/* Time input */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Time (seconds)</label>
          <TimeDisplay value={timeInput} />
          <div className="mt-2">
            <NumPad
              value={timeInput}
              onChange={setTimeInput}
            />
          </div>
        </div>

        {/* Timing type */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Timing Type</label>
          <TimingTypePicker
            value={timingType}
            onChange={setTimingType}
            locked={false}
          />
        </div>

        {/* Rest time */}
        <div>
          <label htmlFor="rest" className="block text-sm text-slate-400 mb-1">
            Rest After (mm:ss or seconds)
          </label>
          <input
            id="rest"
            type="text"
            value={restInput}
            onChange={(e) => setRestInput(e.target.value)}
            placeholder="3:00"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Fly toggle */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFly}
              onChange={(e) => setIsFly(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-slate-300">Fly Rep</span>
          </label>
          {isFly && (
            <select
              value={flyInDistance}
              onChange={(e) => setFlyInDistance(Number(e.target.value) as FlyInDistance)}
              className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200"
            >
              {FLY_IN_DISTANCES.map((d) => (
                <option key={d} value={d}>{d}m fly-in</option>
              ))}
            </select>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm text-slate-400 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this rep..."
            rows={2}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={submitting}
          >
            Delete
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
