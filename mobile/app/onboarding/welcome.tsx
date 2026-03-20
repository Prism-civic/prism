import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrismButton } from '@/components/PrismButton';
import { PrismScreen } from '@/components/PrismScreen';
import { PulseOrb } from '@/components/PulseOrb';
import { SectionCard } from '@/components/SectionCard';
import { colors } from '@/theme';
import { useAppState } from '@/state/AppStateContext';

export default function WelcomeScreen() {
  const { state, typography } = useAppState();

  return (
    <PrismScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, typography.sm]}>Prism Phone App MVP</Text>
        <Text style={[styles.title, typography['2xl']]}>Understand what matters without being tracked.</Text>
        <Text style={[styles.body, typography.base]}>
          Prism builds a calm daily brief around the topics you choose, using local-first profile data and transparent evidence.
        </Text>
      </View>

      <PulseOrb state="idle" reduceMotionEnabled={state.reduceMotionEnabled} />

      <SectionCard>
        <Text style={[styles.cardTitle, typography.md]}>Privacy promise</Text>
        <Text style={[styles.body, typography.base]}>
          No account required. Raw onboarding text stays on this device. Optional network sharing stays off unless you enable it.
        </Text>
        <Text style={[styles.note, typography.sm]}>
          The Humanitarian Charter and longer product intent remain reference docs for later polish, not blockers for this MVP flow.
        </Text>
      </SectionCard>

      <View style={styles.footer}>
        <PrismButton label="Continue" onPress={() => router.push('/onboarding/country')} />
      </View>
    </PrismScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    gap: 12,
    paddingTop: 24,
  },
  eyebrow: {
    color: colors.amber,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
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
  footer: {
    gap: 14,
  },
  note: {
    color: colors.textSecondary,
  },
});
