import { useNavigate } from 'react-router-dom';
import type { SessionTemplate } from '../../types/templates';
import { formatDateShort } from '../../utils/time';

interface TemplateCardProps {
  template: SessionTemplate;
  onDelete?: (templateId: string) => void;
}

export function TemplateCard({ template, onDelete }: TemplateCardProps) {
  const navigate = useNavigate();

  const typeLabel = template.type === 'sprint' ? 'Sprint' : 'Lift';
  const detailPath =
    template.type === 'sprint'
      ? `/templates/sprint/${template.id}`
      : `/templates/lift/${template.id}`;

  return (
    <div className="bg-zinc-900 rounded-lg p-4">
      <button
        onClick={() => navigate(detailPath)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100">{template.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                template.type === 'sprint' ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'
              }`}>
                {typeLabel}
              </span>
            </div>
            {template.description && (
              <p className="text-sm text-zinc-400 mt-1 line-clamp-1">
                {template.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
              <span>Used {template.useCount} time{template.useCount !== 1 ? 's' : ''}</span>
              {template.lastUsedAt && (
                <span>Last: {formatDateShort(new Date(template.lastUsedAt).toISOString().split('T')[0])}</span>
              )}
            </div>
          </div>
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {onDelete && (
        <div className="mt-3 pt-3 border-t border-zinc-700">
          <button
            onClick={() => onDelete(template.id)}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Delete Template
          </button>
        </div>
      )}
    </div>
  );
}
