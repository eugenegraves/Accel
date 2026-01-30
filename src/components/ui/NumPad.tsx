import { useCallback } from 'react';

interface NumPadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  maxLength?: number;
  disabled?: boolean;
}

export function NumPad({ value, onChange, onSubmit, maxLength = 6, disabled = false }: NumPadProps) {
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleDigit = useCallback(
    (digit: string) => {
      if (disabled) return;
      if (value.length < maxLength) {
        triggerHaptic();
        onChange(value + digit);
      }
    },
    [value, maxLength, onChange, disabled, triggerHaptic]
  );

  const handleDecimal = useCallback(() => {
    if (disabled) return;
    if (!value.includes('.') && value.length < maxLength) {
      triggerHaptic();
      onChange(value + '.');
    }
  }, [value, maxLength, onChange, disabled, triggerHaptic]);

  const handleBackspace = useCallback(() => {
    if (disabled) return;
    if (value.length > 0) {
      triggerHaptic();
      onChange(value.slice(0, -1));
    }
  }, [value, onChange, disabled, triggerHaptic]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key >= '0' && key <= '9') {
        handleDigit(key);
      } else if (key === '.') {
        handleDecimal();
      } else if (key === 'Backspace') {
        handleBackspace();
      } else if (key === 'Enter' && onSubmit) {
        onSubmit();
      }
    },
    [handleDigit, handleDecimal, handleBackspace, onSubmit]
  );

  return (
    <div
      className="grid grid-cols-3 gap-2"
      onKeyDown={(e) => handleKeyPress(e.key)}
      tabIndex={0}
      role="group"
      aria-label="Number pad"
    >
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
        <button
          key={digit}
          type="button"
          className="numpad-btn"
          onClick={() => handleDigit(digit)}
          disabled={disabled}
          aria-label={digit}
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        className="numpad-btn"
        onClick={handleDecimal}
        disabled={disabled || value.includes('.')}
        aria-label="Decimal point"
      >
        .
      </button>
      <button
        type="button"
        className="numpad-btn"
        onClick={() => handleDigit('0')}
        disabled={disabled}
        aria-label="0"
      >
        0
      </button>
      <button
        type="button"
        className="numpad-btn"
        onClick={handleBackspace}
        disabled={disabled || value.length === 0}
        aria-label="Backspace"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414a2 2 0 011.414-.586H19a2 2 0 012 2v10a2 2 0 01-2 2h-8.172a2 2 0 01-1.414-.586L3 12z"
          />
        </svg>
      </button>
    </div>
  );
}
