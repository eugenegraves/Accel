import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ExercisePicker } from '../ui/ExercisePicker';
import type { LiftSet } from '../../types/models';
import { DEFAULT_PREFERENCES } from '../../types/models';

interface EditLiftSetModalProps {
  isOpen: boolean;
  set: LiftSet | null;
  recentExercises: string[];
  onClose: () => void;
  onSave: (setId: string, updates: Partial<LiftSet>) => Promise<void>;
  onDelete: (setId: string) => Promise<void>;
}

export function EditLiftSetModal({ isOpen, set, recentExercises, onClose, onSave, onDelete }: EditLiftSetModalProps) {
  const [exercise, setExercise] = useState('');
  const [load, setLoad] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when set changes
  useEffect(() => {
    if (set) {
      setExercise(set.exercise);
      setLoad(set.load);
      setNotes(set.notes || '');
    }
  }, [set]);

  const handleSave = async () => {
    if (!set) return;

    if (!exercise.trim()) {
      alert('Please enter an exercise name');
      return;
    }

    if (load <= 0) {
      alert('Load must be positive');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(set.id, {
        exercise: exercise.trim(),
        load,
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
    if (!set) return;
    if (!confirm('Delete this set and all its reps?')) return;

    setSubmitting(true);
    try {
      await onDelete(set.id);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  if (!set) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Set">
      <div className="space-y-4">
        {/* Exercise picker */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Exercise</label>
          <ExercisePicker
            value={exercise}
            onChange={setExercise}
            favorites={DEFAULT_PREFERENCES.favoriteExercises}
            recentExercises={recentExercises}
          />
        </div>

        {/* Load input */}
        <div>
          <label htmlFor="load" className="block text-sm text-zinc-400 mb-1">
            Load (kg)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLoad(Math.max(0, load - 5))}
              className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xl min-h-[44px]"
            >
              -
            </button>
            <input
              id="load"
              type="number"
              value={load}
              onChange={(e) => setLoad(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-24 text-center px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 text-lg font-mono"
            />
            <button
              type="button"
              onClick={() => setLoad(load + 5)}
              className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xl min-h-[44px]"
            >
              +
            </button>
            <span className="text-zinc-400">kg</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm text-zinc-400 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this set..."
            rows={2}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none"
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
            Delete Set
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
