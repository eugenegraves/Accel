// Timing Types
export type TimingType = 'HAND' | 'FAT';

// Available distances: 10m increments from 10-500m
export const DISTANCES = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
  110, 120, 130, 140, 150, 160, 170, 180, 190, 200,
  210, 220, 230, 240, 250, 260, 270, 280, 290, 300,
  310, 320, 330, 340, 350, 360, 370, 380, 390, 400,
  410, 420, 430, 440, 450, 460, 470, 480, 490, 500
] as const;

export const FLY_IN_DISTANCES = [10, 20, 30] as const;

export type Distance = typeof DISTANCES[number];
export type FlyInDistance = typeof FLY_IN_DISTANCES[number];

// Session status
export type SessionStatus = 'active' | 'completed';

// --- Sprint Types ---

export interface SprintSession {
  id: string;
  date: string;                    // YYYY-MM-DD
  title?: string;
  location?: string;
  status: SessionStatus;           // active = Live Mode, completed = Review Mode
  createdAt: number;
  updatedAt: number;
}

export interface SprintSet {
  id: string;
  sessionId: string;
  sequence: number;
  name?: string;
  createdAt: number;
}

export interface SprintRep {
  id: string;
  setId: string;
  sequence: number;
  distance: number;                // meters
  time: number;                    // seconds (e.g., 4.82)
  timingType: TimingType;          // HAND/FAT - allowed to vary per rep (no session lock)
  restAfter: number;               // seconds, defaults to 180 (3 min), editable per rep
  isFly: boolean;
  flyInDistance?: FlyInDistance;   // Required if isFly=true (10, 20, or 30m)
  notes?: string;
  createdAt: number;
  updatedAt?: number;              // Track when rep was last edited
}

// --- Lift Types ---

export interface LiftSession {
  id: string;
  date: string;                    // YYYY-MM-DD
  title?: string;
  notes?: string;
  status: SessionStatus;
  createdAt: number;
  updatedAt: number;
}

export interface LiftSet {
  id: string;
  sessionId: string;
  sequence: number;
  exercise: string;                // e.g., "Back Squat", "Power Clean"
  load: number;                    // kg - editable after creation
  notes?: string;
  createdAt: number;
  updatedAt?: number;              // Track when set was last edited
}

export interface LiftRep {
  id: string;
  setId: string;
  sequence: number;
  peakVelocity: number | null;     // m/s (VBT) - optional, null if not measured
  notes?: string;
  createdAt: number;
  updatedAt?: number;              // Track when rep was last edited
}

// --- Meet / Race Types ---

export type MeetVenue = 'indoor' | 'outdoor';
export type RaceRound = 'heat' | 'semi' | 'final';

export interface Meet {
  id: string;
  date: string;                    // YYYY-MM-DD
  name: string;                    // e.g., "Conference Championships"
  venue: MeetVenue;
  timingType: TimingType;          // Enforced for ALL races in meet
  status: SessionStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Race {
  id: string;
  meetId: string;
  sequence: number;
  distance: number;                // meters
  round: RaceRound;
  time: number;                    // seconds
  wind?: number;                   // m/s (outdoor only, positive = tailwind)
  place?: number;                  // Finishing position
  notes?: string;
  createdAt: number;
}

// --- User Preferences ---

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserPreferences {
  id: 'preferences';
  favoriteDistances: number[];     // Quick-select (customizable)
  favoriteExercises: string[];     // Quick-select for lifts
  defaultRestTime: number;         // Default 180 (3 min)
  defaultTimingType: TimingType;
  theme: ThemeMode;
  hapticFeedback: boolean;
}

// --- Default Values ---

export const DEFAULT_REST_SECONDS = 180;

export const DEFAULT_PREFERENCES: UserPreferences = {
  id: 'preferences',
  favoriteDistances: [30, 40, 60, 100, 200],
  favoriteExercises: ['Back Squat', 'Power Clean', 'Bench Press', 'Deadlift'],
  defaultRestTime: DEFAULT_REST_SECONDS,
  defaultTimingType: 'HAND',
  theme: 'dark',
  hapticFeedback: true,
};

// --- Common Exercises for Lift Picker ---

export const COMMON_EXERCISES = [
  'Back Squat',
  'Front Squat',
  'Power Clean',
  'Hang Clean',
  'Clean Pull',
  'Snatch',
  'Hang Snatch',
  'Snatch Pull',
  'Deadlift',
  'Romanian Deadlift',
  'Bench Press',
  'Incline Press',
  'Overhead Press',
  'Push Press',
  'Hip Thrust',
  'Split Squat',
  'Lunge',
  'Step Up',
  'Box Jump',
  'Trap Bar Deadlift',
] as const;

// --- Helper Types for Forms ---

export interface SprintRepInput {
  distance: number;
  time: number;
  timingType: TimingType;
  restAfter?: number;
  isFly: boolean;
  flyInDistance?: FlyInDistance;
  notes?: string;
}

export interface LiftRepInput {
  peakVelocity: number | null;     // Optional - can be null if not measured
  notes?: string;
}

export interface LiftSetInput {
  exercise: string;
  load: number;
  notes?: string;
}

export interface RaceInput {
  distance: number;
  round: RaceRound;
  time: number;
  wind?: number;
  place?: number;
  notes?: string;
}
