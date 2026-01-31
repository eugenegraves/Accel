import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { VolumeInput } from '../ui/VolumeInput';
import { IntensityPicker } from '../ui/IntensityPicker';
import { Button } from '../ui/Button';
import type { AuxiliaryEntry, VolumeMetric } from '../../types/models';
import { AUXILIARY_CATEGORY_NAMES } from '../../types/models';

interface EditAuxiliaryEntryModalProps {
  isOpen: boolean;
  entry: AuxiliaryEntry | null;
  onClose: () => void;
  onSave: (entryId: string, updates: Partial<AuxiliaryEntry>) => Promise<void>;
  onDelete?: (entryId: string) => Promise<void>;
}

export function EditAuxiliaryEntryModal({
  isOpen,
  entry,
  onClose,
  onSave,
  onDelete,
}: EditAuxiliaryEntryModalProps) {
  const [name, setName] = useState('');
  const [volumeMetric, setVolumeMetric] = useState<VolumeMetric>('reps');
  const [volumeValue, setVolumeValue] = useState('');
  const [intensity, setIntensity] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Populate form when entry changes
  useEffect(() => {
    if (entry) {
      setName(entry.name);
      setVolumeMetric(entry.volumeMetric);
      setVolumeValue(entry.volumeValue.toString());
      setIntensity(entry.intensity ?? null);
      setNotes(entry.notes ?? '');
    }
  }, [entry]);

  const handleSave = async () => {
    if (!entry || !name || !volumeValue) return;

    setSubmitting(true);
    try {
      await onSave(entry.id, {
        name,
        volumeMetric,
        volumeValue: parseInt(volumeValue, 10),
        intensity: intensity ?? undefined,
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!entry || !onDelete) return;
    if (!confirm('Delete this entry?')) return;

    setSubmitting(true);
    try {
      await onDelete(entry.id);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete entry');
    } finally {
      setSubmitting(false);
    }
  };

  const canSave = name && volumeValue && parseInt(volumeValue, 10) > 0;

  if (!entry) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Entry">
      <div className="space-y-4">
        {/* Category badge (not editable) */}
        <div className="bg-emerald-600/10 text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-medium inline-block">
          {AUXILIARY_CATEGORY_NAMES[entry.category]}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Exercise Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-200 text-sm"
          />
        </div>

        {/* Volume input */}
        <VolumeInput
          value={volumeValue}
          onChange={setVolumeValue}
          metric={volumeMetric}
          onMetricChange={setVolumeMetric}
        />

        {/* Intensity */}
        <IntensityPicker
          value={intensity}
          onChange={setIntensity}
          required={false}
        />

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-200 text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onDelete && (
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1"
            >
              Delete
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!canSave || submitting}
            className="flex-1"
          >
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
