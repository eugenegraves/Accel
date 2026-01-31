import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSprintTemplate, useTemplates } from '../hooks/useTemplates';
import { ApplyTemplateModal } from '../components/templates';
import { Button } from '../components/ui/Button';

export function SprintTemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { template, loading, applyTemplate } = useSprintTemplate(templateId || null);
  const { deleteTemplate } = useTemplates();
  const [showApplyModal, setShowApplyModal] = useState(false);

  const handleDelete = async () => {
    if (!templateId) return;
    if (confirm('Delete this template? This cannot be undone.')) {
      await deleteTemplate(templateId);
      navigate('/templates');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-zinc-400 mb-4">Template not found</div>
        <Button onClick={() => navigate('/templates')}>Go Back</Button>
      </div>
    );
  }

  // Count total reps
  const totalReps = Array.from(template.repsBySet.values()).reduce(
    (sum, reps) => sum + reps.length,
    0
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 safe-area-inset-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/templates')}
            className="p-1 text-zinc-400 hover:text-zinc-200"
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">
              {template.template.name}
            </h1>
            <span className="text-xs text-red-400">Sprint Template</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 safe-area-inset-bottom">
        {/* Description */}
        {template.template.description && (
          <div className="bg-zinc-900 rounded-lg p-4 mb-4">
            <p className="text-zinc-300">{template.template.description}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-semibold text-zinc-100">
              {template.sets.length}
            </div>
            <div className="text-xs text-zinc-400">Sets</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-semibold text-zinc-100">{totalReps}</div>
            <div className="text-xs text-zinc-400">Reps</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-semibold text-zinc-100">
              {template.template.useCount}
            </div>
            <div className="text-xs text-zinc-400">Uses</div>
          </div>
        </div>

        {/* Structure */}
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">Structure</h2>
        <div className="space-y-3 mb-6">
          {template.sets.map(set => {
            const reps = template.repsBySet.get(set.id) || [];
            return (
              <div key={set.id} className="bg-zinc-900 rounded-lg p-4">
                <div className="font-medium text-zinc-100 mb-2">
                  Set {set.sequence}
                  {set.name && <span className="text-zinc-400"> - {set.name}</span>}
                </div>
                <div className="space-y-1">
                  {reps.map(rep => (
                    <div key={rep.id} className="text-sm text-zinc-300 flex items-center gap-2">
                      <span className="text-red-400">{rep.distance}m</span>
                      <span className="text-zinc-500">{rep.timingType}</span>
                      {rep.isFly && (
                        <span className="text-amber-400 text-xs">
                          Fly {rep.flyInDistance}m
                        </span>
                      )}
                      <span className="text-zinc-500 text-xs">
                        Rest: {Math.floor(rep.restAfter / 60)}:{String(rep.restAfter % 60).padStart(2, '0')}
                      </span>
                    </div>
                  ))}
                  {reps.length === 0 && (
                    <div className="text-sm text-zinc-500 italic">No reps defined</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={() => setShowApplyModal(true)} fullWidth>
            Start Session from Template
          </Button>
          <Button variant="danger" onClick={handleDelete} fullWidth>
            Delete Template
          </Button>
        </div>
      </main>

      <ApplyTemplateModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onApply={applyTemplate}
        templateName={template.template.name}
        type="sprint"
      />
    </div>
  );
}
