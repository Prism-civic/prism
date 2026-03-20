import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { PrismScreen } from '@/components/PrismScreen';
import { SectionCard } from '@/components/SectionCard';
import { SyncStatusBanner } from '@/components/SyncStatusBanner';
import { getBriefListState } from '@/lib/briefs';
import { useAppState } from '@/state/AppStateContext';
import { colors } from '@/theme';
import type { BriefFeedbackSignal, BriefItem } from '@/types/app';

const FEEDBACK_OPTIONS: { signal: BriefFeedbackSignal; label: string; hint: string }[] = [
  { signal: 'useful', label: 'Useful', hint: 'Mark this item as useful to your priorities' },
  { signal: 'like',   label: 'Like',   hint: 'Mark this item as liked' },
  { signal: 'not_relevant', label: 'Not relevant', hint: 'Mark this item as not relevant to your priorities' },
];

function FeedbackRow({
  item,
  activeSignal,
  onPress,
}: {
  item: BriefItem;
  activeSignal?: BriefFeedbackSignal;
  onPress(signal: BriefFeedbackSignal): void;
}) {
  return (
    <View
      style={styles.feedbackRow}
      accessibilityLabel={`Feedback for: ${item.headline}`}
    >
      {FEEDBACK_OPTIONS.map(({ signal, label, hint }) => (
        <Chip
          key={signal}
          label={label}
          selected={activeSignal === signal}
          onPress={() => onPress(signal)}
          accessibilityHint={hint}
        />
      ))}
    </View>
  );
}

export default function BriefScreen() {
  const { state, typography, submitBriefFeedback } = useAppState();
  const listState = getBriefListState({
    allowMorningBrief: state.privacy.allowMorningBrief,
    onboardingComplete: state.onboardingComplete,
    items: state.briefCache.items,
    isOffline: state.briefCache.isOffline,
  });

  return (
    <PrismScreen>
      <View style={styles.header}>
        <Text
          style={[styles.title, typography.xl]}
          accessibilityRole="header"
        >
          Morning Brief
        </Text>
        <Text style={[styles.body, typography.base]}>
          Three to five ranked items, stored locally and readable without a connection.
        </Text>
      </View>

      {state.syncPhase !== 'idle' ? (
        <SyncStatusBanner
          syncPhase={state.syncPhase}
          syncError={state.syncError}
          lastSyncAt={state.briefCache.lastSyncAt}
        />
      ) : null}

      {listState === 'disabled' ? (
        <SectionCard>
          <Text style={[styles.cardTitle, typography.md]}>Brief paused</Text>
          <Text style={[styles.body, typography.base]}>
            Morning brief is turned off in Settings. Cached evidence stays on device until you turn it back on.
          </Text>
        </SectionCard>
      ) : null}

      {listState === 'empty' ? (
        <SectionCard>
          <Text style={[styles.cardTitle, typography.md]}>No brief yet</Text>
          <Text style={[styles.body, typography.base]}>
            Finish onboarding and Prism will assemble a local first brief from cached mock evidence packs.
          </Text>
        </SectionCard>
      ) : null}

      {listState === 'offline' ? (
        <SectionCard>
          <Text style={[styles.cardTitle, typography.md]}>Offline · Cached content</Text>
          <Text style={[styles.body, typography.base]}>
            You&apos;re reading the latest cached brief. Evidence detail stays available and sync can wait.
          </Text>
          <Text style={[styles.meta, typography.sm]}>
            {state.briefCache.lastSyncAt
              ? `Cache updated: ${formatTimestamp(state.briefCache.lastSyncAt)}`
              : 'Cache has not yet been updated'}
          </Text>
        </SectionCard>
      ) : null}

      {state.briefCache.items.map((item) => {
        const activeSignal = state.feedbackHistory.find((entry) => entry.briefItemId === item.id)?.signal;

        return (
          <SectionCard key={item.id}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.headline}. ${item.confidence.band} confidence. ${item.sources.length} ${item.sources.length === 1 ? 'source' : 'sources'}. ${item.localityLabel}.`}
              accessibilityHint="Double tap to open full evidence detail"
              onPress={() => router.push({ pathname: '/brief/[id]', params: { id: item.id } })}
              style={({ pressed }) => [
                styles.cardPressable,
                pressed ? styles.cardPressed : null,
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, typography.md]}>{item.headline}</Text>
                <Text
                  style={[styles.confidence, typography.sm]}
                  accessibilityLabel={`${item.confidence.band} confidence`}
                >
                  {item.confidence.band} confidence
                </Text>
              </View>
              <Text style={[styles.body, typography.base]}>{item.summary}</Text>
              <View style={styles.metaRow} accessibilityElementsHidden>
                <Text style={[styles.meta, typography.sm]}>{item.sources.length} sources</Text>
                <Text style={[styles.meta, typography.sm]}>{item.localityLabel}</Text>
                <Text style={[styles.meta, typography.sm]}>{item.freshnessLabel}</Text>
              </View>
              <View style={styles.tagRow} accessibilityElementsHidden>
                {item.topicTags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={[styles.tagLabel, typography.sm]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
            <FeedbackRow
              item={item}
              activeSignal={activeSignal}
              onPress={(signal) => submitBriefFeedback(item.id, signal)}
            />
          </SectionCard>
        );
      })}
    </PrismScreen>
  );
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Not yet synced';
  }

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
  cardPressable: {
    borderRadius: 24,
    gap: 12,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    gap: 8,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  confidence: {
    color: colors.amber,
    textTransform: 'capitalize',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  meta: {
    color: colors.textMuted,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagLabel: {
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  feedbackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
