/**
 * Parse time input string to number of seconds
 * Supports formats: "482" -> 4.82, "1052" -> 10.52, "4.82" -> 4.82
 */
export function parseTimeInput(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, '');

  if (!cleaned) return null;

  // If already has decimal point, parse directly
  if (cleaned.includes('.')) {
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  // Auto-format: assume last two digits are hundredths
  if (cleaned.length >= 3) {
    const seconds = cleaned.slice(0, -2);
    const hundredths = cleaned.slice(-2);
    const parsed = parseFloat(`${seconds}.${hundredths}`);
    return isNaN(parsed) ? null : parsed;
  }

  // Less than 3 digits - treat as decimal seconds
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Format seconds to display string (e.g., 4.82 -> "4.82")
 */
export function formatTime(seconds: number): string {
  return seconds.toFixed(2);
}

/**
 * Format seconds to mm:ss display (for rest timer)
 */
export function formatRestTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Parse rest time input (supports "3:00" or "180" formats)
 */
export function parseRestInput(input: string): number | null {
  const cleaned = input.trim();

  // Handle mm:ss format
  if (cleaned.includes(':')) {
    const [minStr, secStr] = cleaned.split(':');
    const minutes = parseInt(minStr, 10);
    const seconds = parseInt(secStr || '0', 10);
    if (isNaN(minutes) || isNaN(seconds)) return null;
    return minutes * 60 + seconds;
  }

  // Handle raw seconds
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date for short display (e.g., "Jan 15")
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get current timestamp in milliseconds
 */
export function now(): number {
  return Date.now();
}
