import Dexie, { type Table } from 'dexie';
import type {
  SprintSession,
  SprintSet,
  SprintRep,
  LiftSession,
  LiftSet,
  LiftRep,
  Meet,
  Race,
  UserPreferences,
} from '../types/models';
import { DEFAULT_PREFERENCES } from '../types/models';
import type {
  SessionTemplate,
  SprintTemplateSet,
  SprintTemplateRep,
  LiftTemplateSet,
} from '../types/templates';

export class AccelDatabase extends Dexie {
  sprintSessions!: Table<SprintSession>;
  sprintSets!: Table<SprintSet>;
  sprintReps!: Table<SprintRep>;

  liftSessions!: Table<LiftSession>;
  liftSets!: Table<LiftSet>;
  liftReps!: Table<LiftRep>;

  meets!: Table<Meet>;
  races!: Table<Race>;

  preferences!: Table<UserPreferences>;

  // Template tables
  sessionTemplates!: Table<SessionTemplate>;
  sprintTemplateSets!: Table<SprintTemplateSet>;
  sprintTemplateReps!: Table<SprintTemplateRep>;
  liftTemplateSets!: Table<LiftTemplateSet>;

  constructor() {
    super('AccelDB');

    this.version(1).stores({
      // Sprint tables
      sprintSessions: 'id, date, status, createdAt',
      sprintSets: 'id, sessionId, sequence',
      sprintReps: 'id, setId, sequence, distance',

      // Lift tables
      liftSessions: 'id, date, status, createdAt',
      liftSets: 'id, sessionId, sequence, exercise',
      liftReps: 'id, setId, sequence',

      // Meet tables
      meets: 'id, date, status, createdAt',
      races: 'id, meetId, sequence, distance',

      // Preferences (single record)
      preferences: 'id',
    });

    // v2: Add updatedAt fields to SprintRep, LiftSet, LiftRep
    // Allow null velocity in LiftRep, remove timing type lock
    this.version(2).stores({
      // Sprint tables
      sprintSessions: 'id, date, status, createdAt',
      sprintSets: 'id, sessionId, sequence',
      sprintReps: 'id, setId, sequence, distance',

      // Lift tables
      liftSessions: 'id, date, status, createdAt',
      liftSets: 'id, sessionId, sequence, exercise',
      liftReps: 'id, setId, sequence',

      // Meet tables
      meets: 'id, date, status, createdAt',
      races: 'id, meetId, sequence, distance',

      // Preferences (single record)
      preferences: 'id',
    });

    // v3: Add template tables for session templates
    this.version(3).stores({
      // Sprint tables (unchanged)
      sprintSessions: 'id, date, status, createdAt',
      sprintSets: 'id, sessionId, sequence',
      sprintReps: 'id, setId, sequence, distance',

      // Lift tables (unchanged)
      liftSessions: 'id, date, status, createdAt',
      liftSets: 'id, sessionId, sequence, exercise',
      liftReps: 'id, setId, sequence',

      // Meet tables (unchanged)
      meets: 'id, date, status, createdAt',
      races: 'id, meetId, sequence, distance',

      // Preferences (unchanged)
      preferences: 'id',

      // Template tables (new)
      sessionTemplates: 'id, type, name, createdAt, lastUsedAt',
      sprintTemplateSets: 'id, templateId, sequence',
      sprintTemplateReps: 'id, setId, sequence',
      liftTemplateSets: 'id, templateId, sequence',
    });
  }

  // Initialize default preferences if not exists
  async initializePreferences(): Promise<UserPreferences> {
    const existing = await this.preferences.get('preferences');
    if (!existing) {
      await this.preferences.add(DEFAULT_PREFERENCES);
      return DEFAULT_PREFERENCES;
    }
    return existing;
  }
}

// Singleton instance
export const db = new AccelDatabase();

// --- Sprint Session Helpers ---

export async function getSprintSessionWithData(sessionId: string) {
  const session = await db.sprintSessions.get(sessionId);
  if (!session) return null;

  const sets = await db.sprintSets
    .where('sessionId')
    .equals(sessionId)
    .sortBy('sequence');

  const setIds = sets.map((s) => s.id);
  const reps = await db.sprintReps
    .where('setId')
    .anyOf(setIds)
    .toArray();

  // Group reps by setId
  const repsBySet = new Map<string, SprintRep[]>();
  for (const rep of reps) {
    const existing = repsBySet.get(rep.setId) || [];
    existing.push(rep);
    repsBySet.set(rep.setId, existing);
  }

  // Sort reps within each set
  for (const [setId, setReps] of repsBySet) {
    setReps.sort((a, b) => a.sequence - b.sequence);
    repsBySet.set(setId, setReps);
  }

  return { session, sets, repsBySet };
}

