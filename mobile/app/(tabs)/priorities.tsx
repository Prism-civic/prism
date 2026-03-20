import { StyleSheet, Text, View } from 'react-native';

import { PrismScreen } from '@/components/PrismScreen';
import { SectionCard } from '@/components/SectionCard';
import { useAppState } from '@/state/AppStateContext';
import { colors } from '@/theme';

export default function PrioritiesScreen() {
  const { state, typography } = useAppState();
  const profile = state.extractedProfile;

  return (
    <PrismScreen>
      <View style={styles.header}>
        <Text style={[styles.title, typography.xl]}>My Priorities</Text>
        <Text style={[styles.body, typography.base]}>
          Prism only uses visible topic weights and explicit feedback from this device.
        </Text>
      </View>

      <SectionCard>
        {profile ? (
          <>
            <Text style={[styles.summary, typography.base]}>{profile.summary}</Text>
            {profile.topics.map((topic) => (
              <View key={topic.id} style={styles.topicRow}>
                <View style={styles.topicCopy}>
                  <Text style={[styles.topicLabel, typography.base]}>{topic.label}</Text>
                  <Text style={[styles.topicReason, typography.sm]}>{topic.reason}</Text>
                </View>
                <Text style={[styles.weight, typography.sm]}>{topic.weight}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={[styles.body, typography.base]}>Finish onboarding to see your extracted profile here.</Text>
        )}
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, typography.md]}>Recent local feedback</Text>
        {state.feedbackHistory.length > 0 ? (
          state.feedbackHistory.slice(0, 5).map((event) => (
            <View key={event.briefItemId} style={styles.feedbackRow}>
              <Text style={[styles.topicLabel, typography.base]}>{event.itemHeadline}</Text>
              <Text style={[styles.topicReason, typography.sm]}>{event.rationale}</Text>
              <Text style={[styles.topicReason, typography.sm]}>
                Topics touched: {event.topicTags.join(', ')}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.body, typography.base]}>
            No feedback yet. Useful, like, and not relevant signals will stay visible here.
          </Text>
        )}
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
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  body: {
    color: colors.textSecondary,
  },
  summary: {
    color: colors.textPrimary,
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  topicCopy: {
    flex: 1,
    gap: 4,
  },
  topicLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  topicReason: {
    color: colors.textSecondary,
  },
  weight: {
    color: colors.amber,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  feedbackRow: {
    gap: 4,
  },
});
