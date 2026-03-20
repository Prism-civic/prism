import { StyleSheet, Text, View } from 'react-native';

import { PrismScreen } from '@/components/PrismScreen';
import { SectionCard } from '@/components/SectionCard';
import { SettingToggle } from '@/components/SettingToggle';
import { COUNTRIES } from '@/data/countries';
import { useAppState } from '@/state/AppStateContext';
import { colors } from '@/theme';

export default function SettingsScreen() {
  const { state, typography, updatePrivacy } = useAppState();
  const country = COUNTRIES.find((item) => item.code === state.selectedCountryCode);

  return (
    <PrismScreen>
      <View style={styles.header}>
        <Text style={[styles.title, typography.xl]}>Settings</Text>
        <Text style={[styles.body, typography.base]}>
          MVP settings for country, readable text size, reduced motion awareness, and privacy controls.
        </Text>
      </View>

      <SectionCard>
        <Text style={[styles.metaLabel, typography.sm]}>Country</Text>
        <Text style={[styles.metaValue, typography.base]}>{country ? country.name : 'Not selected'}</Text>
        <Text style={[styles.metaLabel, typography.sm]}>Text size</Text>
        <Text style={[styles.metaValue, typography.base]}>{state.onboarding.textSize}</Text>
        <Text style={[styles.metaLabel, typography.sm]}>Reduced motion</Text>
        <Text style={[styles.metaValue, typography.base]}>{state.reduceMotionEnabled ? 'On' : 'Off'}</Text>
      </SectionCard>

      <SectionCard>
        <SettingToggle
          title="Share sanitized issue summaries"
          description="Optional and off by default."
          value={state.privacy.shareSanitizedSummaries}
          onValueChange={(shareSanitizedSummaries) => updatePrivacy({ shareSanitizedSummaries })}
        />
        <SettingToggle
          title="Allow morning brief"
          description="A calm once-per-day brief, stored locally."
          value={state.privacy.allowMorningBrief}
          onValueChange={(allowMorningBrief) => updatePrivacy({ allowMorningBrief })}
        />
        <SettingToggle
          title="Allow evening sync"
          description="Refresh evidence packs quietly in the background."
          value={state.privacy.allowEveningSync}
          onValueChange={(allowEveningSync) => updatePrivacy({ allowEveningSync })}
        />
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
  metaLabel: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaValue: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
