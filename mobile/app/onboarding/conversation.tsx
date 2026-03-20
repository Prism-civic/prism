import { router } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { PrismButton } from '@/components/PrismButton';
import { PrismScreen } from '@/components/PrismScreen';
import { PulseOrb } from '@/components/PulseOrb';
import { SectionCard } from '@/components/SectionCard';
import { TOPIC_OPTIONS } from '@/lib/profile';
import { useAppState } from '@/state/AppStateContext';
import { colors } from '@/theme';
import type { CoveragePreference } from '@/types/app';
import type { TextSizePreset } from '@/theme';

const coverageOptions: CoveragePreference[] = ['local', 'national', 'global'];
const textSizeOptions: TextSizePreset[] = ['small', 'medium', 'large'];

export default function ConversationScreen() {
  const { state, updateOnboarding, generateProfile, typography } = useAppState();

  function toggleTopic(topicId: string) {
    const topicIds = state.onboarding.topicIds.includes(topicId)
      ? state.onboarding.topicIds.filter((id) => id !== topicId)
      : [...state.onboarding.topicIds, topicId];

    updateOnboarding({ topicIds });
  }

  function continueToProfile() {
    generateProfile();
    router.push('/onboarding/profile');
  }

  return (
    <PrismScreen>
      <View style={styles.header}>
        <Text style={[styles.title, typography.xl]}>Tell Prism what matters to you</Text>
        <Text style={[styles.body, typography.base]}>
          Keep it light. This should take under three minutes, and you can change anything later.
        </Text>
      </View>

      <PulseOrb state="processing" reduceMotionEnabled={state.reduceMotionEnabled} size={112} />

      <SectionCard>
        <Text style={[styles.sectionTitle, typography.md]}>Main interests</Text>
        <View style={styles.chipWrap}>
          {TOPIC_OPTIONS.map((topic) => (
            <Chip
              key={topic.id}
              label={topic.label}
              selected={state.onboarding.topicIds.includes(topic.id)}
              onPress={() => toggleTopic(topic.id)}
            />
          ))}
        </View>
        <TextInput
          multiline
          onChangeText={(customInterests) => updateOnboarding({ customInterests })}
          placeholder="Optional: describe concerns in your own words"
          placeholderTextColor={colors.textMuted}
          style={[styles.multilineInput, typography.base]}
          textAlignVertical="top"
          value={state.onboarding.customInterests}
        />
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, typography.md]}>Area you live in</Text>
        <TextInput
          onChangeText={(region) => updateOnboarding({ region })}
          placeholder="Town, city, or region"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, typography.base]}
          value={state.onboarding.region}
        />
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, typography.md]}>Coverage mix</Text>
        <View style={styles.optionRow}>
          {coverageOptions.map((coverage) => (
            <Chip
              key={coverage}
              label={coverage.charAt(0).toUpperCase() + coverage.slice(1)}
              selected={state.onboarding.coverage === coverage}
              onPress={() => updateOnboarding({ coverage })}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, typography.md]}>Comfortable text size</Text>
        <View style={styles.optionRow}>
          {textSizeOptions.map((textSize) => (
            <Chip
              key={textSize}
              label={textSize.charAt(0).toUpperCase() + textSize.slice(1)}
              selected={state.onboarding.textSize === textSize}
              onPress={() => updateOnboarding({ textSize })}
            />
          ))}
        </View>
      </SectionCard>

      <PrismButton label="Review my profile" onPress={continueToProfile} />
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
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  input: {
    borderRadius: 18,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  multilineInput: {
    minHeight: 100,
    borderRadius: 18,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
