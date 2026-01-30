import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/database';
import type { UserPreferences } from '../types/models';
import { DEFAULT_PREFERENCES } from '../types/models';

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const prefs = await db.initializePreferences();
    setPreferences(prefs);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...updates };
    await db.preferences.put(updated);
    setPreferences(updated);
  }, [preferences]);

  return {
    preferences,
    loading,
    updatePreferences,
    reload: load,
  };
}
