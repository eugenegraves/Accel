import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  db,
  getSprintRepsByDistanceWithDates,
  getLiftSetsByExercise,
  getRacesByDistance,
  getAllDistancesWithReps,
  getAllExercisesWithSets,
  getAllRaceDistances,
  getWeeklyVolumeSummaries,
} from '../db/database';
import type { Insight, InsightFilter } from '../types/insights';
import { generateId } from '../utils/uuid';

const STAGNATION_WEEKS = 4;
const STAGNATION_MS = STAGNATION_WEEKS * 7 * 24 * 60 * 60 * 1000;

async function detectSprintInsights(): Promise<Insight[]> {
  const insights: Insight[] = [];
  const distances = await getAllDistancesWithReps();
  const now = Date.now();

  for (const distance of distances) {
    const reps = await getSprintRepsByDistanceWithDates(distance);
    if (reps.length < 2) continue;

    // Sort by time (best first)
    const sortedByTime = [...reps].sort((a, b) => a.time - b.time);
    const bestRep = sortedByTime[0];

    // Sort by date (most recent first)
    const sortedByDate = [...reps].sort((a, b) => b.createdAt - a.createdAt);
    const mostRecent = sortedByDate[0];

    // Check for new PR (if most recent is also the best)
    if (bestRep.id === mostRecent.id && reps.length > 1) {
      const previousBest = sortedByTime[1];
      insights.push({
        id: generateId(),
        category: 'improvement',
        severity: 'significant',
        domain: 'sprint',
        title: `New ${distance}m PR!`,
        description: `You ran ${bestRep.time.toFixed(2)}s, improving by ${(previousBest.time - bestRep.time).toFixed(2)}s`,
        distance,
        value: bestRep.time,
        previousValue: previousBest.time,
        detectedAt: now,
      });
    }

    // Check for stagnation (no improvement in X weeks)
    const recentReps = reps.filter(r => r.createdAt >= now - STAGNATION_MS);
    const olderReps = reps.filter(r => r.createdAt < now - STAGNATION_MS);

    if (recentReps.length >= 3 && olderReps.length >= 1) {
      const recentBest = Math.min(...recentReps.map(r => r.time));
      const olderBest = Math.min(...olderReps.map(r => r.time));

      if (recentBest >= olderBest) {
        insights.push({
          id: generateId(),
          category: 'stagnation',
          severity: 'notable',
          domain: 'sprint',
          title: `${distance}m plateau`,
          description: `No improvement in the last ${STAGNATION_WEEKS} weeks. Best: ${olderBest.toFixed(2)}s, Recent best: ${recentBest.toFixed(2)}s`,
          distance,
          value: recentBest,
          previousValue: olderBest,
          detectedAt: now,
        });
      }
    }

    // Check for milestones (10, 25, 50, 100 reps)
    const milestones = [10, 25, 50, 100, 250, 500];
    for (const milestone of milestones) {
      if (reps.length === milestone) {
        insights.push({
          id: generateId(),
          category: 'milestone',
          severity: 'info',
          domain: 'sprint',
          title: `${milestone} reps at ${distance}m!`,
          description: `You've logged ${milestone} reps at this distance. Keep up the work!`,
          distance,
          value: milestone,
          detectedAt: now,
        });
      }
    }
  }

  return insights;
}

