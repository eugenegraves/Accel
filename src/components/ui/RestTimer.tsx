import { useState, useEffect, useCallback, useRef } from 'react';
import { formatRestTime } from '../../utils/time';

interface RestTimerProps {
  initialSeconds: number;
  isRunning: boolean;
  onComplete?: () => void;
  onReset?: () => void;
}

export function RestTimer({ initialSeconds, isRunning, onComplete, onReset }: RestTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const intervalRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);

  // Reset timer when initialSeconds changes
  useEffect(() => {
    setSecondsRemaining(initialSeconds);
    hasCompletedRef.current = false;
  }, [initialSeconds]);

  // Timer logic
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            // Haptic feedback on complete
            if ('vibrate' in navigator) {
              navigator.vibrate([100, 50, 100]);
            }
            onComplete?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, onComplete]);

  const handleReset = useCallback(() => {
    setSecondsRemaining(initialSeconds);
    hasCompletedRef.current = false;
    onReset?.();
  }, [initialSeconds, onReset]);

  // Calculate color based on time remaining
  const getColorClass = () => {
    if (secondsRemaining === 0) return 'ready';
    if (secondsRemaining <= 30) return 'warning';
    return '';
  };

  const progress = ((initialSeconds - secondsRemaining) / initialSeconds) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`rest-timer text-4xl font-mono font-bold ${getColorClass()}`}>
        {formatRestTime(secondsRemaining)}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            secondsRemaining === 0 ? 'bg-emerald-500' : secondsRemaining <= 30 ? 'bg-yellow-500' : 'bg-slate-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Reset button (only show when timer is active or completed) */}
      {(isRunning || secondsRemaining === 0) && (
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  );
}

// Compact version for display in rep cards
interface RestTimerDisplayProps {
  seconds: number;
}

export function RestTimerDisplay({ seconds }: RestTimerDisplayProps) {
  return (
    <span className="text-slate-500 text-sm">
      ({formatRestTime(seconds)})
    </span>
  );
}
