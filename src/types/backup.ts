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
} from './models';
import type {
  SessionTemplate,
  SprintTemplateSet,
  SprintTemplateRep,
  LiftTemplateSet,
} from './templates';

export interface AccelBackupData {
  sprintSessions: SprintSession[];
  sprintSets: SprintSet[];
  sprintReps: SprintRep[];
  liftSessions: LiftSession[];
  liftSets: LiftSet[];
  liftReps: LiftRep[];
  meets: Meet[];
  races: Race[];
  preferences: UserPreferences[];
  sessionTemplates: SessionTemplate[];
  sprintTemplateSets: SprintTemplateSet[];
  sprintTemplateReps: SprintTemplateRep[];
  liftTemplateSets: LiftTemplateSet[];
}

export interface AccelBackup {
  version: string;
  exportedAt: string;
  databaseVersion: number;
  data: AccelBackupData;
}

export interface ImportResult {
  success: boolean;
  counts: {
    sprintSessions: number;
    sprintSets: number;
    sprintReps: number;
    liftSessions: number;
    liftSets: number;
    liftReps: number;
    meets: number;
    races: number;
    preferences: number;
    sessionTemplates: number;
    sprintTemplateSets: number;
    sprintTemplateReps: number;
    liftTemplateSets: number;
  };
  error?: string;
}

export interface BackupValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
