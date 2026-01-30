import { formatTime, parseTimeInput } from '../../utils/time';

interface TimeDisplayProps {
  value: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TimeDisplay({ value, placeholder = '0.00', size = 'lg' }: TimeDisplayProps) {
  const parsedTime = parseTimeInput(value);

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  return (
    <div
      className={`
        font-mono font-bold text-center py-4 px-6 bg-slate-800 rounded-xl
        ${sizeClasses[size]}
        ${value ? 'text-slate-100' : 'text-slate-600'}
      `}
    >
      {value ? (
        // Show formatted time if we have valid input
        parsedTime !== null ? formatTime(parsedTime) : value
      ) : (
        placeholder
      )}
    </div>
  );
}

interface VelocityDisplayProps {
  value: string;
  placeholder?: string;
}

export function VelocityDisplay({ value, placeholder = '0.00' }: VelocityDisplayProps) {
  const parsedValue = parseFloat(value);
  const isValid = !isNaN(parsedValue) && parsedValue > 0;

  return (
    <div
      className={`
        font-mono font-bold text-center py-4 px-6 bg-slate-800 rounded-xl text-4xl
        ${value ? 'text-slate-100' : 'text-slate-600'}
      `}
    >
      {isValid ? parsedValue.toFixed(2) : placeholder}
      <span className="text-lg text-slate-500 ml-2">m/s</span>
    </div>
  );
}
