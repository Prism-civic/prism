import { StyleSheet, View, type PropsWithChildren } from 'react-native';

import { colors } from '@/theme';

export function SectionCard({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
});
