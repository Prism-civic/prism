import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrismButton } from '@/components/PrismButton';
import { PrismScreen } from '@/components/PrismScreen';
import { PulseOrb } from '@/components/PulseOrb';
import { SectionCard } from '@/components/SectionCard';
import { formatCoverageLabel, useAppState } from '@/state/AppStateContext';
import { colors } from '@/theme';

export default function ProfileReviewScreen() {
  const { state, typography } = useAppState();
  const profile = state.extractedProfile;

  if (!profile) {
    router.replace('/onboarding/conversation');
    return null;
  }

  return (
    <PrismScreen>
      <View style={styles.header}>
        <Text style={[styles.title, typography.xl]}>Here&apos;s what I heard</Text>
        <Text style={[styles.body, typography.base]}>
          Prism never silently accepts a profile. Review it now, then edit later anytime in My Priorities.
        </Text>
      </View>

      <PulseOrb state="retrieved" reduceMotionEnabled={state.reduceMotionEnabled} size={112} />

      <SectionCard>
        <Text style={[styles.summary, typography.base]}>{profile.summary}</Text>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, typography.md]}>Topics</Text>
        {profile.topics.map((topic) => (
          <View key={topic.id} style={styles.topicRow}>
            <View style={styles.topicCopy}>
              <Text style={[styles.topicLabel, typography.base]}>{topic.label}</Text>
              <Text style={[styles.topicReason, typography.sm]}>{topic.reason}</Text>
            </View>
            <View style={[styles.weightPill, topic.weight === 'high' ? styles.weightHigh : topic.weight === 'medium' ? styles.weightMedium : styles.weightLow]}>
              <Text style={styles.weightText}>{topic.weight}</Text>
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard>
        <Text style={[styles.metaLabel, typography.sm]}>Coverage</Text>
        <Text style={[styles.metaValue, typography.base]}>{formatCoverageLabel(profile.coverage)}</Text>
        <Text style={[styles.metaLabel, typography.sm]}>Region</Text>
        <Text style={[styles.metaValue, typography.base]}>{profile.region}</Text>
      </SectionCard>

      <View style={styles.footer}>
        <PrismButton label="Edit answers" onPress={() => router.back()} variant="secondary" />
        <PrismButton label="Looks right" onPress={() => router.push('/onboarding/privacy')} />
      </View>
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
  summary: {
    color: colors.textPrimary,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  topicRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
  weightPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  weightHigh: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  weightMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  weightLow: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
  },
  weightText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaLabel: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaValue: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  footer: {
    gap: 12,
  },
});
