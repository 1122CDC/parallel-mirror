export interface UserProfile {
  name: string;
  birthYear: number;
  hometown: string;
  industry: string;
  jobRole: string;
  childhoodVibe: string;
}

export interface LifeAttributes {
  wealth: number;
  intellect: number;
  happiness: number;
  stress: number;
  social: number;
}

export interface SimLog {
  age: number;
  content: string;
}

export interface WorldRecord {
  id?: string;
  profile: UserProfile;
  attrs: LifeAttributes;
  logs: string; // JSON string of SimLog[]
  preStory: string;
  parallelDecision: string;
  personaLabel: string;
  summary: string;
  moments: string[];
  imageUrl?: string;
  timestamp: any;
  score?: number;
}

export type ScoreTier = 'S+' | 'A' | 'B' | 'C';

export function calculateTier(attrs: LifeAttributes): ScoreTier {
  const score = (attrs.wealth * 0.3 + attrs.intellect * 0.2 + attrs.happiness * 0.3 + (100 - attrs.stress) * 0.1 + attrs.social * 0.1);
  if (score > 85) return 'S+';
  if (score > 75) return 'A';
  if (score > 60) return 'B';
  return 'C';
}
