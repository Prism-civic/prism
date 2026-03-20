import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo } from 'react-native';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { briefRepository, createInitialBriefCache } from '@/lib/briefs';
import { createSyncAdapter } from '@/lib/sync';
import { buildExtractedProfile } from '@/lib/profile';
import { getTypography, type TextSizePreset } from '@/theme';
import type {
  AppState,
  BriefFeedbackSignal,
  BriefItem,
  CoveragePreference,
  ExtractedProfile,
  OnboardingDraft,
  PrivacySettings,
} from '@/types/app';

const STORAGE_KEY = 'prism.phone-app.state.v1';

// Singleton adapter — swap createSyncAdapter() return value in lib/sync.ts
// to change the upstream source without touching this file.
const syncAdapter = createSyncAdapter();

const defaultOnboarding: OnboardingDraft = {
  topicIds: ['cost', 'health'],
  customInterests: '',
  region: '',
  coverage: 'national',
  textSize: 'medium',
};

const defaultPrivacy: PrivacySettings = {
  shareSanitizedSummaries: false,
  allowMorningBrief: true,
  allowEveningSync: true,
  wifiOnlySync: true,
  notificationsEnabled: true,
};

const defaultState: AppState = {
  hydrated: false,
  reduceMotionEnabled: false,
  onboardingComplete: false,
  selectedCountryCode: null,
  onboarding: defaultOnboarding,
  extractedProfile: null,
  privacy: defaultPrivacy,
  briefCache: createInitialBriefCache(null),
  feedbackHistory: [],
  // Transient — reset on every app launch
  syncPhase: 'idle',
  syncError: null,
};

interface AppStateContextValue {
  state: AppState;
  typography: ReturnType<typeof getTypography>;
  setCountry(code: string): void;
  updateOnboarding(patch: Partial<OnboardingDraft>): void;
  setTextSize(textSize: TextSizePreset): void;
  generateProfile(): ExtractedProfile;
  updateProfile(profile: ExtractedProfile): void;
  updatePrivacy(patch: Partial<PrivacySettings>): void;
  /** Fire-and-forget. Tracks progress via state.syncPhase and state.syncError. */
  refreshBrief(): void;
  getBriefItem(itemId: string): BriefItem | undefined;
  submitBriefFeedback(itemId: string, signal: BriefFeedbackSignal): void;
  completeOnboarding(): void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(defaultState);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted) {
          return;
        }

        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          setState((current) => ({
            ...current,
            ...parsed,
            onboarding: {
              ...defaultOnboarding,
              ...parsed.onboarding,
            },
            privacy: {
              ...defaultPrivacy,
              ...parsed.privacy,
            },
            briefCache: parsed.briefCache ?? current.briefCache,
            feedbackHistory: parsed.feedbackHistory ?? current.feedbackHistory,
            // Always reset transient fields on hydration
            syncPhase: 'idle',
            syncError: null,
            hydrated: true,
          }));
          return;
        }

        setState((current) => ({ ...current, hydrated: true }));
      })
      .catch(() => {
        if (mounted) {
          setState((current) => ({ ...current, hydrated: true }));
        }
      });

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setState((current) => ({ ...current, reduceMotionEnabled: enabled }));
        }
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setState((current) => ({ ...current, reduceMotionEnabled: enabled }));
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }

    // syncPhase and syncError are intentionally excluded — they are transient.
    AsyncStorage.setItem(
      STORAGE_KEY,
        JSON.stringify({
          onboardingComplete: state.onboardingComplete,
          selectedCountryCode: state.selectedCountryCode,
          onboarding: state.onboarding,
          extractedProfile: state.extractedProfile,
          privacy: state.privacy,
          briefCache: state.briefCache,
          feedbackHistory: state.feedbackHistory,
        }),
    ).catch(() => undefined);
  }, [
    state.briefCache,
    state.extractedProfile,
    state.feedbackHistory,
    state.hydrated,
    state.onboarding,
    state.onboardingComplete,
    state.privacy,
    state.selectedCountryCode,
  ]);

  const value = useMemo<AppStateContextValue>(() => ({
    state,
    typography: getTypography(state.onboarding.textSize),
    setCountry(code) {
      setState((current) => ({ ...current, selectedCountryCode: code }));
    },
    updateOnboarding(patch) {
      setState((current) => ({
        ...current,
        onboarding: {
          ...current.onboarding,
          ...patch,
        },
      }));
    },
    setTextSize(textSize) {
      setState((current) => ({
        ...current,
        onboarding: {
          ...current.onboarding,
          textSize,
        },
      }));
    },
    generateProfile() {
      const profile = buildExtractedProfile(state.onboarding);
      setState((current) => ({
        ...current,
        extractedProfile: profile,
        briefCache: briefRepository.loadLatestBrief(profile),
      }));
      return profile;
    },
    updateProfile(profile) {
      setState((current) => ({
        ...current,
        extractedProfile: profile,
        briefCache: briefRepository.loadLatestBrief(profile),
      }));
    },
    updatePrivacy(patch) {
      setState((current) => ({
        ...current,
        privacy: {
          ...current.privacy,
          ...patch,
        },
      }));
    },
    refreshBrief() {
      // Mark in-flight immediately so UI can respond.
      setState((current) => ({ ...current, syncPhase: 'refreshing', syncError: null }));

      // Capture the current profile so the async call uses a consistent snapshot.
      const profileSnapshot = state.extractedProfile;

      syncAdapter
        .fetchBrief(profileSnapshot)
        .then((result) => {
          if (result.ok && result.cache) {
            setState((current) => ({
              ...current,
              briefCache: result.cache!,
              syncPhase: 'idle',
              syncError: null,
            }));
          } else {
            setState((current) => ({
              ...current,
              syncPhase: 'error',
              syncError: result.errorMessage ?? 'Sync did not complete. Cached content is shown.',
            }));
          }
        })
        .catch(() => {
          setState((current) => ({
            ...current,
            syncPhase: 'error',
            syncError: 'Could not reach the upstream source. Cached content is shown.',
          }));
        });
    },
    getBriefItem(itemId) {
      return state.briefCache.items.find((item) => item.id === itemId);
    },
    submitBriefFeedback(itemId, signal) {
      setState((current) => {
        const item = current.briefCache.items.find((entry) => entry.id === itemId);

        if (!item) {
          return current;
        }

        const { event, profile } = briefRepository.recordFeedback(current.extractedProfile, item, signal);

        return {
          ...current,
          extractedProfile: profile,
          feedbackHistory: [
            event,
            ...current.feedbackHistory.filter((entry) => entry.briefItemId !== itemId),
          ].slice(0, 20),
          briefCache: briefRepository.loadLatestBrief(profile),
        };
      });
    },
    completeOnboarding() {
      setState((current) => ({
        ...current,
        onboardingComplete: true,
        briefCache: briefRepository.loadLatestBrief(current.extractedProfile),
      }));
    },
  }), [state]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }

  return context;
}

export function formatCoverageLabel(coverage: CoveragePreference) {
  if (coverage === 'local') {
    return 'More local';
  }

  if (coverage === 'global') {
    return 'More global';
  }

  return 'More national';
}
