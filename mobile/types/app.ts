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
export type BriefFeedbackSignal = 'like' | 'useful' | 'not_relevant';
export type BriefListState = 'ready' | 'empty' | 'offline' | 'disabled';
export type BriefSyncStatus = 'idle' | 'offline' | 'ready';

/**
 * Phase of the active (or most-recent) sync operation.
 * This is transient — it is NOT persisted to AsyncStorage.
 *
 * idle       — no operation in flight; cache is current or never requested
 * refreshing — async fetch in progress
 * error      — last fetch failed; cache may be stale
 */
export type SyncPhase = 'idle' | 'refreshing' | 'error';

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
  wifiOnlySync: boolean;
  notificationsEnabled: boolean;
}

export interface OnboardingDraft {
  topicIds: string[];
  customInterests: string;
  region: string;
  coverage: CoveragePreference;
  textSize: TextSizePreset;
}

export interface EvidenceSource {
  id: string;
  title: string;
  publisher: string;
  publishedAt: string;
}

export interface ConfidenceExplanation {
  band: 'low' | 'medium' | 'high';
  summary: string;
}

export interface BriefItem {
  id: string;
  headline: string;
  summary: string;
  detail: string;
  topicTags: string[];
  localityLabel: string;
  localityScope: CoveragePreference;
  freshnessLabel: string;
  publishedAt: string;
  updatedAt: string;
  confidence: ConfidenceExplanation;
  sources: EvidenceSource[];
  evidenceNote: string;
}

export interface BriefFeedbackEvent {
  briefItemId: string;
  itemHeadline: string;
  topicTags: string[];
  signal: BriefFeedbackSignal;
  timestamp: string;
  rationale: string;
}

export interface BriefCache {
  items: BriefItem[];
  generatedAt: string | null;
  lastSyncAt: string | null;
  isOffline: boolean;
  mockSource: 'seeded-local';
}

export interface AppState {
  hydrated: boolean;
  reduceMotionEnabled: boolean;
  onboardingComplete: boolean;
  selectedCountryCode: string | null;
  onboarding: OnboardingDraft;
  extractedProfile: ExtractedProfile | null;
  privacy: PrivacySettings;
  briefCache: BriefCache;
  feedbackHistory: BriefFeedbackEvent[];
  /** Transient — not persisted. Tracks the in-progress or last-completed sync. */
  syncPhase: SyncPhase;
  /** Transient — not persisted. Human-readable message when syncPhase === 'error'. */
  syncError: string | null;
}
