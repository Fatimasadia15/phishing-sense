import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/theme/ThemeContext';
import { Button } from '../../src/components/ui/Button';
import { LanguageToggle } from '../../src/components/ui/LanguageToggle';
import { SenseOrb } from '../../src/components/ui/SenseOrb';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key:      'slide1',
    badge:    'Protection',
    titleKey: 'onboarding.slide1.title',
    subKey:   'onboarding.slide1.subtitle',
    orbState: 'idle' as const,
  },
  {
    key:      'slide2',
    badge:    'Scan Anything',
    titleKey: 'onboarding.slide2.title',
    subKey:   'onboarding.slide2.subtitle',
    orbState: 'analyzing' as const,
  },
  {
    key:      'slide3',
    badge:    'AI Companion',
    titleKey: 'onboarding.slide3.title',
    subKey:   'onboarding.slide3.subtitle',
    orbState: 'listening' as const,
  },
];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const { t }     = useTranslation();
  const insets    = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrent(idx);
  };

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (current + 1) * width, animated: true });
    } else {
      router.replace('/(auth)/login');
    }
  };

  const isLast = current === SLIDES.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Background Soft Glow */}
      <View
        style={[
          styles.glowBackdrop,
          { backgroundColor: theme.colors.primaryLight },
        ]}
      />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <LanguageToggle />
        {!isLast && (
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.skip,
                { color: theme.colors.textTertiary, fontFamily: theme.fonts.bodyMedium },
              ]}
            >
              {t('common.skip')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slide Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            {/* Center Layered Sense Orb */}
            <View style={styles.orbWrap}>
              <SenseOrb state={slide.orbState} size="xl" />
            </View>

            {/* Feature Tag */}
            <View
              style={[
                styles.slideBadge,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Text
                style={[
                  styles.slideBadgeText,
                  {
                    fontFamily: theme.fonts.bodySemibold,
                    color: theme.colors.primaryDark,
                  },
                ]}
              >
                {slide.badge}
              </Text>
            </View>

            {/* Typography */}
            <Text
              style={[
                styles.title,
                {
                  fontFamily: theme.fonts.headingBold,
                  color: theme.colors.textPrimary,
                },
              ]}
            >
              {t(slide.titleKey)}
            </Text>
            <Text
              style={[
                styles.sub,
                {
                  fontFamily: theme.fonts.body,
                  color: theme.colors.textSecondary,
                },
              ]}
            >
              {t(slide.subKey)}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        {/* Dot Indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === current ? theme.colors.primary : theme.colors.border,
                  width: i === current ? 26 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <Button
          label={isLast ? t('onboarding.getStarted') : t('common.next')}
          onPress={goNext}
          variant="primary"
          size="lg"
          fullWidth
          style={{ marginTop: 24 }}
        />

        {isLast && (
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            style={styles.signInLink}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.signInText,
                { color: theme.colors.primaryDark, fontFamily: theme.fonts.bodyMedium },
              ]}
            >
              {t('onboarding.signIn')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glowBackdrop: {
    position: 'absolute',
    top: -width * 0.3,
    alignSelf: 'center',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    opacity: 0.45,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  skip: { fontSize: 15 },
  scroll: { flex: 1 },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  orbWrap: {
    marginBottom: 32,
  },
  slideBadge: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 14,
  },
  slideBadgeText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.85,
    paddingHorizontal: 12,
  },
  bottom: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  signInLink: { marginTop: 14 },
  signInText: { fontSize: 14 },
});
