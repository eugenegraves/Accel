import { useState, useEffect, useCallback } from 'react';
import { getBestRepByDistance, getRepsByDistance } from '../db/database';
import type { SprintRep } from '../types/models';

export function useBestReps() {
  const [bestByDistance, setBestByDistance] = useState<Map<number, SprintRep>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const best = await getBestRepByDistance();
    setBestByDistance(best);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getBest = useCallback((distance: number): SprintRep | undefined => {
    return bestByDistance.get(distance);
  }, [bestByDistance]);

  return {
    bestByDistance,
    loading,
    getBest,
    reload: load,
  };
}

export function useDistanceHistory(distance: number) {
  const [reps, setReps] = useState<SprintRep[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!distance) return;
    setLoading(true);
    const distanceReps = await getRepsByDistance(distance);
    // Sort by time (fastest first)
    distanceReps.sort((a, b) => a.time - b.time);
    setReps(distanceReps);
    setLoading(false);
  }, [distance]);

  useEffect(() => {
    load();
  }, [load]);

  const bestRep = reps.length > 0 ? reps[0] : null;

  return {
    reps,
    bestRep,
    loading,
    reload: load,
  };
}
