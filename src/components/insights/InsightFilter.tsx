import type { InsightDomain } from '../../types/insights';

interface InsightFilterProps {
  selectedDomain: InsightDomain | 'all';
  onDomainChange: (domain: InsightDomain | 'all') => void;
}

const domains: Array<{ value: InsightDomain | 'all'; label: string; color: string }> = [
  { value: 'all', label: 'All', color: 'bg-zinc-600' },
  { value: 'sprint', label: 'Sprint', color: 'bg-red-600' },
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
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 whitespace-nowrap min-h-[44px] flex items-center ${
            selectedDomain === domain.value
              ? `${domain.color} text-white`
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {domain.label}
        </button>
      ))}
    </div>
  );
}
