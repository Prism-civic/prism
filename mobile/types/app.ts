import type { TextSizePreset } from '@/theme';

export type PulseOrbState =
  | 'idle'
  | 'syncing'
  | 'retrieved'
  | 'processing'
  | 'degraded'
  | 'ready';

export type CoveragePreference = 'local' | 'national' | 'global';
export type TopicWeight = 'low' | 'medium' | 'high';

export interface TopicProfile {
  id: string;
  label: string;
  weight: TopicWeight;
  reason: string;
}

export interface ExtractedProfile {
  summary: string;
  topics: TopicProfile[];
  coverage: CoveragePreference;
  region: string;
}

export interface PrivacySettings {
  shareSanitizedSummaries: boolean;
  allowMorningBrief: boolean;
  allowEveningSync: boolean;
}

export interface OnboardingDraft {
  topicIds: string[];
  customInterests: string;
  region: string;
  coverage: CoveragePreference;
  textSize: TextSizePreset;
}

export interface AppState {
  hydrated: boolean;
  reduceMotionEnabled: boolean;
  onboardingComplete: boolean;
  selectedCountryCode: string | null;
  onboarding: OnboardingDraft;
  extractedProfile: ExtractedProfile | null;
  privacy: PrivacySettings;
}
