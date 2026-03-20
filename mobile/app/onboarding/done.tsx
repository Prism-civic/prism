import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrismButton } from '@/components/PrismButton';
import { PrismScreen } from '@/components/PrismScreen';
import { PulseOrb } from '@/components/PulseOrb';
import { SectionCard } from '@/components/SectionCard';
import { useAppState } from '@/state/AppStateContext';
import { colors } from '@/theme';

export default function DoneScreen() {
  const { state, typography, completeOnboarding } = useAppState();

  function enterApp() {
    completeOnboarding();
    router.replace('/(tabs)');
  }

  return (
    <PrismScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, typography['2xl']]}>You&apos;re part of the network.</Text>
        <Text style={[styles.body, typography.base]}>
          Prism is ready locally. Your first brief will appear here once mocked sync completes.
        </Text>
      </View>

      <PulseOrb state="ready" reduceMotionEnabled={state.reduceMotionEnabled} />

      <SectionCard>
        <Text style={[styles.cardTitle, typography.md]}>First home state</Text>
        <Text style={[styles.body, typography.base]}>
          Preparing your first brief. Until backend sync exists, this state uses local deterministic mock data only.
        </Text>
      </SectionCard>

      <PrismButton label="Open home" onPress={enterApp} />
    </PrismScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    gap: 10,
    paddingTop: 24,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  cardTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  body: {
    color: colors.textSecondary,
  },
});
