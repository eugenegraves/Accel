import type { SprintRep, FlyInDistance, TimingType, RaceRound } from '../types/models';
import { FLY_IN_DISTANCES } from '../types/models';

// --- Sprint Rep Validation ---

export interface SprintRepValidation {
  isValid: boolean;
  errors: string[];
}

export function validateSprintRep(
  rep: Partial<SprintRep>,
  _existingReps?: SprintRep[]  // No longer used - timing type mixing allowed
): SprintRepValidation {
  const errors: string[] = [];

  // Distance validation
  if (!rep.distance || rep.distance <= 0) {
    errors.push('Distance must be positive');
  }

  // Time validation
  if (!rep.time || rep.time <= 0) {
    errors.push('Time must be positive');
  } else if (rep.time < 1.0) {
    errors.push('Time seems too fast (< 1.0s)');
  } else if (rep.time > 120.0) {
    errors.push('Time seems too slow (> 120s)');
  }

  // REMOVED: Timing type consistency check
  // Each rep can now have its own timing type (HAND or FAT)
  // This allows e.g., 5 × 60m FAT + 1 × 150m HAND in one session

  // Fly validation
  if (rep.isFly) {
    if (!rep.flyInDistance) {
      errors.push('Fly-in distance required for fly reps');
    } else if (!FLY_IN_DISTANCES.includes(rep.flyInDistance as FlyInDistance)) {
      errors.push('Fly-in distance must be 10, 20, or 30m');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if timing type can be changed
 * NOTE: Timing type is now always changeable - each rep can have its own type
 * @deprecated Kept for backwards compatibility, always returns true
 */
export function canChangeTimingType(_existingReps: SprintRep[]): boolean {
  return true; // Timing type mixing is now allowed
}

/**
 * Get the most recent timing type used in the session (for convenience)
 * NOTE: No longer enforced - this is just a convenience function
 */
export function getSessionTimingType(existingReps: SprintRep[]): TimingType | null {
  if (existingReps.length === 0) return null;
  // Return the most recent timing type (last rep)
  return existingReps[existingReps.length - 1].timingType;
}

// --- Lift Rep Validation ---

export interface LiftRepValidation {
  isValid: boolean;
  errors: string[];
}

export function validateLiftRep(
  velocity: number | null,
  load: number
): LiftRepValidation {
  const errors: string[] = [];

  // Velocity validation - now optional (null allowed)
  if (velocity !== null) {
    if (velocity <= 0) {
      errors.push('Velocity must be positive');
    } else if (velocity < 0.1) {
      errors.push('Velocity seems too low (< 0.1 m/s)');
    } else if (velocity > 3.0) {
      errors.push('Velocity seems too high (> 3.0 m/s)');
    }
  }
  // If velocity is null, that's valid - it means "not measured"

  // Load validation
  if (load <= 0) {
    errors.push('Load must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// --- Race Validation ---

export interface RaceValidation {
  isValid: boolean;
  errors: string[];
}

export function validateRace(
  time: number,
  distance: number,
  venue: 'indoor' | 'outdoor',
  wind?: number
): RaceValidation {
  const errors: string[] = [];

  // Time validation
  if (time <= 0) {
    errors.push('Time must be positive');
  } else if (time < 1.0) {
    errors.push('Time seems too fast (< 1.0s)');
  } else if (time > 120.0) {
    errors.push('Time seems too slow (> 120s)');
  }

  // Distance validation
  if (distance <= 0) {
    errors.push('Distance must be positive');
  }

  // Wind validation (only for outdoor)
  if (wind !== undefined) {
    if (venue === 'indoor') {
      errors.push('Wind not allowed for indoor meets');
    } else if (Math.abs(wind) > 10) {
      errors.push('Wind reading seems extreme (> 10 m/s)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// --- Common Validators ---

export function isValidDistance(distance: number): boolean {
  return distance > 0 && distance <= 500 && Number.isInteger(distance);
}

export function isValidFlyInDistance(distance: number): distance is FlyInDistance {
  return FLY_IN_DISTANCES.includes(distance as FlyInDistance);
}

export function isValidRound(round: string): round is RaceRound {
  return ['heat', 'semi', 'final'].includes(round);
}

export function isValidTimingType(type: string): type is TimingType {
  return type === 'HAND' || type === 'FAT';
}

// --- Wind Formatting ---

export function formatWind(wind: number | undefined): string {
  if (wind === undefined) return '-';
  const sign = wind >= 0 ? '+' : '';
  return `${sign}${wind.toFixed(1)}`;
}

export function parseWindInput(input: string): number | null {
  const cleaned = input.replace(/[^0-9.+-]/g, '');
  if (!cleaned) return null;
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}
