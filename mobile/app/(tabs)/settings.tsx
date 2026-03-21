import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { PrismScreen } from '@/components/PrismScreen';
import { SectionCard } from '@/components/SectionCard';
import { SettingToggle } from '@/components/SettingToggle';
import { COUNTRIES } from '@/data/countries';
import { useAppState } from '@/state/AppStateContext';
import { colors } from '@/theme';
import type { MockSyncScenario } from '@/types/app';

const MOCK_SYNC_OPTIONS: { value: MockSyncScenario; label: string; hint: string }[] = [
  {
    value: 'success',
    label: 'Refresh works',
    hint: 'Use the standard local mock refresh path',
  },
  {
    value: 'temporary_failure',
    label: 'Fail, then retry',
    hint: 'Show a temporary failure while keeping saved content and queue one retry',
  },
  {
    value: 'stale_cache',
    label: 'Older cache',
    hint: 'Show an older saved brief that needs a refresh when convenient',
  },
];

export default function SettingsScreen() {
  const { state, typography, setMockSyncScenario, updatePrivacy } = useAppState();
  const country = COUNTRIES.find((item) => item.code === state.selectedCountryCode);

  return (
    <PrismScreen>
      <View style={styles.header}>
        <Text style={[styles.title, typography.xl]}>Settings</Text>
        <Text style={[styles.body, typography.base]}>
          Local preferences stay inspectable here. This MVP keeps using local mock data and does not send raw onboarding text upstream.
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
        <Text style={[styles.metaLabel, typography.sm]}>Mock sync mode</Text>
        <Text style={[styles.metaValue, typography.base]}>{getMockSyncLabel(state.mockSyncScenario)}</Text>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, typography.md]}>Mock sync mode</Text>
        <Text style={[styles.body, typography.base]}>
          Use this to inspect success, delayed refresh, and older-cache states without any live backend.
        </Text>
        <View style={styles.chipRow}>
          {MOCK_SYNC_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={state.mockSyncScenario === option.value}
              onPress={() => setMockSyncScenario(option.value)}
              accessibilityHint={option.hint}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <SettingToggle
          title="Notifications"
          description="Keep the morning brief to a calm daily reminder."
          value={state.privacy.notificationsEnabled}
          onValueChange={(notificationsEnabled) => updatePrivacy({ notificationsEnabled })}
        />
        <SettingToggle
          title="Allow morning brief"
          description="Show the saved brief in Home and Brief."
          value={state.privacy.allowMorningBrief}
          onValueChange={(allowMorningBrief) => updatePrivacy({ allowMorningBrief })}
        />
        <SettingToggle
          title="Allow evening sync"
          description="Allow Prism to queue a local retry after a temporary mock failure."
          value={state.privacy.allowEveningSync}
          onValueChange={(allowEveningSync) => updatePrivacy({ allowEveningSync })}
        />
        <SettingToggle
          title="Wi-Fi only sync"
          description="Keep future refresh behavior conservative when a real sync path exists."
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
          Personalization in this MVP comes from your topic choices and explicit brief feedback only. No dwell-time scoring. No hidden profile.
        </Text>
      </SectionCard>
    </PrismScreen>
  );
}

function getMockSyncLabel(value: MockSyncScenario) {
  return MOCK_SYNC_OPTIONS.find((option) => option.value === value)?.label ?? value;
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
  metaLabel: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaValue: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
