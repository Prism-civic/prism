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

import { buildExtractedProfile } from '@/lib/profile';
import { getTypography, type TextSizePreset } from '@/theme';
import type {
  AppState,
  CoveragePreference,
  ExtractedProfile,
  OnboardingDraft,
  PrivacySettings,
} from '@/types/app';

const STORAGE_KEY = 'prism.phone-app.state.v1';

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
};

const defaultState: AppState = {
  hydrated: false,
  reduceMotionEnabled: false,
  onboardingComplete: false,
  selectedCountryCode: null,
  onboarding: defaultOnboarding,
  extractedProfile: null,
  privacy: defaultPrivacy,
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

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        onboardingComplete: state.onboardingComplete,
        selectedCountryCode: state.selectedCountryCode,
        onboarding: state.onboarding,
        extractedProfile: state.extractedProfile,
        privacy: state.privacy,
      }),
    ).catch(() => undefined);
  }, [
    state.extractedProfile,
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
      }));
      return profile;
    },
    updateProfile(profile) {
      setState((current) => ({
        ...current,
        extractedProfile: profile,
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
    completeOnboarding() {
      setState((current) => ({ ...current, onboardingComplete: true }));
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
