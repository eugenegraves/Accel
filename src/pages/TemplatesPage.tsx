import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../hooks/useTemplates';
import { TemplateCard } from '../components/templates';
import { Button } from '../components/ui/Button';

export function TemplatesPage() {
  const navigate = useNavigate();
  const { templates, loading, deleteTemplate } = useTemplates();
  const [filter, setFilter] = useState<'all' | 'sprint' | 'lift'>('all');

  const filteredTemplates = filter === 'all'
    ? templates
    : templates.filter(t => t.type === filter);

  const handleDelete = async (templateId: string) => {
    if (confirm('Delete this template?')) {
      await deleteTemplate(templateId);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 pt-safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1 text-slate-400 hover:text-slate-200"
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-slate-100">Templates</h1>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700">
        <div className="flex gap-2">
          {(['all', 'sprint', 'lift'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? f === 'all'
                    ? 'bg-slate-600 text-white'
                    : f === 'sprint'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {f === 'all' ? 'All' : f === 'sprint' ? 'Sprint' : 'Lift'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 pb-safe-bottom">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-400">Loading...</div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-slate-400 mb-4">
              {filter === 'all' ? 'No templates yet' : `No ${filter} templates yet`}
            </div>
            <p className="text-slate-500 text-sm mb-6">
              Save a completed session as a template to quickly create similar sessions.
            </p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-4">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </p>
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
