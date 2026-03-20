// Prism colour palette
// Background layers: near-black → slightly lighter surfaces
// Spectrum colours match the five layers from the vision doc

export const colors = {
  // Backgrounds
  bg: '#0A0A0F',
  bgSurface: '#141420',
  bgElevated: '#1C1C2E',
  bgInput: '#1A1A2A',

  // Text
  textPrimary: '#F0F0F5',
  textSecondary: '#8585A8',
  textMuted: '#4A4A6A',
  textInverse: '#0A0A0F',

  // Borders
  border: '#2A2A3E',
  borderFocus: '#6B4FDB',

  // Spectrum — five Prism layers
  violet: '#6B4FDB',    // The Organism
  amber: '#F59E0B',     // The Feed / syncing state
  white: '#F9FAFB',     // The Question / ready state
  blue: '#3B82F6',      // The Forces
  green: '#10B981',     // The Voice / retrieved state

  // Pulse orb states
  orbIdle: '#4A4A6A',
  orbSyncing: '#F59E0B',
  orbRetrieved: '#10B981',
  orbProcessing: '#6B4FDB',
  orbDegraded: '#F59E0B',
  orbReady: '#F9FAFB',

  // UI chrome
  primary: '#6B4FDB',
  primaryActive: '#7B5FEB',
  destructive: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',

  // Chip states
  chipDefault: '#1C1C2E',
  chipSelected: '#2D2060',
  chipSelectedBorder: '#6B4FDB',

  // Toggle
  toggleOn: '#6B4FDB',
  toggleOff: '#2A2A3E',
} as const;

export type Color = keyof typeof colors;
