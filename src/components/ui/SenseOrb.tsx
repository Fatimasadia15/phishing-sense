import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, shadow } from '../../theme/tokens';
import { WEB_SCALE, USE_NATIVE_DRIVER } from '../../theme/responsive';

// ─────────────────────────────────────────────────────────────
//  Sense Orb — Layered AI-Companion Centerpiece
//  Palette: #9FA1FF (Core Violet) → #B5BAFF (Lavender) → #AEE2FF (Sky Shimmer)
//
//  States:
//    idle      → gentle breathing halo & soft radial glow
//    listening → responsive wave ripples & sky shimmer (#AEE2FF)
//    analyzing → dynamic rotating orbital dash & accelerated lavender pulse (#B5BAFF)
//    result    → settled iridescent mint glow (#D9F9DF)
// ─────────────────────────────────────────────────────────────

export type OrbState = 'idle' | 'listening' | 'analyzing' | 'result';
export type OrbSize  = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SenseOrbProps {
  state?: OrbState;
  size?:  OrbSize;
}

const SIZES: Record<OrbSize, {
  core: number;
  innerGlow: number;
  halo1: number;
  halo2: number;
  aura: number;
}> = {
  xs: { core: Math.round(36  * WEB_SCALE), innerGlow: Math.round(28  * WEB_SCALE), halo1: Math.round(48  * WEB_SCALE), halo2: Math.round(60  * WEB_SCALE), aura: Math.round(72  * WEB_SCALE) },
  sm: { core: Math.round(64  * WEB_SCALE), innerGlow: Math.round(50  * WEB_SCALE), halo1: Math.round(84  * WEB_SCALE), halo2: Math.round(104 * WEB_SCALE), aura: Math.round(124 * WEB_SCALE) },
  md: { core: Math.round(100 * WEB_SCALE), innerGlow: Math.round(78  * WEB_SCALE), halo1: Math.round(130 * WEB_SCALE), halo2: Math.round(158 * WEB_SCALE), aura: Math.round(188 * WEB_SCALE) },
  lg: { core: Math.round(136 * WEB_SCALE), innerGlow: Math.round(106 * WEB_SCALE), halo1: Math.round(174 * WEB_SCALE), halo2: Math.round(212 * WEB_SCALE), aura: Math.round(250 * WEB_SCALE) },
  xl: { core: Math.round(168 * WEB_SCALE), innerGlow: Math.round(132 * WEB_SCALE), halo1: Math.round(216 * WEB_SCALE), halo2: Math.round(260 * WEB_SCALE), aura: Math.round(306 * WEB_SCALE) },
};

