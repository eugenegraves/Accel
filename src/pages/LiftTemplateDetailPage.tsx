import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiftTemplate, useTemplates } from '../hooks/useTemplates';
import { ApplyTemplateModal } from '../components/templates';
import { Button } from '../components/ui/Button';

export function LiftTemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { template, loading, applyTemplate } = useLiftTemplate(templateId || null);
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
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-slate-400 mb-4">Template not found</div>
        <Button onClick={() => navigate('/templates')}>Go Back</Button>
      </div>
    );
  }

  // Get unique exercises
  const exercises = [...new Set(template.sets.map(s => s.exercise))];

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 pt-safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/templates')}
            className="p-1 text-slate-400 hover:text-slate-200"
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">
              {template.template.name}
            </h1>
            <span className="text-xs text-blue-400">Lift Template</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 pb-safe-bottom">
        {/* Description */}
        {template.template.description && (
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <p className="text-slate-300">{template.template.description}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-semibold text-slate-100">
              {template.sets.length}
            </div>
            <div className="text-xs text-slate-400">Sets</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-semibold text-slate-100">
              {exercises.length}
            </div>
            <div className="text-xs text-slate-400">Exercises</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-semibold text-slate-100">
              {template.template.useCount}
            </div>
            <div className="text-xs text-slate-400">Uses</div>
          </div>
        </div>

        {/* Structure */}
        <h2 className="text-lg font-semibold text-slate-100 mb-3">Structure</h2>
        <div className="space-y-2 mb-6">
          {template.sets.map(set => (
            <div
              key={set.id}
              className="bg-slate-800 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-slate-100">{set.exercise}</div>
                <div className="text-sm text-slate-400">
                  {set.repCount} rep{set.repCount !== 1 ? 's' : ''} @ {set.load}kg
                </div>
              </div>
              <div className="text-slate-500">Set {set.sequence}</div>
            </div>
          ))}
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
        type="lift"
      />
    </div>
  );
}