async function detectLiftInsights(): Promise<Insight[]> {
  const insights: Insight[] = [];
  const exercises = await getAllExercisesWithSets();
  const now = Date.now();

  for (const exercise of exercises) {
    const sets = await getLiftSetsByExercise(exercise);
    if (sets.length < 2) continue;

    // Sort by load (highest first)
    const sortedByLoad = [...sets].sort((a, b) => b.load - a.load);
    const maxLoadSet = sortedByLoad[0];

    // Sort by date (most recent first)
    const sortedByDate = [...sets].sort((a, b) => b.createdAt - a.createdAt);
    const mostRecent = sortedByDate[0];

    // Check for new max load (if most recent is also the heaviest)
    if (maxLoadSet.id === mostRecent.id && sets.length > 1) {
      const previousMax = sortedByLoad[1];
      insights.push({
        id: generateId(),
        category: 'improvement',
        severity: 'significant',
        domain: 'lift',
        title: `New ${exercise} max!`,
        description: `You lifted ${maxLoadSet.load}kg, up from ${previousMax.load}kg`,
        exercise,
        value: maxLoadSet.load,
        previousValue: previousMax.load,
        detectedAt: now,
      });
    }

    // Check for velocity improvements at same load
    const loadGroups = new Map<number, typeof sets>();
    for (const set of sets) {
      const existing = loadGroups.get(set.load) || [];
      existing.push(set);
      loadGroups.set(set.load, existing);
    }

    for (const [load, loadSets] of loadGroups) {
      if (loadSets.length < 2) continue;

      const setsWithVelocity = loadSets.filter(s =>
        s.reps.some(r => r.peakVelocity !== null)
      );
      if (setsWithVelocity.length < 2) continue;

      // Get peak velocity for each set
      const setVelocities = setsWithVelocity.map(s => ({
        set: s,
        peakVelocity: Math.max(...s.reps.filter(r => r.peakVelocity !== null).map(r => r.peakVelocity!)),
      }));

      const sortedByVelocity = [...setVelocities].sort((a, b) => b.peakVelocity - a.peakVelocity);
      const sortedBySetDate = [...setVelocities].sort((a, b) => b.set.createdAt - a.set.createdAt);

      // Check if most recent is also fastest
      if (sortedByVelocity[0].set.id === sortedBySetDate[0].set.id) {
        const improvement = sortedByVelocity[0].peakVelocity - sortedByVelocity[1].peakVelocity;
        if (improvement > 0.05) { // Meaningful velocity improvement (>0.05 m/s)
          insights.push({
            id: generateId(),
            category: 'improvement',
            severity: 'notable',
            domain: 'lift',
            title: `Faster ${exercise} at ${load}kg`,
            description: `Peak velocity improved to ${sortedByVelocity[0].peakVelocity.toFixed(2)}m/s (+${improvement.toFixed(2)}m/s)`,
            exercise,
            metric: 'velocity',
            value: sortedByVelocity[0].peakVelocity,
            previousValue: sortedByVelocity[1].peakVelocity,
            detectedAt: now,
          });
        }
      }
    }

    // Check for milestones
    const milestones = [10, 25, 50, 100, 250];
    for (const milestone of milestones) {
      if (sets.length === milestone) {
        insights.push({
          id: generateId(),
          category: 'milestone',
          severity: 'info',
          domain: 'lift',
          title: `${milestone} sets of ${exercise}!`,
          description: `You've logged ${milestone} sets of this exercise.`,
          exercise,
          value: milestone,
          detectedAt: now,
        });
      }
    }
  }

  return insights;
}

async function detectMeetInsights(): Promise<Insight[]> {
  const insights: Insight[] = [];
  const distances = await getAllRaceDistances();
  const now = Date.now();

  for (const distance of distances) {
    const races = await getRacesByDistance(distance);
    if (races.length < 2) continue;

    // Sort by time (best first)
    const sortedByTime = [...races].sort((a, b) => a.time - b.time);
    const prRace = sortedByTime[0];

    // Sort by date (most recent first)
    const sortedByDate = [...races].sort((a, b) => b.createdAt - a.createdAt);
    const mostRecent = sortedByDate[0];

    // Check for new PR
    if (prRace.id === mostRecent.id && races.length > 1) {
      const previousPr = sortedByTime[1];
      insights.push({
        id: generateId(),
        category: 'improvement',
        severity: 'significant',
        domain: 'meet',
        title: `New ${distance}m PR!`,
        description: `You ran ${prRace.time.toFixed(2)}s at ${prRace.meetName}, improving by ${(previousPr.time - prRace.time).toFixed(2)}s`,
        distance,
        value: prRace.time,
        previousValue: previousPr.time,
        detectedAt: now,
      });
    }

    // Check for milestone race counts
    const milestones = [5, 10, 25, 50];
    for (const milestone of milestones) {
      if (races.length === milestone) {
        insights.push({
          id: generateId(),
          category: 'milestone',
          severity: 'info',
          domain: 'meet',
          title: `${milestone} races at ${distance}m!`,
          description: `You've competed ${milestone} times at this distance.`,
          distance,
          value: milestone,
          detectedAt: now,
        });
      }
    }
  }

  return insights;
}

