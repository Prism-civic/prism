import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { PrismButton } from '@/components/PrismButton';
import { PrismScreen } from '@/components/PrismScreen';
import { SectionCard } from '@/components/SectionCard';
import { useAppState } from '@/state/AppStateContext';
import { colors } from '@/theme';

export default function BriefDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBriefItem, state, submitBriefFeedback, typography } = useAppState();
  const item = id ? getBriefItem(id) : undefined;
  const activeSignal = state.feedbackHistory.find((entry) => entry.briefItemId === item?.id)?.signal;

  if (!item) {
    return (
      <PrismScreen>
        <SectionCard>
          <Text style={[styles.title, typography.xl]}>Evidence unavailable</Text>
          <Text style={[styles.body, typography.base]}>
            This cached item is missing. Return to the brief list and open another card.
          </Text>
          <PrismButton label="Back to brief" onPress={() => router.replace('/(tabs)/brief')} />
        </SectionCard>
      </PrismScreen>
    );
  }

  return (
    <PrismScreen>
      <PrismButton label="Back to brief" onPress={() => router.back()} variant="secondary" />

      <View style={styles.header}>
        <Text style={[styles.title, typography.xl]}>{item.headline}</Text>
        <Text style={[styles.body, typography.base]}>{item.detail}</Text>
      </View>

      <SectionCard>
        <Text style={[styles.sectionTitle, typography.md]}>Why this is in your brief</Text>
        <Text style={[styles.body, typography.base]}>
          Tagged for {item.topicTags.join(', ')} with {item.confidence.band} confidence and {item.localityLabel.toLowerCase()} relevance.
        </Text>
        <Text style={[styles.meta, typography.sm]}>
          Updated {formatTimestamp(item.updatedAt)}. {state.briefCache.isOffline ? 'Reading from local cache.' : 'Latest sync available.'}
        </Text>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, typography.md]}>Confidence</Text>
        <Text style={[styles.body, typography.base]}>{item.confidence.summary}</Text>
        <Text style={[styles.meta, typography.sm]}>{item.evidenceNote}</Text>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, typography.md]}>Sources</Text>
        {item.sources.map((source) => (
          <View key={source.id} style={styles.sourceRow}>
            <Text style={[styles.sourceTitle, typography.base]}>{source.title}</Text>
            <Text style={[styles.meta, typography.sm]}>{source.publisher}</Text>
            <Text style={[styles.meta, typography.sm]}>{formatTimestamp(source.publishedAt)}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, typography.md]}>Your signal</Text>
        <View style={styles.feedbackRow}>
          <Chip label="Useful" selected={activeSignal === 'useful'} onPress={() => submitBriefFeedback(item.id, 'useful')} />
          <Chip label="Like" selected={activeSignal === 'like'} onPress={() => submitBriefFeedback(item.id, 'like')} />
          <Chip label="Not relevant" selected={activeSignal === 'not_relevant'} onPress={() => submitBriefFeedback(item.id, 'not_relevant')} />
        </View>
        <Text style={[styles.meta, typography.sm]}>
          This only updates local topic weighting, with visible reasons in My Priorities.
        </Text>
      </SectionCard>
    </PrismScreen>
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
  header: {
    gap: 10,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  body: {
    color: colors.textSecondary,
  },
  meta: {
    color: colors.textMuted,
  },
  sourceRow: {
    gap: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sourceTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  feedbackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
