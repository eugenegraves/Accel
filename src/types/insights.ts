import type { TimingType } from './models';

// --- Trend Data Points ---

export interface TrendDataPoint {
  date: string;           // YYYY-MM-DD
  value: number;
  timestamp: number;
}

export interface RollingAverage {
  period: number;         // 7, 14, 30 days
  value: number;
  change: number;         // Absolute change from previous period
  changePercent: number;  // Percentage change
}

// --- Sprint Trends ---

export interface SprintDistanceTrend {
  distance: number;
  bestTime: number;
  bestTimingType: TimingType;
  bestDate: string;
  recentTimes: TrendDataPoint[];
  rollingAverages: RollingAverage[];
  totalReps: number;
}

// --- Lift Trends ---

export interface VelocityByLoad {
  load: number;
  dataPoints: TrendDataPoint[];
}

export interface LiftExerciseTrend {
  exercise: string;
  maxLoad: number;
  maxLoadDate: string;
  velocityByLoad: VelocityByLoad[];
  peakVelocities: TrendDataPoint[];
  totalSets: number;
}

// --- Meet Trends ---

export interface MeetDistanceTrend {
  distance: number;
  pr: number;
  prDate: string;
  prMeetName: string;
  seasonBest: number;
  seasonBestDate: string;
  allRaces: TrendDataPoint[];
  deltaFromPr: number;    // Negative means improvement
}

// --- Insights ---

export type InsightCategory =
  | 'stagnation'         // No improvement in X weeks
  | 'improvement'        // New PR detected
  | 'streak'             // Consecutive improvement sessions
  | 'pattern'            // Training pattern observation
  | 'milestone'          // Notable achievement
  | 'volume_trend'       // Volume spike or drop
  | 'intensity_pattern'; // Intensity distribution observation

export type InsightSeverity =
  | 'info'          // Informational
  | 'notable'       // Worth noting
  | 'significant';  // Important observation

export type InsightDomain = 'sprint' | 'lift' | 'meet';

export interface Insight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  domain: InsightDomain;
  title: string;
  description: string;
  metric?: string;
  distance?: number;
  exercise?: string;
  value?: number;
  previousValue?: number;
  detectedAt: number;
}

// --- Helper Types ---

export interface InsightFilter {
  domain?: InsightDomain;
  category?: InsightCategory;
  distance?: number;
  exercise?: string;
}

export interface TrendSummary {
  direction: 'improving' | 'declining' | 'stable';
  percentChange: number;
  dataPoints: number;
}

// --- Volume Data Types ---

export interface VolumeDataPoint {
  date: string;           // YYYY-MM-DD
  sprintVolume: number;   // meters
  tempoVolume: number;    // meters
  totalVolume: number;    // meters
  timestamp: number;
}

export interface WeeklyVolumeSummary {
  weekStart: string;      // YYYY-MM-DD (Monday)
  sprintVolume: number;
  tempoVolume: number;
  totalVolume: number;
  sessionCount: number;
  avgIntensity?: number;
}

export interface IntensityDistribution {
  range: string;          // e.g., "90-95%"
  count: number;
  percentage: number;
}
