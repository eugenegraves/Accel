import type { TimingType, FlyInDistance } from './models';

// Template type discriminator
export type TemplateType = 'sprint' | 'lift';

// Base template metadata
export interface SessionTemplate {
  id: string;
  name: string;
  type: TemplateType;
  description?: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
  useCount: number;
}

// --- Sprint Template Structure ---

export interface SprintTemplateSet {
  id: string;
  templateId: string;
  sequence: number;
  name?: string;
}

export interface SprintTemplateRep {
  id: string;
  setId: string;
  sequence: number;
  distance: number;
  timingType: TimingType;
  restAfter: number;
  isFly: boolean;
  flyInDistance?: FlyInDistance;
}

// --- Lift Template Structure ---

export interface LiftTemplateSet {
  id: string;
  templateId: string;
  sequence: number;
  exercise: string;
  load: number;
  repCount: number;
}

// --- Helper Types for Template Creation ---

export interface SprintTemplateInput {
  name: string;
  description?: string;
}

export interface LiftTemplateInput {
  name: string;
  description?: string;
}

// --- Full Template with Data ---

export interface SprintTemplateWithData {
  template: SessionTemplate;
  sets: SprintTemplateSet[];
  repsBySet: Map<string, SprintTemplateRep[]>;
}

export interface LiftTemplateWithData {
  template: SessionTemplate;
  sets: LiftTemplateSet[];
}