export function SenseOrb({ state = 'idle', size = 'md' }: SenseOrbProps) {
  const { theme } = useTheme();
  const dims      = SIZES[size];

  // ── Animation references ───────────────────────────────────
  const breathAnim  = useRef(new Animated.Value(1)).current;
  const auraAnim    = useRef(new Animated.Value(0.4)).current;
  const ripple1Anim = useRef(new Animated.Value(0)).current;
  const ripple2Anim = useRef(new Animated.Value(0)).current;
  const rotateAnim  = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0.7)).current;

  // ── Theme aware color anchors ──────────────────────────────
  const getColors = () => {
    switch (state) {
      case 'listening':
        return {
          coreBase:   '#7EBBE6',
          coreMid:    Colors.sky,       // #AEE2FF
          highlight:  '#E8F6FF',
          halo:       '#AEE2FF',
          aura:       'rgba(174, 226, 255, 0.35)',
          shadow:     Colors.sky,
        };
      case 'analyzing':
        return {
          coreBase:   '#8B90E8',
          coreMid:    Colors.secondary, // #B5BAFF
          highlight:  '#ECEEFF',
          halo:       '#B5BAFF',
          aura:       'rgba(181, 186, 255, 0.38)',
          shadow:     Colors.secondary,
        };
      case 'result':
        return {
          coreBase:   '#78D6A4',
          coreMid:    Colors.mint,      // #D9F9DF
          highlight:  '#F0FDF4',
          halo:       '#A4EFC1',
          aura:       'rgba(217, 249, 223, 0.45)',
          shadow:     '#52C48A',
        };
      case 'idle':
      default:
        return {
          coreBase:   '#888BFF',
          coreMid:    Colors.primary,   // #9FA1FF
          highlight:  '#FFFFFF',
          halo:       '#B5BAFF',
          aura:       'rgba(159, 161, 255, 0.32)',
          shadow:     Colors.primary,
        };
    }
  };

  const colors = getColors();

  // ── Idle Loop: gentle breathing & ethereal shimmer ─────────
  const startIdle = () => {
    ripple1Anim.setValue(0);
    ripple2Anim.setValue(0);
    rotateAnim.setValue(0);

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breathAnim, {
            toValue: 1.035,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(auraAnim, {
            toValue: 0.65,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0.95,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
        Animated.parallel([
          Animated.timing(breathAnim, {
            toValue: 0.975,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(auraAnim, {
            toValue: 0.35,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0.65,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
      ])
    ).start();
  };

  // ── Listening Loop: expanding soft ripples ──────────────────
  const startListening = () => {
    rotateAnim.setValue(0);

    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.06,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(breathAnim, {
          toValue: 0.96,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start();

    const ripple = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 0.6, duration: 250, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(anim, { toValue: 0,   duration: 950, useNativeDriver: USE_NATIVE_DRIVER }),
        ])
      ).start();
    };
    ripple(ripple1Anim, 0);
    ripple(ripple2Anim, 450);
  };

  // ── Analyzing Loop: orbital rotation + pulsing ─────────────
  const startAnalyzing = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.05,
          duration: 650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(breathAnim, {
          toValue: 0.95,
          duration: 650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(auraAnim, { toValue: 0.8, duration: 400, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(auraAnim, { toValue: 0.3, duration: 400, useNativeDriver: USE_NATIVE_DRIVER }),
      ])
    ).start();
  };

  // ── Result: serene glow ────────────────────────────────────
  const startResult = () => {
    breathAnim.stopAnimation();
    rotateAnim.stopAnimation();
    Animated.spring(breathAnim, { toValue: 1.02, useNativeDriver: USE_NATIVE_DRIVER, damping: 14 }).start();
    Animated.timing(auraAnim, { toValue: 0.55, duration: 600, useNativeDriver: USE_NATIVE_DRIVER }).start();
    Animated.timing(shimmerAnim, { toValue: 0.9, duration: 600, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  useEffect(() => {
    switch (state) {
      case 'idle':      startIdle();      break;
      case 'listening': startListening(); break;
      case 'analyzing': startAnalyzing(); break;
      case 'result':    startResult();    break;
    }
    return () => {
      breathAnim.stopAnimation();
      rotateAnim.stopAnimation();
      auraAnim.stopAnimation();
      shimmerAnim.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      style={[
        styles.wrapper,
        { width: dims.aura, height: dims.aura },
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Sense Orb — ${state}`}
    >
      {/* Layer 1: Ambient Outer Aura */}
      <Animated.View
        style={[
          styles.absoluteCenter,
          {
            width: dims.aura,
            height: dims.aura,
            borderRadius: dims.aura / 2,
            backgroundColor: colors.aura,
            opacity: auraAnim,
            transform: [{ scale: breathAnim }],
          },
        ]}
      />

      {/* Layer 2: Outer Shimmer Halo / Orbital Ring */}
      <Animated.View
        style={[
          styles.absoluteCenter,
          {
            width: dims.halo2,
            height: dims.halo2,
            borderRadius: dims.halo2 / 2,
            borderColor: colors.halo,
            borderWidth: state === 'analyzing' ? 2 : 1.2,
            borderStyle: state === 'analyzing' ? 'dashed' : 'solid',
            opacity: state === 'analyzing' ? 0.45 : (state === 'listening' ? ripple2Anim : 0.22),
            transform: [
              { scale: breathAnim },
              { rotate: state === 'analyzing' ? spin : '0deg' },
            ],
          },
        ]}
      />

      {/* Layer 3: Inner Halo Ring */}
      <Animated.View
        style={[
          styles.absoluteCenter,
          {
            width: dims.halo1,
            height: dims.halo1,
            borderRadius: dims.halo1 / 2,
            borderColor: colors.halo,
            borderWidth: 1.5,
            opacity: state === 'listening' ? ripple1Anim : 0.35,
            transform: [{ scale: breathAnim }],
          },
        ]}
      />

      {/* Layer 4: Multi-Layered Core Orb */}
      <Animated.View
        style={[
          styles.absoluteCenter,
          styles.coreContainer,
          {
            width: dims.core,
            height: dims.core,
            borderRadius: dims.core / 2,
            backgroundColor: colors.coreBase,
            ...shadow('md', {
              color: colors.shadow,
              offsetY: 6,
              opacity: theme.dark ? 0.48 : 0.28,
              radius: dims.core * 0.26,
              elevation: 10,
            }),
            transform: [{ scale: breathAnim }],
          },
        ]}
      >
        {/* Layer 4a: Internal Mid Glow (#9FA1FF → #B5BAFF) */}
        <View
          style={[
            styles.absoluteCenter,
            {
              width: dims.innerGlow,
              height: dims.innerGlow,
              borderRadius: dims.innerGlow / 2,
              backgroundColor: colors.coreMid,
              opacity: 0.92,
            },
          ]}
        />

        {/* Layer 4b: Top-Left Specular Sheen (Translucent Glass Effect) */}
        <Animated.View
          style={[
            styles.specularSheen,
            {
              width: dims.core * 0.52,
              height: dims.core * 0.38,
              borderRadius: dims.core * 0.26,
              backgroundColor: colors.highlight,
              opacity: shimmerAnim,
              top: dims.core * 0.08,
              start: dims.core * 0.12,
            },
          ]}
        />

        {/* Layer 4c: Secondary Subtle Shimmer Dot */}
        <View
          style={[
            styles.specularDot,
            {
              width: dims.core * 0.12,
              height: dims.core * 0.12,
              borderRadius: dims.core * 0.06,
              backgroundColor: '#FFFFFF',
              opacity: 0.75,
              bottom: dims.core * 0.20,
              end: dims.core * 0.22,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  absoluteCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreContainer: {
    overflow: 'hidden',
  },
  specularSheen: {
    position: 'absolute',
    transform: [{ rotate: '-25deg' }],
  },
  specularDot: {
    position: 'absolute',
  },
});
