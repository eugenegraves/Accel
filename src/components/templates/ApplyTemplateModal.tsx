import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => Promise<string>;
  templateName: string;
  type: 'sprint' | 'lift';
}

export function ApplyTemplateModal({
  isOpen,
  onClose,
  onApply,
  templateName,
  type,
}: ApplyTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionId = await onApply();
      onClose();
      // Navigate to the new session
      window.location.href = type === 'sprint' ? `/sprint/${sessionId}` : `/lift/${sessionId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply template');
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Template">
      <div className="space-y-4">
        <p className="text-slate-300">
          Create a new {type} session using the <strong>{templateName}</strong> template?
        </p>

        <p className="text-sm text-slate-400">
          This will create a new session with the same structure as the template.
        </p>

        {error && <div className="text-sm text-red-400">{error}</div>}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} fullWidth disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleApply} fullWidth disabled={loading}>
            {loading ? 'Creating...' : 'Start Session'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
