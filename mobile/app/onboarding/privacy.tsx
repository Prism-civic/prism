import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrismButton } from '@/components/PrismButton';
import { PrismScreen } from '@/components/PrismScreen';
import { SectionCard } from '@/components/SectionCard';
import { SettingToggle } from '@/components/SettingToggle';
import { useAppState } from '@/state/AppStateContext';
import { colors } from '@/theme';

export default function PrivacyScreen() {
  const { state, typography, updatePrivacy } = useAppState();

  return (
    <PrismScreen>
      <View style={styles.header}>
        <Text style={[styles.title, typography.xl]}>Privacy settings</Text>
        <Text style={[styles.body, typography.base]}>
          Simple and honest. You control what leaves the device and when Prism works quietly in the background.
        </Text>
      </View>

      <SectionCard>
        <SettingToggle
          title="Share sanitized issue summaries"
          description="Help improve the network with de-identified summaries. Raw text never leaves the phone."
          value={state.privacy.shareSanitizedSummaries}
          onValueChange={(shareSanitizedSummaries) => updatePrivacy({ shareSanitizedSummaries })}
        />
        <SettingToggle
          title="Allow morning brief"
          description="Keep a calm once-per-day brief available on this device."
          value={state.privacy.allowMorningBrief}
          onValueChange={(allowMorningBrief) => updatePrivacy({ allowMorningBrief })}
        />
        <SettingToggle
          title="Allow evening sync"
          description="Refresh cached evidence in the evening, with Wi-Fi preferred for the MVP."
          value={state.privacy.allowEveningSync}
          onValueChange={(allowEveningSync) => updatePrivacy({ allowEveningSync })}
        />
      </SectionCard>

      <PrismButton label="Finish setup" onPress={() => router.push('/onboarding/done')} />
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
});
