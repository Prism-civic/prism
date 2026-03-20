import { Redirect } from 'expo-router';

import { PrismScreen } from '@/components/PrismScreen';
import { useAppState } from '@/state/AppStateContext';

export default function IndexScreen() {
  const { state } = useAppState();

  if (!state.hydrated) {
    return <PrismScreen scroll={false} />;
  }

  if (state.onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding/welcome" />;
}