export async function getAllSprintRepsForSession(sessionId: string): Promise<SprintRep[]> {
  const sets = await db.sprintSets
    .where('sessionId')
    .equals(sessionId)
    .toArray();

  const setIds = sets.map((s) => s.id);
  return db.sprintReps.where('setId').anyOf(setIds).toArray();
}

// --- Lift Session Helpers ---

export async function getLiftSessionWithData(sessionId: string) {
  const session = await db.liftSessions.get(sessionId);
  if (!session) return null;

  const sets = await db.liftSets
    .where('sessionId')
    .equals(sessionId)
    .sortBy('sequence');

  const setIds = sets.map((s) => s.id);
  const reps = await db.liftReps
    .where('setId')
    .anyOf(setIds)
    .toArray();

  // Group reps by setId
  const repsBySet = new Map<string, LiftRep[]>();
  for (const rep of reps) {
    const existing = repsBySet.get(rep.setId) || [];
    existing.push(rep);
    repsBySet.set(rep.setId, existing);
  }

  // Sort reps within each set
  for (const [setId, setReps] of repsBySet) {
    setReps.sort((a, b) => a.sequence - b.sequence);
    repsBySet.set(setId, setReps);
  }

  return { session, sets, repsBySet };
}

// --- Meet Helpers ---

export async function getMeetWithRaces(meetId: string) {
  const meet = await db.meets.get(meetId);
  if (!meet) return null;

  const races = await db.races
    .where('meetId')
    .equals(meetId)
    .sortBy('sequence');

  return { meet, races };
}

// --- Distance History Helpers ---

export async function getRepsByDistance(distance: number): Promise<SprintRep[]> {
  return db.sprintReps
    .where('distance')
    .equals(distance)
    .toArray();
}

export async function getBestRepByDistance(): Promise<Map<number, SprintRep>> {
  const allReps = await db.sprintReps.toArray();
  const best = new Map<number, SprintRep>();

  for (const rep of allReps) {
    const current = best.get(rep.distance);
    if (!current || rep.time < current.time) {
      best.set(rep.distance, rep);
    }
  }

  return best;
}

// --- Recent Sessions ---

export async function getRecentSprintSessions(limit = 10): Promise<SprintSession[]> {
  return db.sprintSessions
    .orderBy('createdAt')
    .reverse()
    .limit(limit)
    .toArray();
}

export async function getRecentLiftSessions(limit = 10): Promise<LiftSession[]> {
  return db.liftSessions
    .orderBy('createdAt')
    .reverse()
    .limit(limit)
    .toArray();
}

export async function getRecentMeets(limit = 10): Promise<Meet[]> {
  return db.meets
    .orderBy('createdAt')
    .reverse()
    .limit(limit)
    .toArray();
}

// --- Active Sessions ---

export async function getActiveSprintSession(): Promise<SprintSession | undefined> {
  return db.sprintSessions.where('status').equals('active').first();
}

export async function getActiveLiftSession(): Promise<LiftSession | undefined> {
  return db.liftSessions.where('status').equals('active').first();
}

export async function getActiveMeet(): Promise<Meet | undefined> {
  return db.meets.where('status').equals('active').first();
}

// --- Trend Query Helpers ---

export interface SprintRepWithSession extends SprintRep {
  sessionDate: string;
}

export async function getSprintRepsByDistanceWithDates(
  distance: number
): Promise<SprintRepWithSession[]> {
  const reps = await db.sprintReps.where('distance').equals(distance).toArray();

  // Get all set IDs
  const setIds = [...new Set(reps.map(r => r.setId))];

  // Get all sets
  const sets = await db.sprintSets.where('id').anyOf(setIds).toArray();
  const setToSession = new Map(sets.map(s => [s.id, s.sessionId]));

  // Get all session IDs
  const sessionIds = [...new Set(sets.map(s => s.sessionId))];

  // Get all sessions
  const sessions = await db.sprintSessions.where('id').anyOf(sessionIds).toArray();
  const sessionDates = new Map(sessions.map(s => [s.id, s.date]));

  // Combine data
  return reps.map(rep => ({
    ...rep,
    sessionDate: sessionDates.get(setToSession.get(rep.setId) || '') || '',
  })).filter(rep => rep.sessionDate);
}

