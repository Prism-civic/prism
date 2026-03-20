import { StyleSheet, Switch, Text, View } from 'react-native';

import { colors } from '@/theme';

interface SettingToggleProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange(value: boolean): void;
}

export function SettingToggle({
  title,
  description,
  value,
  onValueChange,
}: SettingToggleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: colors.toggleOff, true: colors.toggleOn }}
        thumbColor={colors.white}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
