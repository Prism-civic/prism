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
      : state.syncPhase === 'error'
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
          A calm status surface for your brief, local cache, and inspectable priorities.
        </Text>
      </View>

      <PulseOrb
        state={orbState}
        reduceMotionEnabled={state.reduceMotionEnabled}
      />

      {state.syncPhase !== 'idle' ? (
        <SyncStatusBanner
          syncPhase={state.syncPhase}
          syncError={state.syncError}
          lastSyncAt={state.briefCache.lastSyncAt}
        />
      ) : null}

      <SectionCard>
        <Text style={[styles.cardTitle, typography.md]}>Today&apos;s brief</Text>
        <Text style={[styles.body, typography.base]}>{getBriefMessage(listState)}</Text>
        {state.briefCache.lastSyncAt ? (
          <Text style={[styles.meta, typography.sm]}>
            {isRefreshing
              ? 'Checking for updates…'
              : `Cache last updated: ${formatTimestamp(state.briefCache.lastSyncAt)}`}
          </Text>
        ) : (
          <Text style={[styles.meta, typography.sm]}>No cache update yet</Text>
        )}
        <View style={styles.buttonRow}>
          <PrismButton
            label="Open brief"
            onPress={() => router.push('/(tabs)/brief')}
            disabled={listState === 'empty' || listState === 'disabled'}
            accessibilityLabel="Open morning brief"
            accessibilityHint="Shows your ranked local brief items"
          />
          <PrismButton
            label={isRefreshing ? 'Refreshing…' : 'Refresh local cache'}
            onPress={refreshBrief}
            variant="secondary"
            disabled={isRefreshing}
            accessibilityLabel={isRefreshing ? 'Refreshing brief, please wait' : 'Refresh local cache'}
            accessibilityHint={isRefreshing ? undefined : 'Fetches a fresh ranked brief from the local cache'}
          />
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.cardTitle, typography.md]}>Offline availability</Text>
        <Text style={[styles.body, typography.base]}>
          {state.briefCache.isOffline
            ? 'You are reading a fully local cached brief. Detail pages, confidence notes, and source lists remain available without a connection.'
            : 'Cached detail is available locally if the connection drops later.'}
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
      </SectionCard>
    </PrismScreen>
  );
}

function getBriefMessage(listState: ReturnType<typeof getBriefListState>) {
  if (listState === 'disabled') {
    return 'Morning brief is off. Cached evidence stays on device until you turn it back on.';
  }

  if (listState === 'empty') {
    return 'Preparing your first brief from local mock evidence. Nothing is fetched from a live backend yet.';
  }

  if (listState === 'offline') {
    return 'The latest brief is cached on device and ready to read offline.';
  }

  return 'Your latest local brief is ready with cached evidence detail.';
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
