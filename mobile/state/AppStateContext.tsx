import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo } from 'react-native';
import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { briefRepository, createInitialBriefCache } from '@/lib/briefs';
import { createSyncAdapter, getMockRetryDelayMs } from '@/lib/sync';
import { buildExtractedProfile } from '@/lib/profile';
import { getTypography, type TextSizePreset } from '@/theme';
import type {
  AppState,
  BriefFeedbackSignal,
  BriefItem,
  CoveragePreference,
  ExtractedProfile,
  MockSyncScenario,
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
  syncStatus: 'clear',
  syncMessage: null,
  nextRetryAt: null,
  mockSyncScenario: 'success',
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
  setMockSyncScenario(scenario: MockSyncScenario): void;
  /** Fire-and-forget. Tracks progress via transient sync fields on state. */
  refreshBrief(): void;
  getBriefItem(itemId: string): BriefItem | undefined;
  submitBriefFeedback(itemId: string, signal: BriefFeedbackSignal): void;
  completeOnboarding(): void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(defaultState);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const runRefresh = useCallback((
    profileSnapshot: ExtractedProfile | null,
    cacheSnapshot: AppState['briefCache'],
    scenario: MockSyncScenario,
    trigger: 'manual' | 'queued-retry',
    allowQueuedRetry: boolean,
  ) => {
    syncAdapter
      .fetchBrief({
        profile: profileSnapshot,
        currentCache: cacheSnapshot,
        scenario,
        trigger,
      })
      .then((result) => {
        if (result.ok && result.cache) {
          clearPendingRetry();
          setState((current) => ({
            ...current,
            briefCache: result.cache!,
            syncPhase: 'idle',
            syncStatus: 'clear',
            syncMessage: null,
            nextRetryAt: null,
          }));
          return;
        }

        const shouldQueueRetry =
          result.status === 'retry_scheduled' && allowQueuedRetry && trigger === 'manual';
        const nextStatus = shouldQueueRetry ? 'retry_scheduled' : 'refresh_recommended';
        const nextMessage = shouldQueueRetry
          ? result.message ?? 'Refresh paused for now. Your saved brief is still here.'
          : result.status === 'retry_scheduled'
            ? 'Refresh paused for now. Your saved brief is still here. Automatic retry is off, so you can try again later.'
            : result.message ?? 'Refresh did not complete. Your saved brief is still available, and you can try again later.';

        setState((current) => ({
          ...current,
          briefCache: result.cache ?? current.briefCache,
          syncPhase: 'degraded',
          syncStatus: nextStatus,
          syncMessage: nextMessage,
          nextRetryAt: shouldQueueRetry ? result.retryAt ?? null : null,
        }));

        if (shouldQueueRetry) {
          clearPendingRetry();
          retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null;
            setState((current) => ({
              ...current,
              syncPhase: 'refreshing',
              syncStatus: 'showing_cached',
              syncMessage: 'Trying again in the background. Your saved brief stays readable.',
              nextRetryAt: null,
            }));
            runRefresh(profileSnapshot, result.cache ?? cacheSnapshot, scenario, 'queued-retry', false);
          }, getMockRetryDelayMs());
        }
      })
      .catch(() => {
        clearPendingRetry();
        setState((current) => ({
          ...current,
          syncPhase: 'degraded',
          syncStatus: 'refresh_recommended',
          syncMessage: 'Could not reach the mock source just now. Your saved brief is still available.',
          nextRetryAt: null,
        }));
      });
  }, [clearPendingRetry]);

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
            syncStatus: 'clear',
            syncMessage: null,
            nextRetryAt: null,
            mockSyncScenario: parsed.mockSyncScenario ?? current.mockSyncScenario,
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
      clearPendingRetry();
      subscription.remove();
    };
  }, [clearPendingRetry]);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }

    // Transient sync fields are intentionally excluded — they reset on launch.
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
          mockSyncScenario: state.mockSyncScenario,
        }),
    ).catch(() => undefined);
  }, [
    state.briefCache,
    state.extractedProfile,
    state.feedbackHistory,
    state.hydrated,
    state.mockSyncScenario,
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
      clearPendingRetry();
      const profile = buildExtractedProfile(state.onboarding);
      setState((current) => ({
        ...current,
        extractedProfile: profile,
        briefCache: briefRepository.loadLatestBrief(profile),
      }));
      return profile;
    },
    updateProfile(profile) {
      clearPendingRetry();
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
    setMockSyncScenario(mockSyncScenario) {
      clearPendingRetry();
      setState((current) => ({
        ...current,
        mockSyncScenario,
        syncPhase: 'idle',
        syncStatus: 'clear',
        syncMessage: null,
        nextRetryAt: null,
      }));
    },
    refreshBrief() {
      clearPendingRetry();

      const cacheSnapshot = state.briefCache;
      const profileSnapshot = state.extractedProfile;
      const allowQueuedRetry = state.privacy.allowEveningSync;
      const hasCachedContent = cacheSnapshot.items.length > 0;

      // Mark in-flight immediately so UI can respond.
      setState((current) => ({
        ...current,
        syncPhase: 'refreshing',
        syncStatus: hasCachedContent ? 'showing_cached' : 'clear',
        syncMessage: hasCachedContent
          ? 'Checking for a newer brief. You can keep reading what is already saved on this device.'
          : 'Preparing your first saved brief from local mock evidence.',
        nextRetryAt: null,
      }));

      runRefresh(
        profileSnapshot,
        cacheSnapshot,
        state.mockSyncScenario,
        'manual',
        allowQueuedRetry,
      );
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
      clearPendingRetry();
      setState((current) => ({
        ...current,
        onboardingComplete: true,
        briefCache: briefRepository.loadLatestBrief(current.extractedProfile),
      }));
    },
  }), [clearPendingRetry, runRefresh, state]);

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
