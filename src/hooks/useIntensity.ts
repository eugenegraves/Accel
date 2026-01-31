import { useState, useEffect, useCallback } from 'react';
import { db, getSprintRepsByDistanceWithDates } from '../db/database';
import type { IntensityDistribution } from '../types/insights';

interface IntensityAnalytics {
  distribution: IntensityDistribution[];
  avgIntensity: number | null;
  mostCommonRange: string | null;
  repsWithIntensity: number;
  totalReps: number;
}

export function useIntensityAnalytics(distance?: number) {
  const [analytics, setAnalytics] = useState<IntensityAnalytics>({
    distribution: [],
    avgIntensity: null,
    mostCommonRange: null,
    repsWithIntensity: 0,
    totalReps: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      // Get reps either for specific distance or all
      let reps;
      if (distance) {
        reps = await getSprintRepsByDistanceWithDates(distance);
      } else {
        reps = await db.sprintReps.toArray();
      }

      // Filter to only reps with intensity set
      const repsWithIntensity = reps.filter((r) => r.intensity !== undefined && r.intensity !== null);

      if (repsWithIntensity.length === 0) {
        setAnalytics({
          distribution: [],
          avgIntensity: null,
          mostCommonRange: null,
          repsWithIntensity: 0,
          totalReps: reps.length,
        });
        return;
      }

      // Calculate distribution in 5% buckets
      const buckets: Record<string, number> = {
        '70-75%': 0,
        '75-80%': 0,
        '80-85%': 0,
        '85-90%': 0,
        '90-95%': 0,
        '95-100%': 0,
      };

      let totalIntensity = 0;

      for (const rep of repsWithIntensity) {
        const intensity = rep.intensity!;
        totalIntensity += intensity;

        if (intensity >= 95) buckets['95-100%']++;
        else if (intensity >= 90) buckets['90-95%']++;
        else if (intensity >= 85) buckets['85-90%']++;
        else if (intensity >= 80) buckets['80-85%']++;
        else if (intensity >= 75) buckets['75-80%']++;
        else buckets['70-75%']++;
      }

      const distribution: IntensityDistribution[] = Object.entries(buckets).map(
        ([range, count]) => ({
          range,
          count,
          percentage: (count / repsWithIntensity.length) * 100,
        })
      );

      // Find most common range
      const maxCount = Math.max(...distribution.map((d) => d.count));
      const mostCommon = distribution.find((d) => d.count === maxCount);

      setAnalytics({
        distribution,
        avgIntensity: totalIntensity / repsWithIntensity.length,
        mostCommonRange: mostCommon?.range || null,
        repsWithIntensity: repsWithIntensity.length,
        totalReps: reps.length,
      });
    } catch {
      setAnalytics({
        distribution: [],
        avgIntensity: null,
        mostCommonRange: null,
        repsWithIntensity: 0,
        totalReps: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [distance]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...analytics, loading, reload: load };
}

// Get intensity correlation with performance at a specific distance
export function useIntensityCorrelation(distance: number) {
  const [correlation, setCorrelation] = useState<{
    bestTimes: { intensity: number; time: number }[];
    optimalRange: string | null;
  }>({
    bestTimes: [],
    optimalRange: null,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const reps = await getSprintRepsByDistanceWithDates(distance);

      // Filter to only sprint work with intensity
      const repsWithData = reps.filter(
        (r) =>
          r.workType === 'sprint' &&
          r.intensity !== undefined &&
          r.intensity !== null
      );

      if (repsWithData.length < 5) {
        setCorrelation({ bestTimes: [], optimalRange: null });
        return;
      }

      // Group by intensity range and find best time in each
      const rangePerformance: Record<string, number[]> = {
        '75-80': [],
        '80-85': [],
        '85-90': [],
        '90-95': [],
        '95-100': [],
      };

      for (const rep of repsWithData) {
        const intensity = rep.intensity!;
        let range: string;
        if (intensity >= 95) range = '95-100';
        else if (intensity >= 90) range = '90-95';
        else if (intensity >= 85) range = '85-90';
        else if (intensity >= 80) range = '80-85';
        else range = '75-80';

        rangePerformance[range].push(rep.time);
      }

      // Find which range has the best average time
      let bestRange: string | null = null;
      let bestAvgTime = Infinity;

      for (const [range, times] of Object.entries(rangePerformance)) {
        if (times.length >= 2) {
          const avg = times.reduce((a, b) => a + b, 0) / times.length;
          if (avg < bestAvgTime) {
            bestAvgTime = avg;
            bestRange = range;
          }
        }
      }

      // Get best times per intensity
      const bestTimes = repsWithData
        .sort((a, b) => a.time - b.time)
        .slice(0, 10)
        .map((r) => ({ intensity: r.intensity!, time: r.time }));

      setCorrelation({
        bestTimes,
        optimalRange: bestRange ? `${bestRange}%` : null,
      });
    } catch {
      setCorrelation({ bestTimes: [], optimalRange: null });
    } finally {
      setLoading(false);
    }
  }, [distance]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...correlation, loading, reload: load };
}
