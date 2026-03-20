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
          The user-visible profile Prism will use for future brief ranking.
        </Text>
      </View>

      <SectionCard>
        {profile ? (
          profile.topics.map((topic) => (
            <View key={topic.id} style={styles.topicRow}>
              <View style={styles.topicCopy}>
                <Text style={[styles.topicLabel, typography.base]}>{topic.label}</Text>
                <Text style={[styles.topicReason, typography.sm]}>{topic.reason}</Text>
              </View>
              <Text style={[styles.weight, typography.sm]}>{topic.weight}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.body, typography.base]}>Finish onboarding to see your extracted profile here.</Text>
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
  body: {
    color: colors.textSecondary,
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
});
