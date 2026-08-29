import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, ImageStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';

// ─────────────────────────────────────────────────────────────
//  BrandLogo — Official Phishing Sense Brand Identity
//  Source of truth: Official Eye + Neural Brain Logo
// ─────────────────────────────────────────────────────────────

const OFFICIAL_LOGO = require('../../../assets/images/logo.png');

export type LogoVariant = 'mark-only' | 'horizontal' | 'vertical';
export type LogoSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface BrandLogoProps {
  variant?:   LogoVariant;
  size?:      LogoSize;
  showTag?:   boolean;
  style?:     ViewStyle;
  imageStyle?: ImageStyle;
}

const DIMENSIONS: Record<LogoSize, { imgSize: number; titleSize: number; tagSize: number; radius: number }> = {
  xs: { imgSize: 28,  titleSize: 13, tagSize: 10, radius: 6 },
  sm: { imgSize: 38,  titleSize: 16, tagSize: 11, radius: 8 },
  md: { imgSize: 52,  titleSize: 20, tagSize: 12, radius: 12 },
  lg: { imgSize: 76,  titleSize: 26, tagSize: 14, radius: 18 },
  xl: { imgSize: 100, titleSize: 32, tagSize: 16, radius: 24 },
};

export function BrandLogo({
  variant = 'horizontal',
  size    = 'md',
  showTag = false,
  style,
  imageStyle,
}: BrandLogoProps) {
  const { theme } = useTheme();
  const { t }     = useTranslation();

  const cfg = DIMENSIONS[size];

  const logoImage = (
    <Image
      source={OFFICIAL_LOGO}
      style={[
        styles.image,
        {
          width:        cfg.imgSize,
          height:       cfg.imgSize,
          borderRadius: cfg.radius,
        },
        imageStyle,
      ]}
      resizeMode="contain"
      accessibilityLabel="Phishing Sense Official Logo"
    />
  );

  if (variant === 'mark-only') {
    return (
      <View style={[styles.markOnlyWrap, style]}>
        {logoImage}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        variant === 'horizontal' ? styles.row : styles.column,
        style,
      ]}
      accessible
      accessibilityRole="header"
      accessibilityLabel="Phishing Sense Brand Logo"
    >
      <View style={variant === 'horizontal' ? styles.imgWrapHorizontal : styles.imgWrapVertical}>
        {logoImage}
      </View>

      <View style={variant === 'horizontal' ? styles.textWrapHorizontal : styles.textWrapVertical}>
        <Text
          style={[
            styles.title,
            {
              fontFamily: theme.fonts.headingBold,
              color:      theme.colors.textPrimary,
              fontSize:   cfg.titleSize,
            },
          ]}
        >
          {t('app.name')}
        </Text>
        {showTag && (
          <Text
            style={[
              styles.tagline,
              {
                fontFamily: theme.fonts.bodyMedium,
                color:      theme.colors.primaryDark,
                fontSize:   cfg.tagSize,
              },
            ]}
          >
            {t('app.tagline')}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markOnlyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    backgroundColor: 'transparent',
  },
  imgWrapVertical: {
    marginBottom: 8,
  },
  imgWrapHorizontal: {
    marginEnd: 10,
  },
  textWrapVertical: {
    alignItems: 'center',
  },
  textWrapHorizontal: {
    justifyContent: 'center',
  },
  title: {
    letterSpacing: -0.3,
  },
  tagline: {
    marginTop: 2,
    letterSpacing: 0.2,
  },
});

