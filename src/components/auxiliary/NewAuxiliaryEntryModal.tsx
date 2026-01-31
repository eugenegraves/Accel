import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { CategoryPicker } from '../ui/CategoryPicker';
import { VolumeInput } from '../ui/VolumeInput';
import { IntensityPicker } from '../ui/IntensityPicker';
import { Button } from '../ui/Button';
import type { AuxiliaryCategory, VolumeMetric, AuxiliaryEntryInput, AuxiliaryEntry } from '../../types/models';
import { CATEGORY_DEFAULT_METRICS, AUXILIARY_CATEGORY_NAMES } from '../../types/models';

interface NewAuxiliaryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: AuxiliaryEntryInput) => Promise<AuxiliaryEntry | void>;
  sessionType: 'auxiliary' | 'sprint';
}

// Common exercise names by category
const COMMON_NAMES: Record<AuxiliaryCategory, string[]> = {
  plyometrics: ['Box Jumps', 'Hurdle Hops', 'Bounds', 'Drop Jumps', 'Tuck Jumps'],
  strength_circuit: ['Med Ball Circuit', 'Core Circuit', 'General Strength'],
  sled_work: ['Sled Push', 'Sled Pull', 'Sled March'],
  wicket_runs: ['Wicket Runs', 'Mini Hurdles'],
  tempo_runs: ['200m Tempo', '100m Tempo', '300m Tempo', 'Grass Tempo'],
  general: ['Warm Up', 'Cool Down', 'Drills'],
};

export function NewAuxiliaryEntryModal({
  isOpen,
  onClose,
  onSave,
}: NewAuxiliaryEntryModalProps) {
  const [category, setCategory] = useState<AuxiliaryCategory | null>(null);
  const [name, setName] = useState('');
  const [volumeMetric, setVolumeMetric] = useState<VolumeMetric>('reps');
  const [volumeValue, setVolumeValue] = useState('');
  const [intensity, setIntensity] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'category' | 'details'>('category');
  const [submitting, setSubmitting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCategory(null);
      setName('');
      setVolumeMetric('reps');
      setVolumeValue('');
      setIntensity(null);
      setNotes('');
      setStep('category');
    }
  }, [isOpen]);

  // When category changes, set default metric
  useEffect(() => {
    if (category) {
      setVolumeMetric(CATEGORY_DEFAULT_METRICS[category]);
    }
  }, [category]);

  const handleCategorySelect = (cat: AuxiliaryCategory) => {
    setCategory(cat);
    setStep('details');
  };

  const handleNameSelect = (selectedName: string) => {
    setName(selectedName);
  };

  const handleSave = async () => {
    if (!category || !name || !volumeValue) return;

    setSubmitting(true);
    try {
      await onSave({
        category,
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

  const canSave = category && name && volumeValue && parseInt(volumeValue, 10) > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Auxiliary Work">
      {step === 'category' ? (
        <div className="space-y-4">
          <CategoryPicker value={category} onChange={handleCategorySelect} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Back button */}
          <button
            type="button"
            onClick={() => setStep('category')}
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {/* Category badge */}
          <div className="bg-emerald-600/10 text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-medium inline-block">
            {category && AUXILIARY_CATEGORY_NAMES[category]}
          </div>

          {/* Quick name selection */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Exercise Name</label>
            <div className="flex flex-wrap gap-2">
              {category && COMMON_NAMES[category].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleNameSelect(n)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm transition-colors duration-150
                    ${name === n
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }
                  `}
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Or type custom name..."
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

          {/* Intensity (optional for most, show especially for tempo) */}
          {category && (category === 'tempo_runs' || category === 'sled_work') && (
            <IntensityPicker
              value={intensity}
              onChange={setIntensity}
              required={false}
            />
          )}

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

          {/* Save button */}
          <div className="pt-2">
            <Button
              onClick={handleSave}
              disabled={!canSave || submitting}
              className="w-full"
            >
              {submitting ? 'Saving...' : 'Add Entry'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
