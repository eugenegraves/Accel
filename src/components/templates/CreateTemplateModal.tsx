import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description?: string) => Promise<void>;
  type: 'sprint' | 'lift';
}

export function CreateTemplateModal({
  isOpen,
  onClose,
  onSubmit,
  type,
}: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Save as ${type === 'sprint' ? 'Sprint' : 'Lift'} Template`}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Template Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Speed Day, Heavy Squats"
            className="w-full bg-slate-700 text-slate-100 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add notes about this template..."
            rows={2}
            className="w-full bg-slate-700 text-slate-100 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} fullWidth disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} fullWidth disabled={loading}>
            {loading ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
