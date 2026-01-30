import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, exportAllData, importAllData } from '../db/database';
import { Button } from '../components/ui/Button';
import type { UserPreferences } from '../types/models';
import { DEFAULT_PREFERENCES } from '../types/models';
import { validateBackup } from '../utils/validation';
import { APP_VERSION } from '../constants/version';

export function SettingsPage() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load preferences
  useEffect(() => {
    async function load() {
      const prefs = await db.initializePreferences();
      setPreferences(prefs);
      setLoading(false);
    }
    load();
  }, []);

  // Save preferences
  const savePreferences = async (updates: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...updates };
    await db.preferences.put(updated);
    setPreferences(updated);
  };

  const toggleFavoriteDistance = (distance: number) => {
    const current = preferences.favoriteDistances;
    const updated = current.includes(distance)
      ? current.filter((d) => d !== distance)
      : [...current, distance].sort((a, b) => a - b);
    savePreferences({ favoriteDistances: updated });
  };

  const handleClearData = async () => {
    if (confirm('This will delete ALL your data. This cannot be undone. Continue?')) {
      if (confirm('Are you absolutely sure? All sessions, reps, and meets will be permanently deleted.')) {
        await db.delete();
        await db.open();
        await db.initializePreferences();
        navigate('/');
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const backup = await exportAllData();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().split('T')[0];
      const a = document.createElement('a');
      a.href = url;
      a.download = `accel-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setImportError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const text = await file.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON file');
      }

      const validation = validateBackup(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '));
      }

      if (validation.warnings.length > 0) {
        const proceed = confirm(`Warning: ${validation.warnings.join(' ')}\n\nDo you want to continue?`);
        if (!proceed) {
          setImporting(false);
          return;
        }
      }

      const confirmed = confirm(
        'This will REPLACE all existing data with the imported backup. This cannot be undone.\n\nAre you sure you want to continue?'
      );
      if (!confirmed) {
        setImporting(false);
        return;
      }

      const result = await importAllData(data as Parameters<typeof importAllData>[0]);
      if (!result.success) {
        throw new Error(result.error || 'Import failed');
      }

      const totalRecords =
        result.counts.sprintSessions +
        result.counts.liftSessions +
        result.counts.meets +
        result.counts.sessionTemplates;
      setImportSuccess(`Successfully imported ${totalRecords} sessions/meets/templates`);

      // Reload preferences
      const prefs = await db.initializePreferences();
      setPreferences(prefs);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-4 py-3 border-b border-slate-800 safe-area-inset-top">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-400 hover:text-slate-200"
          aria-label="Back"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-slate-100">
          Settings
        </h1>
        <div className="w-10" />
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 safe-area-inset-bottom">
        {/* Default Timing Type */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-slate-400 mb-3">DEFAULT TIMING</h2>
          <div className="flex gap-2">
            <button
              onClick={() => savePreferences({ defaultTimingType: 'HAND' })}
              className={`
                flex-1 px-4 py-3 rounded-lg font-medium transition-colors
                ${preferences.defaultTimingType === 'HAND'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }
              `}
            >
              HAND
            </button>
            <button
              onClick={() => savePreferences({ defaultTimingType: 'FAT' })}
              className={`
                flex-1 px-4 py-3 rounded-lg font-medium transition-colors
                ${preferences.defaultTimingType === 'FAT'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }
              `}
            >
              FAT
            </button>
          </div>
        </section>

        {/* Default Rest Time */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-slate-400 mb-3">DEFAULT REST TIME</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => savePreferences({ defaultRestTime: Math.max(60, preferences.defaultRestTime - 30) })}
              className="w-12 h-12 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xl"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <span className="text-2xl font-mono font-bold text-slate-100">
                {Math.floor(preferences.defaultRestTime / 60)}:{(preferences.defaultRestTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <button
              onClick={() => savePreferences({ defaultRestTime: Math.min(600, preferences.defaultRestTime + 30) })}
              className="w-12 h-12 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xl"
            >
              +
            </button>
          </div>
        </section>

        {/* Favorite Distances */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-slate-400 mb-3">FAVORITE DISTANCES</h2>
          <p className="text-xs text-slate-500 mb-2">
            Tap to toggle. Selected distances appear first in the picker.
          </p>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 30, 40, 50, 60, 80, 100, 150, 200, 300, 400].map((d) => (
              <button
                key={d}
                onClick={() => toggleFavoriteDistance(d)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${preferences.favoriteDistances.includes(d)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }
                `}
              >
                {d}m
              </button>
            ))}
          </div>
        </section>

        {/* Haptic Feedback */}
        <section className="mb-6">
          <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
            <span className="font-medium text-slate-200">Haptic Feedback</span>
            <button
              onClick={() => savePreferences({ hapticFeedback: !preferences.hapticFeedback })}
              className={`
                w-12 h-7 rounded-full transition-colors
                ${preferences.hapticFeedback ? 'bg-emerald-600' : 'bg-slate-600'}
              `}
            >
              <div
                className={`
                  w-5 h-5 bg-white rounded-full transform transition-transform
                  ${preferences.hapticFeedback ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </section>

        {/* Data Management */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-slate-400 mb-3">DATA MANAGEMENT</h2>
          <div className="space-y-3">
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={exporting}
              fullWidth
            >
              {exporting ? 'Exporting...' : 'Export All Data'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={handleImportClick}
              disabled={importing}
              fullWidth
            >
              {importing ? 'Importing...' : 'Import Data'}
            </Button>
            {importError && (
              <p className="text-xs text-red-400 text-center">{importError}</p>
            )}
            {importSuccess && (
              <p className="text-xs text-emerald-400 text-center">{importSuccess}</p>
            )}
            <p className="text-xs text-slate-500 text-center">
              Export your data before clearing or for backup. Import replaces all existing data.
            </p>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-red-400 mb-3">DANGER ZONE</h2>
          <Button
            variant="danger"
            onClick={handleClearData}
            fullWidth
          >
            Clear All Data
          </Button>
          <p className="text-xs text-slate-500 mt-2 text-center">
            This will permanently delete all sessions, reps, and meets.
          </p>
        </section>

        {/* Version */}
        <div className="text-center text-slate-600 text-sm py-4">
          Accel v{APP_VERSION}
        </div>
      </div>
    </div>
  );
}
