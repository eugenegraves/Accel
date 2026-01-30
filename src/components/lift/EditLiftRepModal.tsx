import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { NumPad } from '../ui/NumPad';
import { VelocityDisplay } from '../ui/TimeDisplay';
import type { LiftRep } from '../../types/models';

interface EditLiftRepModalProps {
  isOpen: boolean;
  rep: LiftRep | null;
  onClose: () => void;
  onSave: (repId: string, updates: Partial<LiftRep>) => Promise<void>;
  onDelete: (repId: string) => Promise<void>;
}

export function EditLiftRepModal({ isOpen, rep, onClose, onSave, onDelete }: EditLiftRepModalProps) {
  const [velocityInput, setVelocityInput] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when rep changes
  useEffect(() => {
    if (rep) {
      setVelocityInput(rep.peakVelocity !== null ? rep.peakVelocity.toFixed(2) : '');
      setNotes(rep.notes || '');
    }
  }, [rep]);

  const handleSave = async () => {
    if (!rep) return;

    // Parse velocity - empty string means null (not measured)
    let peakVelocity: number | null = null;
    if (velocityInput.trim()) {
      const parsed = parseFloat(velocityInput);
      if (isNaN(parsed)) {
        alert('Please enter a valid velocity or leave empty');
        return;
      }
      if (parsed < 0.1 || parsed > 3.0) {
        alert('Velocity should be between 0.1 and 3.0 m/s');
        return;
      }
      peakVelocity = parsed;
    }

    setSubmitting(true);
    try {
      await onSave(rep.id, {
        peakVelocity,
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

  const handleClear = () => {
    setVelocityInput('');
  };

  if (!rep) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Rep">
      <div className="space-y-4">
        {/* Velocity input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-400">Velocity (m/s)</label>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded bg-slate-800"
            >
              Clear (no velocity)
            </button>
          </div>
          <VelocityDisplay value={velocityInput} />
          <div className="mt-2">
            <NumPad
              value={velocityInput}
              onChange={setVelocityInput}
              maxLength={4}
            />
          </div>
          {!velocityInput && (
            <p className="mt-2 text-xs text-slate-500">
              Leave empty if velocity was not measured
            </p>
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