export interface LiftSetWithSession extends LiftSet {
  sessionDate: string;
  reps: LiftRep[];
}

export async function getLiftSetsByExercise(
  exercise: string
): Promise<LiftSetWithSession[]> {
  const sets = await db.liftSets.where('exercise').equals(exercise).toArray();

  // Get session dates
  const sessionIds = [...new Set(sets.map(s => s.sessionId))];
  const sessions = await db.liftSessions.where('id').anyOf(sessionIds).toArray();
  const sessionDates = new Map(sessions.map(s => [s.id, s.date]));

  // Get reps for all sets
  const setIds = sets.map(s => s.id);
  const allReps = await db.liftReps.where('setId').anyOf(setIds).toArray();
  const repsBySet = new Map<string, LiftRep[]>();
  for (const rep of allReps) {
    const existing = repsBySet.get(rep.setId) || [];
    existing.push(rep);
    repsBySet.set(rep.setId, existing);
  }

  return sets.map(set => ({
    ...set,
    sessionDate: sessionDates.get(set.sessionId) || '',
    reps: (repsBySet.get(set.id) || []).sort((a, b) => a.sequence - b.sequence),
  })).filter(set => set.sessionDate);
}

export interface RaceWithMeet extends Race {
  meetDate: string;
  meetName: string;
  venue: 'indoor' | 'outdoor';
  timingType: 'HAND' | 'FAT';
}

export async function getRacesByDistance(distance: number): Promise<RaceWithMeet[]> {
  const races = await db.races.where('distance').equals(distance).toArray();

  // Get meet info
  const meetIds = [...new Set(races.map(r => r.meetId))];
  const meets = await db.meets.where('id').anyOf(meetIds).toArray();
  const meetInfo = new Map(meets.map(m => [m.id, { date: m.date, name: m.name, venue: m.venue, timingType: m.timingType }]));

  return races.map(race => {
    const info = meetInfo.get(race.meetId);
    return {
      ...race,
      meetDate: info?.date || '',
      meetName: info?.name || '',
      venue: info?.venue || 'outdoor',
      timingType: info?.timingType || 'FAT',
    };
  }).filter(race => race.meetDate);
}

export async function getAllDistancesWithReps(): Promise<number[]> {
  const reps = await db.sprintReps.toArray();
  const distances = [...new Set(reps.map(r => r.distance))];
  return distances.sort((a, b) => a - b);
}

export async function getAllExercisesWithSets(): Promise<string[]> {
  const sets = await db.liftSets.toArray();
  const exercises = [...new Set(sets.map(s => s.exercise))];
  return exercises.sort();
}

export async function getAllRaceDistances(): Promise<number[]> {
  const races = await db.races.toArray();
  const distances = [...new Set(races.map(r => r.distance))];
  return distances.sort((a, b) => a - b);
}

// --- Template Helpers ---

export async function getSprintTemplateWithData(templateId: string) {
  const template = await db.sessionTemplates.get(templateId);
  if (!template || template.type !== 'sprint') return null;

  const sets = await db.sprintTemplateSets
    .where('templateId')
    .equals(templateId)
    .sortBy('sequence');

  const setIds = sets.map(s => s.id);
  const reps = await db.sprintTemplateReps
    .where('setId')
    .anyOf(setIds)
    .toArray();

  // Group reps by setId
  const repsBySet = new Map<string, SprintTemplateRep[]>();
  for (const rep of reps) {
    const existing = repsBySet.get(rep.setId) || [];
    existing.push(rep);
    repsBySet.set(rep.setId, existing);
  }

  // Sort reps within each set
  for (const [setId, setReps] of repsBySet) {
    setReps.sort((a, b) => a.sequence - b.sequence);
    repsBySet.set(setId, setReps);
  }

  return { template, sets, repsBySet };
}

export async function getLiftTemplateWithData(templateId: string) {
  const template = await db.sessionTemplates.get(templateId);
  if (!template || template.type !== 'lift') return null;

  const sets = await db.liftTemplateSets
    .where('templateId')
    .equals(templateId)
    .sortBy('sequence');

  return { template, sets };
}

export async function getAllTemplates(): Promise<SessionTemplate[]> {
  return db.sessionTemplates.orderBy('lastUsedAt').reverse().toArray();
}

export async function getTemplatesByType(type: 'sprint' | 'lift'): Promise<SessionTemplate[]> {
  return db.sessionTemplates
    .where('type')
    .equals(type)
    .reverse()
    .sortBy('lastUsedAt');
}
