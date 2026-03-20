import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';
import type { SyncPhase } from '@/types/app';

interface SyncStatusBannerProps {
  syncPhase: SyncPhase;
  syncError: string | null;
  lastSyncAt: string | null;
}

/**
 * Compact status strip shown when there is something non-idle to communicate
 * about the sync state. Renders nothing when syncPhase is 'idle'.
 *
 * Wording is aligned with Prism's trust/transparency ethos:
 * — no alarm language for expected offline states
 * — clear about what the user is reading (cached vs live)
 * — state is always conveyed in text, not colour alone
 */
export function SyncStatusBanner({ syncPhase, syncError, lastSyncAt }: SyncStatusBannerProps) {
  if (syncPhase === 'idle') {
    return null;
  }

  if (syncPhase === 'refreshing') {
    return (
      <View
        style={[styles.banner, styles.refreshingBanner]}
        accessibilityLiveRegion="polite"
        accessibilityLabel="Refreshing brief, please wait"
      >
        <ActivityIndicator size="small" color={colors.amber} style={styles.spinner} />
        <Text style={styles.refreshingText}>Refreshing brief…</Text>
      </View>
    );
  }

  // syncPhase === 'error'
  const cacheNote = lastSyncAt
    ? `Last successful cache: ${formatTimestamp(lastSyncAt)}.`
    : 'No previous cache on record.';

  return (
    <View
      style={[styles.banner, styles.errorBanner]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Sync unavailable. ${syncError ?? 'Cached content shown.'} ${cacheNote}`}
    >
      <Text style={styles.errorIcon}>!</Text>
      <View style={styles.errorBody}>
        <Text style={styles.errorTitle}>Sync unavailable</Text>
        <Text style={styles.errorMessage}>
          {syncError ?? 'Cached content is shown.'} {cacheNote}
        </Text>
      </View>
    </View>
  );
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
  banner: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  refreshingBanner: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.amber,
  },
  errorBanner: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.destructive,
  },
  spinner: {
    flexShrink: 0,
  },
  refreshingText: {
    color: colors.amber,
    fontSize: 13,
    fontWeight: '500',
  },
  errorIcon: {
    color: colors.destructive,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 0,
    width: 20,
    textAlign: 'center',
  },
  errorBody: {
    flex: 1,
    gap: 2,
  },
  errorTitle: {
    color: colors.destructive,
    fontSize: 13,
    fontWeight: '700',
  },
  errorMessage: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