async function detectVolumeInsights(): Promise<Insight[]> {
  const insights: Insight[] = [];
  const now = Date.now();

  // Get weekly volume data
  const weeklySummaries = await getWeeklyVolumeSummaries(8);

  if (weeklySummaries.length < 2) return insights;

  // Check for volume spike (>20% increase week-over-week)
  const currentWeek = weeklySummaries[weeklySummaries.length - 1];
  const previousWeek = weeklySummaries[weeklySummaries.length - 2];

  if (previousWeek.totalVolume > 0) {
    const changePercent = ((currentWeek.totalVolume - previousWeek.totalVolume) / previousWeek.totalVolume) * 100;

    if (changePercent > 20) {
      insights.push({
        id: generateId(),
        category: 'volume_trend',
        severity: 'notable',
        domain: 'sprint',
        title: 'Volume spike detected',
        description: `Weekly volume increased by ${changePercent.toFixed(0)}% (${(previousWeek.totalVolume / 1000).toFixed(1)}km → ${(currentWeek.totalVolume / 1000).toFixed(1)}km)`,
        value: currentWeek.totalVolume,
        previousValue: previousWeek.totalVolume,
        detectedAt: now,
      });
    } else if (changePercent < -20) {
      insights.push({
        id: generateId(),
        category: 'volume_trend',
        severity: 'notable',
        domain: 'sprint',
        title: 'Volume drop detected',
        description: `Weekly volume decreased by ${Math.abs(changePercent).toFixed(0)}% (${(previousWeek.totalVolume / 1000).toFixed(1)}km → ${(currentWeek.totalVolume / 1000).toFixed(1)}km)`,
        value: currentWeek.totalVolume,
        previousValue: previousWeek.totalVolume,
        detectedAt: now,
      });
    }
  }

  // Check for volume milestones (total across all weeks)
  const totalVolume = weeklySummaries.reduce((sum, w) => sum + w.totalVolume, 0);
  const volumeMilestones = [10000, 25000, 50000, 100000]; // 10km, 25km, 50km, 100km

  for (const milestone of volumeMilestones) {
    // Calculate volume without current week to see if we just crossed
    const volumeWithoutCurrent = totalVolume - currentWeek.totalVolume;
    if (volumeWithoutCurrent < milestone && totalVolume >= milestone) {
      insights.push({
        id: generateId(),
        category: 'milestone',
        severity: 'info',
        domain: 'sprint',
        title: `${milestone / 1000}km total volume!`,
        description: `You've logged ${(totalVolume / 1000).toFixed(1)}km of sprint/tempo work in the last 8 weeks.`,
        value: totalVolume,
        detectedAt: now,
      });
    }
  }

  return insights;
}

async function detectIntensityInsights(): Promise<Insight[]> {
  const insights: Insight[] = [];
  const now = Date.now();

  // Get all reps with intensity
  const allReps = await db.sprintReps.toArray();
  const repsWithIntensity = allReps.filter(r => r.intensity !== undefined && r.intensity !== null);

  if (repsWithIntensity.length < 10) return insights;

  // Calculate intensity distribution
  const intensityBuckets: Record<string, number> = {
    '75-80': 0,
    '80-85': 0,
    '85-90': 0,
    '90-95': 0,
    '95-100': 0,
  };

  for (const rep of repsWithIntensity) {
    const intensity = rep.intensity!;
    if (intensity >= 95) intensityBuckets['95-100']++;
    else if (intensity >= 90) intensityBuckets['90-95']++;
    else if (intensity >= 85) intensityBuckets['85-90']++;
    else if (intensity >= 80) intensityBuckets['80-85']++;
    else intensityBuckets['75-80']++;
  }

  // Find most common intensity range
  const totalReps = repsWithIntensity.length;
  const entries = Object.entries(intensityBuckets);
  const mostCommon = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const mostCommonPercent = (mostCommon[1] / totalReps) * 100;

  // If >70% of reps are at the same intensity range, flag pattern
  if (mostCommonPercent > 70) {
    insights.push({
      id: generateId(),
      category: 'intensity_pattern',
      severity: 'info',
      domain: 'sprint',
      title: `Intensity pattern: ${mostCommon[0]}%`,
      description: `${mostCommonPercent.toFixed(0)}% of your tracked reps are in the ${mostCommon[0]}% intensity range.`,
      value: mostCommon[1],
      detectedAt: now,
    });
  }

  return insights;
}

export function useInsights(filter?: InsightFilter) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [sprintInsights, liftInsights, meetInsights, volumeInsights, intensityInsights] = await Promise.all([
        detectSprintInsights(),
        detectLiftInsights(),
        detectMeetInsights(),
        detectVolumeInsights(),
        detectIntensityInsights(),
      ]);

      let allInsights = [...sprintInsights, ...liftInsights, ...meetInsights, ...volumeInsights, ...intensityInsights];

      // Sort by severity (significant > notable > info), then by detection time
      const severityOrder: Record<string, number> = {
        significant: 0,
        notable: 1,
        info: 2,
      };

      allInsights.sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.detectedAt - a.detectedAt;
      });

      setInsights(allInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Apply filters
  const filteredInsights = useMemo(() => {
    if (!filter) return insights;

    return insights.filter(insight => {
      if (filter.domain && insight.domain !== filter.domain) return false;
      if (filter.category && insight.category !== filter.category) return false;
      if (filter.distance && insight.distance !== filter.distance) return false;
      if (filter.exercise && insight.exercise !== filter.exercise) return false;
      return true;
    });
  }, [insights, filter]);

  return { insights: filteredInsights, loading, error, reload: load };
}
