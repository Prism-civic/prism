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
          Local preferences stay inspectable here. Nothing in this MVP sends raw onboarding text upstream.
        </Text>
      </View>

      <SectionCard>
        <Text style={[styles.metaLabel, typography.sm]}>Country</Text>
        <Text style={[styles.metaValue, typography.base]}>{country ? country.name : 'Not selected'}</Text>
        <Text style={[styles.metaLabel, typography.sm]}>Text size</Text>
        <Text style={[styles.metaValue, typography.base]}>{state.onboarding.textSize}</Text>
        <Text style={[styles.metaLabel, typography.sm]}>Reduced motion</Text>
        <Text style={[styles.metaValue, typography.base]}>
          {state.reduceMotionEnabled ? 'Following your device setting' : 'Device motion allowed'}
        </Text>
      </SectionCard>

      <SectionCard>
        <SettingToggle
          title="Notifications"
          description="Keep the morning brief limited to a calm daily reminder."
          value={state.privacy.notificationsEnabled}
          onValueChange={(notificationsEnabled) => updatePrivacy({ notificationsEnabled })}
        />
        <SettingToggle
          title="Allow morning brief"
          description="Show the cached brief in Home and Brief."
          value={state.privacy.allowMorningBrief}
          onValueChange={(allowMorningBrief) => updatePrivacy({ allowMorningBrief })}
        />
        <SettingToggle
          title="Allow evening sync"
          description="Prepare for future background refresh without enabling a real backend yet."
          value={state.privacy.allowEveningSync}
          onValueChange={(allowEveningSync) => updatePrivacy({ allowEveningSync })}
        />
        <SettingToggle
          title="Wi-Fi only sync"
          description="Keep future cache refresh conservative when sync lands."
          value={state.privacy.wifiOnlySync}
          onValueChange={(wifiOnlySync) => updatePrivacy({ wifiOnlySync })}
        />
        <SettingToggle
          title="Share sanitized issue summaries"
          description="Optional and off by default."
          value={state.privacy.shareSanitizedSummaries}
          onValueChange={(shareSanitizedSummaries) => updatePrivacy({ shareSanitizedSummaries })}
        />
      </SectionCard>

      <SectionCard>
        <Text style={[styles.metaLabel, typography.sm]}>Privacy note</Text>
        <Text style={[styles.body, typography.base]}>
          Personalization in this MVP comes from your topic choices and explicit brief feedback only. No dwell-time scoring, no hidden profile.
        </Text>
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
