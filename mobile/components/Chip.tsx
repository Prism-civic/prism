import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress(): void;
  accessibilityHint?: string;
}

export function Chip({ label, selected, onPress, accessibilityHint }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={[styles.chip, selected ? styles.selectedChip : null]}
    >
      <Text style={[styles.label, selected ? styles.selectedLabel : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.chipDefault,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedChip: {
    backgroundColor: colors.chipSelected,
    borderColor: colors.chipSelectedBorder,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedLabel: {
    color: colors.textPrimary,
  },
});
