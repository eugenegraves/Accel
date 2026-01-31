import { useState, useEffect, useCallback } from 'react';
import {
  getSessionVolume,
  getVolumeByDateRange,
  getWeeklyVolumeSummaries,
  type SessionVolumeData,
  type VolumeDataPoint,
  type WeeklyVolumeSummary,
} from '../db/database';

export function useSessionVolume(sessionId: string | null) {
  const [volume, setVolume] = useState<SessionVolumeData>({
    sprintVolume: 0,
    tempoVolume: 0,
    totalVolume: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!sessionId) {
      setVolume({ sprintVolume: 0, tempoVolume: 0, totalVolume: 0 });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getSessionVolume(sessionId);
      setVolume(data);
    } catch {
      setVolume({ sprintVolume: 0, tempoVolume: 0, totalVolume: 0 });
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...volume, loading, reload: load };
}

export function useDailyVolume(days: number = 30) {
  const [dataPoints, setDataPoints] = useState<VolumeDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);

      const data = await getVolumeByDateRange(
        startDate.toISOString().split('T')[0],
        now.toISOString().split('T')[0]
      );
      setDataPoints(data);
    } catch {
      setDataPoints([]);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  // Calculate totals
  const totals = dataPoints.reduce(
    (acc, dp) => ({
      sprintVolume: acc.sprintVolume + dp.sprintVolume,
      tempoVolume: acc.tempoVolume + dp.tempoVolume,
      totalVolume: acc.totalVolume + dp.totalVolume,
    }),
    { sprintVolume: 0, tempoVolume: 0, totalVolume: 0 }
  );

  return { dataPoints, totals, loading, reload: load };
}

export function useWeeklyVolume(weeks: number = 8) {
  const [summaries, setSummaries] = useState<WeeklyVolumeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWeeklyVolumeSummaries(weeks);
      setSummaries(data);
    } catch {
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, [weeks]);

  useEffect(() => {
    load();
  }, [load]);

  // Calculate overall totals and averages
  const stats = summaries.reduce(
    (acc, week) => ({
      totalSprintVolume: acc.totalSprintVolume + week.sprintVolume,
      totalTempoVolume: acc.totalTempoVolume + week.tempoVolume,
      totalVolume: acc.totalVolume + week.totalVolume,
      totalSessions: acc.totalSessions + week.sessionCount,
    }),
    { totalSprintVolume: 0, totalTempoVolume: 0, totalVolume: 0, totalSessions: 0 }
  );

  const avgWeeklyVolume = summaries.length > 0 ? stats.totalVolume / summaries.length : 0;

  // Find max volume week for chart scaling
  const maxWeeklyVolume = summaries.length > 0
    ? Math.max(...summaries.map((s) => s.totalVolume))
    : 0;

  // Calculate week-over-week change
  let weekOverWeekChange = 0;
  if (summaries.length >= 2) {
    const current = summaries[summaries.length - 1].totalVolume;
    const previous = summaries[summaries.length - 2].totalVolume;
    if (previous > 0) {
      weekOverWeekChange = ((current - previous) / previous) * 100;
    }
  }

  return {
    summaries,
    stats: {
      ...stats,
      avgWeeklyVolume,
      maxWeeklyVolume,
      weekOverWeekChange,
    },
    loading,
    reload: load,
  };
}
