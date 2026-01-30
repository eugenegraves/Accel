import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewSprintModal } from '../components/sprint/NewSprintModal';
import { NewLiftModal } from '../components/lift/NewLiftModal';
import { NewMeetModal } from '../components/meet/NewMeetModal';
import { ModeIndicator } from '../components/ui/ModeIndicator';
import { useSprintSessions } from '../hooks/useSprints';
import { useLiftSessions } from '../hooks/useLifts';
import { useMeetsList } from '../hooks/useMeets';
import { db } from '../db/database';
import { formatDateShort } from '../utils/time';
import type { MeetVenue, TimingType } from '../types/models';

export function HomePage() {
  const navigate = useNavigate();

  const { sessions: sprintSessions, loading: sprintsLoading, reload: reloadSprints } = useSprintSessions();
  const { sessions: liftSessions, loading: liftsLoading, reload: reloadLifts } = useLiftSessions();
  const { meets, loading: meetsLoading, reload: reloadMeets } = useMeetsList();

  const [showNewSprintModal, setShowNewSprintModal] = useState(false);
  const [showNewLiftModal, setShowNewLiftModal] = useState(false);
  const [showNewMeetModal, setShowNewMeetModal] = useState(false);

  // Initialize preferences on mount
  useEffect(() => {
    db.initializePreferences();
  }, []);

  const handleCreateSprint = async (title?: string, location?: string, date?: string) => {
    const timestamp = Date.now();
    const id = crypto.randomUUID();
    const session = {
      id,
      date: date || new Date().toISOString().split('T')[0],
      title,
      location,
      status: 'active' as const,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Create first set
    const firstSet = {
      id: crypto.randomUUID(),
      sessionId: id,
      sequence: 1,
      createdAt: timestamp,
    };

    await db.sprintSessions.add(session);
    await db.sprintSets.add(firstSet);
    await reloadSprints();
    navigate(`/sprint/${id}`);
  };

  const handleCreateLift = async (title?: string, notes?: string, date?: string) => {
    const timestamp = Date.now();
    const id = crypto.randomUUID();
    const session = {
      id,
      date: date || new Date().toISOString().split('T')[0],
      title,
      notes,
      status: 'active' as const,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.liftSessions.add(session);
    await reloadLifts();
    navigate(`/lift/${id}`);
  };

  const handleCreateMeet = async (name: string, venue: MeetVenue, timingType: TimingType) => {
    const timestamp = Date.now();
    const id = crypto.randomUUID();
    const meet = {
      id,
      date: new Date().toISOString().split('T')[0],
      name,
      venue,
      timingType,
      status: 'active' as const,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.meets.add(meet);
    await reloadMeets();
    navigate(`/meet/${id}`);
  };

  const recentSprints = sprintSessions.slice(0, 5);
  const recentLifts = liftSessions.slice(0, 5);
  const recentMeets = meets.slice(0, 5);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-800 safe-area-inset-top">
        <h1 className="text-2xl font-bold text-slate-100">Accel</h1>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="p-2 text-slate-400 hover:text-slate-200"
          aria-label="Settings"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 safe-area-inset-bottom">
        {/* New Session Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button
            onClick={() => setShowNewSprintModal(true)}
            className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-200">Sprint</span>
          </button>

          <button
            onClick={() => setShowNewLiftModal(true)}
            className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-200">Lift</span>
          </button>

          <button
            onClick={() => setShowNewMeetModal(true)}
            className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-200">Meet</span>
          </button>
        </div>

        {/* Tier 2 Navigation */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button
            onClick={() => navigate('/review/sprints')}
            className="flex flex-col items-center gap-1.5 p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium text-slate-300">Review</span>
          </button>

          <button
            onClick={() => navigate('/insights')}
            className="flex flex-col items-center gap-1.5 p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs font-medium text-slate-300">Insights</span>
          </button>

          <button
            onClick={() => navigate('/templates')}
            className="flex flex-col items-center gap-1.5 p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            <span className="text-xs font-medium text-slate-300">Templates</span>
          </button>
        </div>

        {/* Recent Sprint Sessions */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-slate-400 mb-3">RECENT SPRINTS</h2>
          {sprintsLoading ? (
            <p className="text-slate-600 text-sm">Loading...</p>
          ) : recentSprints.length > 0 ? (
            <div className="space-y-2">
              {recentSprints.map((session) => (
                <button
                  key={session.id}
                  onClick={() => navigate(`/sprint/${session.id}`)}
                  className="w-full flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-200">
                      {session.title || 'Sprint Session'}
                    </p>
                    <p className="text-sm text-slate-500">{formatDateShort(session.date)}</p>
                  </div>
                  <ModeIndicator status={session.status} compact />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-sm">No sprint sessions yet</p>
          )}
        </section>

        {/* Recent Lift Sessions */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-slate-400 mb-3">RECENT LIFTS</h2>
          {liftsLoading ? (
            <p className="text-slate-600 text-sm">Loading...</p>
          ) : recentLifts.length > 0 ? (
            <div className="space-y-2">
              {recentLifts.map((session) => (
                <button
                  key={session.id}
                  onClick={() => navigate(`/lift/${session.id}`)}
                  className="w-full flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-200">
                      {session.title || 'Lift Session'}
                    </p>
                    <p className="text-sm text-slate-500">{formatDateShort(session.date)}</p>
                  </div>
                  <ModeIndicator status={session.status} compact />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-sm">No lift sessions yet</p>
          )}
        </section>

        {/* Recent Meets */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-slate-400 mb-3">RECENT MEETS</h2>
          {meetsLoading ? (
            <p className="text-slate-600 text-sm">Loading...</p>
          ) : recentMeets.length > 0 ? (
            <div className="space-y-2">
              {recentMeets.map((meet) => (
                <button
                  key={meet.id}
                  onClick={() => navigate(`/meet/${meet.id}`)}
                  className="w-full flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-200">{meet.name}</p>
                    <p className="text-sm text-slate-500">
                      {formatDateShort(meet.date)} · {meet.venue} · {meet.timingType}
                    </p>
                  </div>
                  <ModeIndicator status={meet.status} compact />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-sm">No meets yet</p>
          )}
        </section>
      </div>

      {/* Modals */}
      <NewSprintModal
        isOpen={showNewSprintModal}
        onClose={() => setShowNewSprintModal(false)}
        onSubmit={handleCreateSprint}
      />
      <NewLiftModal
        isOpen={showNewLiftModal}
        onClose={() => setShowNewLiftModal(false)}
        onSubmit={handleCreateLift}
      />
      <NewMeetModal
        isOpen={showNewMeetModal}
        onClose={() => setShowNewMeetModal(false)}
        onSubmit={handleCreateMeet}
      />
    </div>
  );
}
