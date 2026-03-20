import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrismScreen } from '@/components/PrismScreen';
import { PulseOrb } from '@/components/PulseOrb';
import { SectionCard } from '@/components/SectionCard';
import { COUNTRIES } from '@/data/countries';
import { useAppState } from '@/state/AppStateContext';
import { colors } from '@/theme';
import type { PulseOrbState } from '@/types/app';

const states: PulseOrbState[] = ['syncing', 'retrieved', 'ready'];

export default function HomeScreen() {
  const { state, typography } = useAppState();
  const [stateIndex, setStateIndex] = useState(0);

  useEffect(() => {
    if (state.reduceMotionEnabled) {
      setStateIndex(2);
      return;
    }

    const timeouts = [
      setTimeout(() => setStateIndex(1), 1400),
      setTimeout(() => setStateIndex(2), 2800),
    ];

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [state.reduceMotionEnabled]);

  const country = COUNTRIES.find((item) => item.code === state.selectedCountryCode);
  const profile = state.extractedProfile;
  const orbState = states[stateIndex];

  return (
    <PrismScreen>
      <View style={styles.header}>
        <Text style={[styles.title, typography.xl]}>Home</Text>
        <Text style={[styles.body, typography.base]}>
          One calm status surface for your local profile, sync state, and first brief.
        </Text>
      </View>

      <PulseOrb state={orbState} reduceMotionEnabled={state.reduceMotionEnabled} />

      <SectionCard>
        <Text style={[styles.cardTitle, typography.md]}>Today&apos;s brief</Text>
        <Text style={[styles.body, typography.base]}>
          {state.privacy.allowMorningBrief
            ? 'Preparing your first brief. Once backend slices land, this card will show the latest 3-5 ranked items.'
            : 'Morning brief is off. You can turn it on any time in Settings.'}
        </Text>
        <Text style={[styles.meta, typography.sm]}>Last updated: local mock state just now</Text>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.cardTitle, typography.md]}>Current setup</Text>
        <Text style={[styles.body, typography.base]}>
          Country: {country ? country.name : 'Not set'}
        </Text>
        <Text style={[styles.body, typography.base]}>
          Priorities: {profile ? profile.topics.map((topic) => topic.label).join(', ') : 'No profile yet'}
        </Text>
      </SectionCard>
    </PrismScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  body: {
    color: colors.textSecondary,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
  },
});
