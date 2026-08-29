import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/theme/ThemeContext';
import { SenseOrb } from '../../src/components/ui/SenseOrb';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const { theme } = useTheme();
  const { t }     = useTranslation();
  const insets    = useSafeAreaInsets();

  const orbScale    = useRef(new Animated.Value(0.4)).current;
  const orbOpacity  = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(18)).current;
  const badgeScale  = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(orbScale, {
          toValue: 1,
          damping: 12,
          stiffness: 70,
          useNativeDriver: true,
        }),
        Animated.timing(orbOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScale, {
          toValue: 1,
          damping: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1400),
    ]).start(() => {
      router.replace('/(auth)/onboarding');
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Background Soft Glow Circles */}
      <View
        style={[
          styles.glowCircleTop,
          {
            backgroundColor: theme.colors.skyLight,
          },
        ]}
      />
      <View
        style={[
          styles.glowCircleBottom,
          {
            backgroundColor: theme.colors.primaryLight,
          },
        ]}
      />

      {/* Centerpiece: Layered Sense Orb */}
      <Animated.View
        style={{
          transform: [{ scale: orbScale }],
          opacity: orbOpacity,
          marginBottom: 36,
        }}
      >
        <SenseOrb state="idle" size="xl" />
      </Animated.View>

      {/* Brand Identity Wordmark */}
      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textY }],
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={[
            styles.appName,
            {
              fontFamily: theme.fonts.headingBold,
              color: theme.colors.textPrimary,
            },
          ]}
        >
          {t('app.name')}
        </Text>

        <Animated.View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.primaryLight,
              transform: [{ scale: badgeScale }],
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                fontFamily: theme.fonts.bodySemibold,
                color: theme.colors.primaryDark,
              },
            ]}
          >
            {t('app.tagline')}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom Footer Attribution */}
      <View style={[styles.bottomFooter, { paddingBottom: insets.bottom + 20 }]}>
        <Text
          style={[
            styles.footerText,
            {
              fontFamily: theme.fonts.body,
              color: theme.colors.textTertiary,
            },
          ]}
        >
          AI-Powered Scam & Phishing Protection
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircleTop: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    top: -width * 0.25,
    opacity: 0.7,
  },
  glowCircleBottom: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    bottom: -width * 0.35,
    opacity: 0.5,
  },
  appName: {
    fontSize: 34,
    letterSpacing: -0.6,
    marginBottom: 8,
    textAlign: 'center',
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 13,
    letterSpacing: 0.4,
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
