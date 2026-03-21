import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';
import type { SyncPhase, SyncStatus } from '@/types/app';

interface SyncStatusBannerProps {
  syncPhase: SyncPhase;
  syncStatus: SyncStatus;
  syncMessage: string | null;
  lastSyncAt: string | null;
  nextRetryAt: string | null;
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
export function SyncStatusBanner({
  syncPhase,
  syncStatus,
  syncMessage,
  lastSyncAt,
  nextRetryAt,
}: SyncStatusBannerProps) {
  if (syncPhase === 'idle') {
    return null;
  }

  if (syncPhase === 'refreshing') {
    return (
      <View
        style={[styles.banner, styles.refreshingBanner]}
        accessibilityLiveRegion="polite"
        accessibilityLabel="Refreshing brief while keeping saved content available"
      >
        <ActivityIndicator size="small" color={colors.amber} style={styles.spinner} />
        <View style={styles.bodyCopy}>
          <Text style={styles.refreshingTitle}>Refreshing your brief</Text>
          <Text style={styles.refreshingText}>
            {syncMessage ?? 'Checking for updates. Saved content stays available while this runs.'}
          </Text>
        </View>
      </View>
    );
  }

  const title = syncStatus === 'retry_scheduled'
    ? 'Using saved content for now'
    : 'Saved brief still available';
  const cacheNote = getCacheNote(lastSyncAt, nextRetryAt, syncStatus);

  return (
    <View
      style={[styles.banner, styles.errorBanner]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${title}. ${syncMessage ?? 'Saved content remains available.'} ${cacheNote}`}
    >
      <Text style={styles.errorIcon}>{syncStatus === 'retry_scheduled' ? '~' : '!'}</Text>
      <View style={styles.errorBody}>
        <Text style={styles.errorTitle}>{title}</Text>
        <Text style={styles.errorMessage}>
          {syncMessage ?? 'Saved content remains available.'} {cacheNote}
        </Text>
      </View>
    </View>
  );
}

function getCacheNote(lastSyncAt: string | null, nextRetryAt: string | null, syncStatus: SyncStatus) {
  const lastSeen = lastSyncAt
    ? `Last successful refresh: ${formatTimestamp(lastSyncAt)}.`
    : 'No successful refresh is recorded yet.';

  if (syncStatus === 'retry_scheduled' && nextRetryAt) {
    return `${lastSeen} Prism will try again around ${formatTime(nextRetryAt)}.`;
  }

  if (syncStatus === 'refresh_recommended') {
    return `${lastSeen} You can refresh again when it suits you.`;
  }

  return lastSeen;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
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
    borderColor: colors.amber,
  },
  spinner: {
    flexShrink: 0,
  },
  bodyCopy: {
    flex: 1,
    gap: 2,
  },
  refreshingTitle: {
    color: colors.amber,
    fontSize: 13,
    fontWeight: '700',
  },
  refreshingText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  errorIcon: {
    color: colors.amber,
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
    color: colors.amber,
    fontSize: 13,
    fontWeight: '700',
  },
  errorMessage: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
