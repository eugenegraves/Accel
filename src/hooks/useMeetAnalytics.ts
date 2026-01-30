import { useState, useEffect, useCallback } from 'react';
import { getRacesByDistance, getAllRaceDistances } from '../db/database';
import type { MeetDistanceTrend, TrendDataPoint } from '../types/insights';

// Get the start of the current season (assume August 1 for track)
function getSeasonStart(): Date {
  const now = new Date();
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 7, 1); // August 1
}

export function useMeetDistanceTrend(distance: number) {
  const [trend, setTrend] = useState<MeetDistanceTrend | null>(null);
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

      const races = await getRacesByDistance(distance);

      if (races.length === 0) {
        setTrend(null);
        setLoading(false);
        return;
      }

      // Find PR (all-time best)
      const sortedByTime = [...races].sort((a, b) => a.time - b.time);
      const prRace = sortedByTime[0];

      // Find season best
      const seasonStart = getSeasonStart();
      const seasonRaces = races.filter(r => new Date(r.meetDate) >= seasonStart);
      const seasonSortedByTime = [...seasonRaces].sort((a, b) => a.time - b.time);
      const seasonBestRace = seasonSortedByTime[0] || prRace;

      // Create trend data points
      const allRaces: TrendDataPoint[] = races
        .map(race => ({
          date: race.meetDate,
          value: race.time,
          timestamp: race.createdAt,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      // Calculate delta from PR (for most recent race)
      const sortedByDate = [...races].sort((a, b) => b.createdAt - a.createdAt);
      const mostRecentRace = sortedByDate[0];
      const deltaFromPr = mostRecentRace.time - prRace.time;

      setTrend({
        distance,
        pr: prRace.time,
        prDate: prRace.meetDate,
        prMeetName: prRace.meetName,
        seasonBest: seasonBestRace.time,
        seasonBestDate: seasonBestRace.meetDate,
        allRaces,
        deltaFromPr,
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

export function useAllRaceDistances() {
  const [distances, setDistances] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getAllRaceDistances();
    setDistances(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { distances, loading, reload: load };
}

// Summary hook for meet review page
export interface RaceDistanceSummary {
  distance: number;
  pr: number;
  prDate: string;
  prMeetName: string;
  seasonBest: number;
  raceCount: number;
  deltaFromPr: number;
}

export function useRaceDistanceSummaries() {
  const [summaries, setSummaries] = useState<RaceDistanceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const distances = await getAllRaceDistances();
    const result: RaceDistanceSummary[] = [];
    const seasonStart = getSeasonStart();

    for (const distance of distances) {
      const races = await getRacesByDistance(distance);
      if (races.length === 0) continue;

      // Find PR
      const sortedByTime = [...races].sort((a, b) => a.time - b.time);
      const prRace = sortedByTime[0];

      // Find season best
      const seasonRaces = races.filter(r => new Date(r.meetDate) >= seasonStart);
      const seasonSortedByTime = [...seasonRaces].sort((a, b) => a.time - b.time);
      const seasonBest = seasonSortedByTime[0]?.time || prRace.time;

      // Most recent race delta
      const sortedByDate = [...races].sort((a, b) => b.createdAt - a.createdAt);
      const deltaFromPr = sortedByDate[0].time - prRace.time;

      result.push({
        distance,
        pr: prRace.time,
        prDate: prRace.meetDate,
        prMeetName: prRace.meetName,
        seasonBest,
        raceCount: races.length,
        deltaFromPr,
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
