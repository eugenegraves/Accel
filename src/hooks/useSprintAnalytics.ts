import { useState, useEffect, useCallback } from 'react';
import {
  getSprintRepsByDistanceWithDates,
  getAllDistancesWithReps,
} from '../db/database';
import type { SprintDistanceTrend, RollingAverage, TrendDataPoint } from '../types/insights';

// Calculate rolling average for a given period
function calculateRollingAverage(
  dataPoints: TrendDataPoint[],
  period: number,
  now: number
): RollingAverage | null {
  const cutoff = now - period * 24 * 60 * 60 * 1000;
  const previousCutoff = cutoff - period * 24 * 60 * 60 * 1000;

  const currentPoints = dataPoints.filter(p => p.timestamp >= cutoff);
  const previousPoints = dataPoints.filter(
    p => p.timestamp >= previousCutoff && p.timestamp < cutoff
  );

  if (currentPoints.length === 0) return null;

  const currentAvg = currentPoints.reduce((sum, p) => sum + p.value, 0) / currentPoints.length;
  const previousAvg =
    previousPoints.length > 0
      ? previousPoints.reduce((sum, p) => sum + p.value, 0) / previousPoints.length
      : currentAvg;

  const change = currentAvg - previousAvg;
  const changePercent = previousAvg !== 0 ? (change / previousAvg) * 100 : 0;

  return {
    period,
    value: currentAvg,
    change,
    changePercent,
  };
}

export function useSprintDistanceTrend(distance: number) {
  const [trend, setTrend] = useState<SprintDistanceTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!distance) {
      setTrend(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const reps = await getSprintRepsByDistanceWithDates(distance);

      if (reps.length === 0) {
        setTrend(null);
        setLoading(false);
        return;
      }

      // Find best rep
      const sortedByTime = [...reps].sort((a, b) => a.time - b.time);
      const bestRep = sortedByTime[0];

      // Create trend data points (sorted by date)
      const dataPoints: TrendDataPoint[] = reps
        .map(rep => ({
          date: rep.sessionDate,
          value: rep.time,
          timestamp: rep.createdAt,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      // Calculate rolling averages
      const now = Date.now();
      const rollingAverages: RollingAverage[] = [];

      for (const period of [7, 14, 30]) {
        const avg = calculateRollingAverage(dataPoints, period, now);
        if (avg) {
          rollingAverages.push(avg);
        }
      }

      setTrend({
        distance,
        bestTime: bestRep.time,
        bestTimingType: bestRep.timingType,
        bestDate: bestRep.sessionDate,
        recentTimes: dataPoints.slice(-20), // Last 20 data points
        rollingAverages,
        totalReps: reps.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trend data');
    } finally {
      setLoading(false);
    }
  }, [distance]);

  useEffect(() => {
    load();
  }, [load]);

  return { trend, loading, error, reload: load };
}

export function useAllSprintDistances() {
  const [distances, setDistances] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getAllDistancesWithReps();
    setDistances(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { distances, loading, reload: load };
}

// Summary hook for sprint review page
export interface DistanceSummary {
  distance: number;
  bestTime: number;
  repCount: number;
  lastSessionDate: string;
  trendDirection: 'improving' | 'declining' | 'stable';
}

export function useSprintDistanceSummaries() {
  const [summaries, setSummaries] = useState<DistanceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const distances = await getAllDistancesWithReps();
    const result: DistanceSummary[] = [];

    for (const distance of distances) {
      const reps = await getSprintRepsByDistanceWithDates(distance);
      if (reps.length === 0) continue;

      // Find best rep
      const sortedByTime = [...reps].sort((a, b) => a.time - b.time);
      const bestRep = sortedByTime[0];

      // Find last session date
      const sortedByDate = [...reps].sort((a, b) => b.createdAt - a.createdAt);
      const lastSessionDate = sortedByDate[0].sessionDate;

      // Determine trend direction
      let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
      if (reps.length >= 3) {
        const recentReps = sortedByDate.slice(0, 3);
        const olderReps = sortedByDate.slice(-3);
        const recentAvg = recentReps.reduce((sum, r) => sum + r.time, 0) / recentReps.length;
        const olderAvg = olderReps.reduce((sum, r) => sum + r.time, 0) / olderReps.length;
        const diff = ((recentAvg - olderAvg) / olderAvg) * 100;
        if (diff < -2) trendDirection = 'improving';
        else if (diff > 2) trendDirection = 'declining';
      }

      result.push({
        distance,
        bestTime: bestRep.time,
        repCount: reps.length,
        lastSessionDate,
        trendDirection,
      });
    }

    setSummaries(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { summaries, loading, reload: load };
}
