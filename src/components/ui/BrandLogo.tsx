import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, ImageStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';

// ─────────────────────────────────────────────────────────────
//  BrandLogo — Official Phishing Sense Brand Identity
//  Source of truth: Official Eye + Neural Brain Logo
// ─────────────────────────────────────────────────────────────

const OFFICIAL_LOGO = require('../../../assets/images/logo.png');
const NAVBAR_LOGO   = require('../../../assets/images/navbar-logo.png');

export type LogoVariant = 'mark-only' | 'horizontal' | 'vertical';
export type LogoSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface BrandLogoProps {
  variant?:   LogoVariant;
  size?:      LogoSize;
  showTag?:   boolean;
  style?:     ViewStyle;
  imageStyle?: ImageStyle;
}

const DIMENSIONS: Record<
  LogoSize,
  { markWidth: number; markHeight: number; imgSize: number; titleSize: number; tagSize: number; radius: number }
> = {
  xs: { markWidth: 38, markHeight: 20, imgSize: 28,  titleSize: 15, tagSize: 10, radius: 6 },
  sm: { markWidth: 48, markHeight: 25, imgSize: 38,  titleSize: 17, tagSize: 11, radius: 8 },
  md: { markWidth: 64, markHeight: 33, imgSize: 52,  titleSize: 20, tagSize: 12, radius: 12 },
  lg: { markWidth: 88, markHeight: 46, imgSize: 76,  titleSize: 26, tagSize: 14, radius: 18 },
  xl: { markWidth: 120, markHeight: 62, imgSize: 100, titleSize: 32, tagSize: 16, radius: 24 },
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
  const isHorizontalOrMark = variant === 'horizontal' || variant === 'mark-only';
  const logoSource = isHorizontalOrMark ? NAVBAR_LOGO : OFFICIAL_LOGO;

  const logoImage = (
    <Image
      source={logoSource}
      style={[
        styles.image,
        isHorizontalOrMark
          ? {
              width:        cfg.markWidth,
              height:       cfg.markHeight,
              borderRadius: 0,
            }
          : {
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

