import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { PrismScreen } from '@/components/PrismScreen';
import { SectionCard } from '@/components/SectionCard';
import { getBriefListState } from '@/lib/briefs';
import { useAppState } from '@/state/AppStateContext';
import { colors } from '@/theme';
import type { BriefFeedbackSignal } from '@/types/app';

function FeedbackRow({
  activeSignal,
  onPress,
}: {
  activeSignal?: BriefFeedbackSignal;
  onPress(signal: BriefFeedbackSignal): void;
}) {
  return (
    <View style={styles.feedbackRow}>
      <Chip label="Useful" selected={activeSignal === 'useful'} onPress={() => onPress('useful')} />
      <Chip label="Like" selected={activeSignal === 'like'} onPress={() => onPress('like')} />
      <Chip label="Not relevant" selected={activeSignal === 'not_relevant'} onPress={() => onPress('not_relevant')} />
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
        <Text style={[styles.title, typography.xl]}>Morning Brief</Text>
        <Text style={[styles.body, typography.base]}>
          Three to five ranked items, stored locally and readable without a connection.
        </Text>
      </View>

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
          <Text style={[styles.cardTitle, typography.md]}>Offline, still usable</Text>
          <Text style={[styles.body, typography.base]}>
            You&apos;re reading the latest cached brief. Evidence detail stays available and sync can wait.
          </Text>
          <Text style={[styles.meta, typography.sm]}>
            Last cache refresh: {formatTimestamp(state.briefCache.lastSyncAt)}
          </Text>
        </SectionCard>
      ) : null}

      {state.briefCache.items.map((item) => {
        const activeSignal = state.feedbackHistory.find((entry) => entry.briefItemId === item.id)?.signal;

        return (
          <SectionCard key={item.id}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/brief/[id]', params: { id: item.id } })}
              style={({ pressed }) => [
                styles.cardPressable,
                pressed ? styles.cardPressed : null,
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, typography.md]}>{item.headline}</Text>
                <Text style={[styles.confidence, typography.sm]}>{item.confidence.band} confidence</Text>
              </View>
              <Text style={[styles.body, typography.base]}>{item.summary}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.meta, typography.sm]}>{item.sources.length} sources</Text>
                <Text style={[styles.meta, typography.sm]}>{item.localityLabel}</Text>
                <Text style={[styles.meta, typography.sm]}>{item.freshnessLabel}</Text>
              </View>
              <View style={styles.tagRow}>
                {item.topicTags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={[styles.tagLabel, typography.sm]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
            <FeedbackRow activeSignal={activeSignal} onPress={(signal) => submitBriefFeedback(item.id, signal)} />
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
