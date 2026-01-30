import type { InsightDomain } from '../../types/insights';

interface InsightFilterProps {
  selectedDomain: InsightDomain | 'all';
  onDomainChange: (domain: InsightDomain | 'all') => void;
}

const domains: Array<{ value: InsightDomain | 'all'; label: string; color: string }> = [
  { value: 'all', label: 'All', color: 'bg-slate-600' },
  { value: 'sprint', label: 'Sprint', color: 'bg-emerald-600' },
  { value: 'lift', label: 'Lift', color: 'bg-blue-600' },
  { value: 'meet', label: 'Meet', color: 'bg-purple-600' },
];

export function InsightFilter({ selectedDomain, onDomainChange }: InsightFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {domains.map(domain => (
        <button
          key={domain.value}
          onClick={() => onDomainChange(domain.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            selectedDomain === domain.value
              ? `${domain.color} text-white`
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {domain.label}
        </button>
      ))}
    </div>
  );
}
