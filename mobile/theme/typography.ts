// Three text size presets — chosen during onboarding, adjustable in settings.
// Using a multiplier approach so all text scales consistently.

export type TextSizePreset = 'small' | 'medium' | 'large';

const scales: Record<TextSizePreset, number> = {
  small: 0.875,
  medium: 1,
  large: 1.2,
};

export function getTypography(preset: TextSizePreset = 'medium') {
  const s = scales[preset];
  return {
    xs:   { fontSize: Math.round(11 * s), lineHeight: Math.round(16 * s) },
    sm:   { fontSize: Math.round(13 * s), lineHeight: Math.round(20 * s) },
    base: { fontSize: Math.round(15 * s), lineHeight: Math.round(24 * s) },
    md:   { fontSize: Math.round(17 * s), lineHeight: Math.round(26 * s) },
    lg:   { fontSize: Math.round(20 * s), lineHeight: Math.round(30 * s) },
    xl:   { fontSize: Math.round(24 * s), lineHeight: Math.round(34 * s) },
    '2xl':{ fontSize: Math.round(30 * s), lineHeight: Math.round(40 * s) },
  };
}

// Weight constants (string literals for RN fontWeight)
export const fontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
};
