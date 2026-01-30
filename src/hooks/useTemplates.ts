import { useState, useEffect, useCallback } from 'react';
import {
  db,
  getSprintTemplateWithData,
  getLiftTemplateWithData,
  getAllTemplates,
  getSprintSessionWithData,
  getLiftSessionWithData,
} from '../db/database';
import type {
  SessionTemplate,
  SprintTemplateSet,
  SprintTemplateRep,
  LiftTemplateSet,
  SprintTemplateWithData,
  LiftTemplateWithData,
} from '../types/templates';
import { generateId } from '../utils/uuid';
import { now } from '../utils/time';

export function useTemplates() {
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllTemplates();
    setTemplates(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deleteTemplate = useCallback(async (templateId: string): Promise<void> => {
    const template = await db.sessionTemplates.get(templateId);
    if (!template) return;

    if (template.type === 'sprint') {
      // Delete sprint template sets and reps
      const sets = await db.sprintTemplateSets
        .where('templateId')
        .equals(templateId)
        .toArray();
      const setIds = sets.map(s => s.id);

      await db.transaction(
        'rw',
        [db.sessionTemplates, db.sprintTemplateSets, db.sprintTemplateReps],
        async () => {
          await db.sprintTemplateReps.where('setId').anyOf(setIds).delete();
          await db.sprintTemplateSets.where('templateId').equals(templateId).delete();
          await db.sessionTemplates.delete(templateId);
        }
      );
    } else {
      // Delete lift template sets
      await db.transaction(
        'rw',
        [db.sessionTemplates, db.liftTemplateSets],
        async () => {
          await db.liftTemplateSets.where('templateId').equals(templateId).delete();
          await db.sessionTemplates.delete(templateId);
        }
      );
    }

    await load();
  }, [load]);

  return {
    templates,
    loading,
    reload: load,
    deleteTemplate,
  };
}

export function useSprintTemplate(templateId: string | null) {
  const [template, setTemplate] = useState<SprintTemplateWithData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!templateId) {
      setTemplate(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getSprintTemplateWithData(templateId);
    setTemplate(data);
    setLoading(false);
  }, [templateId]);

  useEffect(() => {
    load();
  }, [load]);

  // Create a template from an existing session
  const createFromSession = useCallback(
    async (sessionId: string, name: string, description?: string): Promise<SessionTemplate> => {
      const sessionData = await getSprintSessionWithData(sessionId);
      if (!sessionData) throw new Error('Session not found');

      const timestamp = now();
      const newTemplateId = generateId();

      const newTemplate: SessionTemplate = {
        id: newTemplateId,
        name,
        type: 'sprint',
        description,
        createdAt: timestamp,
        updatedAt: timestamp,
        useCount: 0,
      };

      // Create template sets and reps from session data
      const templateSets: SprintTemplateSet[] = [];
      const templateReps: SprintTemplateRep[] = [];

      for (const set of sessionData.sets) {
        const newSetId = generateId();
        templateSets.push({
          id: newSetId,
          templateId: newTemplateId,
          sequence: set.sequence,
          name: set.name,
        });

        const reps = sessionData.repsBySet.get(set.id) || [];
        for (const rep of reps) {
          templateReps.push({
            id: generateId(),
            setId: newSetId,
            sequence: rep.sequence,
            distance: rep.distance,
            timingType: rep.timingType,
            restAfter: rep.restAfter,
            isFly: rep.isFly,
            flyInDistance: rep.flyInDistance,
          });
        }
      }

      await db.transaction(
        'rw',
        [db.sessionTemplates, db.sprintTemplateSets, db.sprintTemplateReps],
        async () => {
          await db.sessionTemplates.add(newTemplate);
          await db.sprintTemplateSets.bulkAdd(templateSets);
          await db.sprintTemplateReps.bulkAdd(templateReps);
        }
      );

      return newTemplate;
    },
    []
  );

  // Apply template to create a new session
  const applyTemplate = useCallback(
    async (): Promise<string> => {
      if (!template) throw new Error('No template loaded');

      const timestamp = now();
      const newSessionId = generateId();

      // Create session
      const newSession = {
        id: newSessionId,
        date: new Date().toISOString().split('T')[0],
        title: template.template.name,
        status: 'active' as const,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Create sets and reps from template
      const newSets: Array<{
        id: string;
        sessionId: string;
        sequence: number;
        name?: string;
        createdAt: number;
      }> = [];
      const newReps: Array<{
        id: string;
        setId: string;
        sequence: number;
        distance: number;
        time: number;
        timingType: string;
        restAfter: number;
        isFly: boolean;
        flyInDistance?: number;
        createdAt: number;
      }> = [];

      for (const set of template.sets) {
        const newSetId = generateId();
        newSets.push({
          id: newSetId,
          sessionId: newSessionId,
          sequence: set.sequence,
          name: set.name,
          createdAt: timestamp,
        });

        const reps = template.repsBySet.get(set.id) || [];
        for (const rep of reps) {
          newReps.push({
            id: generateId(),
            setId: newSetId,
            sequence: rep.sequence,
            distance: rep.distance,
            time: 0, // Will be filled by user
            timingType: rep.timingType,
            restAfter: rep.restAfter,
            isFly: rep.isFly,
            flyInDistance: rep.flyInDistance,
            createdAt: timestamp,
          });
        }
      }

      // Update template use count and last used
      await db.transaction(
        'rw',
        [db.sessionTemplates, db.sprintSessions, db.sprintSets, db.sprintReps],
        async () => {
          await db.sprintSessions.add(newSession);
          await db.sprintSets.bulkAdd(newSets);
          // Note: We don't add pre-filled reps - users fill them in during the session
          await db.sessionTemplates.update(template.template.id, {
            lastUsedAt: timestamp,
            useCount: template.template.useCount + 1,
            updatedAt: timestamp,
          });
        }
      );

      return newSessionId;
    },
    [template]
  );

  return {
    template,
    loading,
    reload: load,
    createFromSession,
    applyTemplate,
  };
}

export function useLiftTemplate(templateId: string | null) {
  const [template, setTemplate] = useState<LiftTemplateWithData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!templateId) {
      setTemplate(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getLiftTemplateWithData(templateId);
    setTemplate(data);
    setLoading(false);
  }, [templateId]);

  useEffect(() => {
    load();
  }, [load]);

  // Create a template from an existing session
  const createFromSession = useCallback(
    async (sessionId: string, name: string, description?: string): Promise<SessionTemplate> => {
      const sessionData = await getLiftSessionWithData(sessionId);
      if (!sessionData) throw new Error('Session not found');

      const timestamp = now();
      const newTemplateId = generateId();

      const newTemplate: SessionTemplate = {
        id: newTemplateId,
        name,
        type: 'lift',
        description,
        createdAt: timestamp,
        updatedAt: timestamp,
        useCount: 0,
      };

      // Create template sets from session data
      const templateSets: LiftTemplateSet[] = [];

      for (const set of sessionData.sets) {
        const reps = sessionData.repsBySet.get(set.id) || [];
        templateSets.push({
          id: generateId(),
          templateId: newTemplateId,
          sequence: set.sequence,
          exercise: set.exercise,
          load: set.load,
          repCount: reps.length,
        });
      }

      await db.transaction(
        'rw',
        [db.sessionTemplates, db.liftTemplateSets],
        async () => {
          await db.sessionTemplates.add(newTemplate);
          await db.liftTemplateSets.bulkAdd(templateSets);
        }
      );

      return newTemplate;
    },
    []
  );

  // Apply template to create a new session
  const applyTemplate = useCallback(
    async (): Promise<string> => {
      if (!template) throw new Error('No template loaded');

      const timestamp = now();
      const newSessionId = generateId();

      // Create session
      const newSession = {
        id: newSessionId,
        date: new Date().toISOString().split('T')[0],
        title: template.template.name,
        status: 'active' as const,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Create sets from template
      const newSets: Array<{
        id: string;
        sessionId: string;
        sequence: number;
        exercise: string;
        load: number;
        createdAt: number;
      }> = [];

      for (const set of template.sets) {
        newSets.push({
          id: generateId(),
          sessionId: newSessionId,
          sequence: set.sequence,
          exercise: set.exercise,
          load: set.load,
          createdAt: timestamp,
        });
      }

      // Update template use count and last used
      await db.transaction(
        'rw',
        [db.sessionTemplates, db.liftSessions, db.liftSets],
        async () => {
          await db.liftSessions.add(newSession);
          await db.liftSets.bulkAdd(newSets);
          await db.sessionTemplates.update(template.template.id, {
            lastUsedAt: timestamp,
            useCount: template.template.useCount + 1,
            updatedAt: timestamp,
          });
        }
      );

      return newSessionId;
    },
    [template]
  );

  return {
    template,
    loading,
    reload: load,
    createFromSession,
    applyTemplate,
  };
}
