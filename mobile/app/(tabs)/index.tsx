import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrismButton } from '@/components/PrismButton';
import { PrismScreen } from '@/components/PrismScreen';
import { PulseOrb } from '@/components/PulseOrb';
import { SectionCard } from '@/components/SectionCard';
import { SyncStatusBanner } from '@/components/SyncStatusBanner';
import { getBriefListState, getBriefSyncStatus } from '@/lib/briefs';
import { COUNTRIES } from '@/data/countries';
import { useAppState } from '@/state/AppStateContext';
import { colors } from '@/theme';
import type { PulseOrbState } from '@/types/app'; // used for orbState type inference

export default function HomeScreen() {
  const { state, typography, refreshBrief } = useAppState();
  const country = COUNTRIES.find((item) => item.code === state.selectedCountryCode);
  const profile = state.extractedProfile;
  const isRefreshing = state.syncPhase === 'refreshing';

  const listState = getBriefListState({
    allowMorningBrief: state.privacy.allowMorningBrief,
    onboardingComplete: state.onboardingComplete,
    items: state.briefCache.items,
    isOffline: state.briefCache.isOffline,
  });
  const syncStatus = getBriefSyncStatus(state.briefCache, state.privacy.allowEveningSync);

  const orbState: PulseOrbState = listState === 'disabled'
    ? 'idle'
    : isRefreshing
      ? 'syncing'
      : state.syncPhase === 'degraded'
        ? 'degraded'
        : listState === 'empty'
          ? 'processing'
          : syncStatus === 'offline'
            ? 'degraded'
            : 'ready';

  return (
    <PrismScreen>
      <View style={styles.header}>
        <Text
          style={[styles.title, typography.xl]}
          accessibilityRole="header"
        >
          Home
        </Text>
        <Text style={[styles.body, typography.base]}>
          A calm place to check what is saved on this device, what still needs refreshing, and what can wait.
        </Text>
      </View>

      <PulseOrb
        state={orbState}
        reduceMotionEnabled={state.reduceMotionEnabled}
      />

      {state.syncPhase !== 'idle' ? (
        <SyncStatusBanner
          syncPhase={state.syncPhase}
          syncStatus={state.syncStatus}
          syncMessage={state.syncMessage}
          lastSyncAt={state.briefCache.lastSyncAt}
          nextRetryAt={state.nextRetryAt}
        />
      ) : null}

      <SectionCard>
        <Text style={[styles.cardTitle, typography.md]}>Today&apos;s brief</Text>
        <Text style={[styles.body, typography.base]}>
          {getBriefMessage(listState, state.onboardingComplete)}
        </Text>
        {state.briefCache.lastSyncAt ? (
          <Text style={[styles.meta, typography.sm]}>
            {isRefreshing
              ? 'Checking whether anything has materially changed.'
              : `Saved brief refreshed ${formatTimestamp(state.briefCache.lastSyncAt)}.`}
          </Text>
        ) : (
          <Text style={[styles.meta, typography.sm]}>No saved refresh yet.</Text>
        )}
        <View style={styles.buttonRow}>
          <PrismButton
            label="Open brief"
            onPress={() => router.push('/(tabs)/brief')}
            disabled={listState === 'empty' || listState === 'disabled'}
            accessibilityLabel="Open saved brief"
            accessibilityHint="Shows the current ranked brief items stored on this device"
          />
          <PrismButton
            label={isRefreshing ? 'Refreshing…' : 'Refresh saved brief'}
            onPress={refreshBrief}
            variant="secondary"
            disabled={isRefreshing}
            accessibilityLabel={isRefreshing ? 'Refreshing brief, please wait' : 'Refresh saved brief'}
            accessibilityHint={isRefreshing ? undefined : 'Checks the local mock sync source for a newer saved brief'}
          />
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.cardTitle, typography.md]}>Offline availability</Text>
        <Text style={[styles.body, typography.base]}>
          {state.briefCache.isOffline
            ? 'You are reading saved content from this device. Detail pages, confidence notes, and source lists remain available without a connection.'
            : 'If the connection drops later, the current saved brief remains readable on device.'}
        </Text>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.cardTitle, typography.md]}>Current setup</Text>
        <Text style={[styles.body, typography.base]}>
          Country: {country ? country.name : 'Not set'}
        </Text>
        <Text style={[styles.body, typography.base]}>
          Coverage: {profile ? profile.coverage : 'Not set'}
        </Text>
        <Text style={[styles.body, typography.base]}>
          Priorities: {profile ? profile.topics.map((topic) => topic.label).join(', ') : 'No profile yet'}
        </Text>
        {!state.onboardingComplete ? (
          <Text style={[styles.meta, typography.sm]}>
            Finish onboarding to turn these preferences into a more relevant saved brief.
          </Text>
        ) : null}
      </SectionCard>
    </PrismScreen>
  );
}

function getBriefMessage(
  listState: ReturnType<typeof getBriefListState>,
  onboardingComplete: boolean,
) {
  if (listState === 'disabled') {
    return 'Morning brief is off. Anything already saved stays on this device until you turn it back on.';
  }

  if (listState === 'empty') {
    return onboardingComplete
      ? 'No saved brief yet. Refresh when ready and Prism will assemble one from local mock evidence.'
      : 'Finish onboarding first, then Prism can build your first saved brief from local mock evidence.';
  }

  if (listState === 'offline') {
    return 'Your current brief is saved on device and ready to read offline.';
  }

  return 'Your latest saved brief is ready, with evidence detail kept readable on device.';
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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
  buttonRow: {
    gap: 10,
  },
});
