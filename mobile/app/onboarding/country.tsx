import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrismButton } from '@/components/PrismButton';
import { PrismScreen } from '@/components/PrismScreen';
import { SectionCard } from '@/components/SectionCard';
import { COUNTRIES } from '@/data/countries';
import { useAppState } from '@/state/AppStateContext';
import { colors } from '@/theme';

export default function CountryScreen() {
  const { state, setCountry, typography } = useAppState();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return COUNTRIES;
    }

    return COUNTRIES.filter((country) => country.name.toLowerCase().includes(normalized));
  }, [query]);

  return (
    <PrismScreen>
      <View style={styles.header}>
        <Text style={[styles.title, typography.xl]}>Choose your country mind</Text>
        <Text style={[styles.body, typography.base]}>
          This decides which country mind prepares your evidence packs. Prism does not use GPS for this step.
        </Text>
      </View>

      <TextInput
        autoCapitalize="none"
        onChangeText={setQuery}
        placeholder="Search countries"
        placeholderTextColor={colors.textMuted}
        style={[styles.search, typography.base]}
        value={query}
      />

      <SectionCard>
        <View style={styles.countryList}>
          {results.map((country) => {
            const selected = state.selectedCountryCode === country.code;

            return (
              <Pressable
                key={country.code}
                accessibilityRole="button"
                onPress={() => setCountry(country.code)}
                style={[styles.countryRow, selected ? styles.countryRowSelected : null]}
              >
                <Text style={styles.flag}>{country.flag}</Text>
                <Text style={[styles.countryName, typography.base]}>{country.name}</Text>
                <Text style={[styles.countryCode, typography.sm]}>{selected ? 'Selected' : country.code}</Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <PrismButton
        label="Continue"
        disabled={!state.selectedCountryCode}
        onPress={() => router.push('/onboarding/conversation')}
      />
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
  search: {
    borderRadius: 18,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  countryList: {
    gap: 10,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.bgElevated,
  },
  countryRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.chipSelected,
  },
  flag: {
    fontSize: 20,
  },
  countryName: {
    flex: 1,
    color: colors.textPrimary,
  },
  countryCode: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
