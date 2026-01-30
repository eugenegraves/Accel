import { useState, useEffect, useCallback } from 'react';
import {
  getLiftSetsByExercise,
  getAllExercisesWithSets,
} from '../db/database';
import type { LiftExerciseTrend, VelocityByLoad, TrendDataPoint } from '../types/insights';

export function useLiftExerciseTrend(exercise: string) {
  const [trend, setTrend] = useState<LiftExerciseTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!exercise) {
      setTrend(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const sets = await getLiftSetsByExercise(exercise);

      if (sets.length === 0) {
        setTrend(null);
        setLoading(false);
        return;
      }

      // Find max load
      const sortedByLoad = [...sets].sort((a, b) => b.load - a.load);
      const maxLoadSet = sortedByLoad[0];

      // Group velocity data by load
      const velocityByLoadMap = new Map<number, TrendDataPoint[]>();
      const peakVelocities: TrendDataPoint[] = [];

      for (const set of sets) {
        // Get peak velocity from reps (highest in set)
        const repsWithVelocity = set.reps.filter(r => r.peakVelocity !== null);
        if (repsWithVelocity.length === 0) continue;

        const maxVelocityRep = repsWithVelocity.reduce((max, r) =>
          (r.peakVelocity ?? 0) > (max.peakVelocity ?? 0) ? r : max
        );

        if (maxVelocityRep.peakVelocity === null) continue;

        const dataPoint: TrendDataPoint = {
          date: set.sessionDate,
          value: maxVelocityRep.peakVelocity,
          timestamp: set.createdAt,
        };

        // Add to velocity by load
        const existing = velocityByLoadMap.get(set.load) || [];
        existing.push(dataPoint);
        velocityByLoadMap.set(set.load, existing);

        // Add to peak velocities
        peakVelocities.push(dataPoint);
      }

      // Convert map to array
      const velocityByLoad: VelocityByLoad[] = Array.from(velocityByLoadMap.entries())
        .map(([load, dataPoints]) => ({
          load,
          dataPoints: dataPoints.sort((a, b) => a.timestamp - b.timestamp),
        }))
        .sort((a, b) => a.load - b.load);

      setTrend({
        exercise,
        maxLoad: maxLoadSet.load,
        maxLoadDate: maxLoadSet.sessionDate,
        velocityByLoad,
        peakVelocities: peakVelocities.sort((a, b) => a.timestamp - b.timestamp).slice(-20),
        totalSets: sets.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trend data');
    } finally {
      setLoading(false);
    }
  }, [exercise]);

  useEffect(() => {
    load();
  }, [load]);

  return { trend, loading, error, reload: load };
}

export function useAllExercises() {
  const [exercises, setExercises] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getAllExercisesWithSets();
    setExercises(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { exercises, loading, reload: load };
}

// Summary hook for lift review page
export interface ExerciseSummary {
  exercise: string;
  maxLoad: number;
  setCount: number;
  lastSessionDate: string;
  avgPeakVelocity: number | null;
}

export function useLiftExerciseSummaries() {
  const [summaries, setSummaries] = useState<ExerciseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const exercises = await getAllExercisesWithSets();
    const result: ExerciseSummary[] = [];

    for (const exercise of exercises) {
      const sets = await getLiftSetsByExercise(exercise);
      if (sets.length === 0) continue;

      // Find max load
      const sortedByLoad = [...sets].sort((a, b) => b.load - a.load);
      const maxLoad = sortedByLoad[0].load;

      // Find last session date
      const sortedByDate = [...sets].sort((a, b) => b.createdAt - a.createdAt);
      const lastSessionDate = sortedByDate[0].sessionDate;

      // Calculate average peak velocity across all reps
      const allVelocities: number[] = [];
      for (const set of sets) {
        for (const rep of set.reps) {
          if (rep.peakVelocity !== null) {
            allVelocities.push(rep.peakVelocity);
          }
        }
      }

      const avgPeakVelocity =
        allVelocities.length > 0
          ? allVelocities.reduce((sum, v) => sum + v, 0) / allVelocities.length
          : null;

      result.push({
        exercise,
        maxLoad,
        setCount: sets.length,
        lastSessionDate,
        avgPeakVelocity,
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
