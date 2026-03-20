import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';

import { colors } from '@/theme';
import type { PulseOrbState } from '@/types/app';

const stateMeta: Record<PulseOrbState, { color: string; label: string; detail: string }> = {
  idle: {
    color: colors.orbIdle,
    label: 'Resting',
    detail: 'Calm and waiting on device.',
  },
  syncing: {
    color: colors.orbSyncing,
    label: 'Listening',
    detail: 'Preparing your first brief from the country mind.',
  },
  retrieved: {
    color: colors.orbRetrieved,
    label: 'Evidence found',
    detail: 'Cached evidence is ready locally.',
  },
  processing: {
    color: colors.orbProcessing,
    label: 'Thinking',
    detail: 'Turning your answers into a clear profile.',
  },
  degraded: {
    color: colors.orbDegraded,
    label: 'Working with limits',
    detail: 'Using local cache until a better sync is available.',
  },
  ready: {
    color: colors.orbReady,
    label: 'Ready',
    detail: 'The app shell is set and waiting for the first full brief.',
  },
};

interface PulseOrbProps {
  state: PulseOrbState;
  reduceMotionEnabled?: boolean;
  size?: number;
}

export function PulseOrb({
  state,
  reduceMotionEnabled = false,
  size = 144,
}: PulseOrbProps) {
  const pulse = useRef(new Animated.Value(0.92)).current;
  const halo = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    pulse.stopAnimation();
    halo.stopAnimation();

    if (reduceMotionEnabled) {
      pulse.setValue(1);
      halo.setValue(0.28);
      return;
    }

    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: state === 'ready' ? 1.05 : 1.02,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0.94,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(halo, {
            toValue: 0.36,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(halo, {
            toValue: 0.16,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [halo, pulse, reduceMotionEnabled, state]);

  const meta = stateMeta[state];

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.halo,
          {
            width: size + 36,
            height: size + 36,
            borderRadius: (size + 36) / 2,
            opacity: halo,
            backgroundColor: meta.color,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: meta.color,
            shadowColor: meta.color,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      <Text style={styles.label}>{meta.label}</Text>
      <Text style={styles.detail}>{meta.detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  halo: {
    position: 'absolute',
  },
  orb: {
    shadowOpacity: 0.45,
    shadowRadius: 26,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },
  label: {
    marginTop: 18,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  detail: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 260,
  },
});
