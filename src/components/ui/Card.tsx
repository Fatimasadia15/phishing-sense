import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

// ─────────────────────────────────────────────────────────────
//  Card Component
//  Soft shadow, rounded corners — the main content surface
// ─────────────────────────────────────────────────────────────

type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat' | 'colored';

interface CardProps {
  children:   React.ReactNode;
  variant?:   CardVariant;
  color?:     string;           // override background color
  padding?:   number | 'none';
  radius?:    number;
  style?:     StyleProp<ViewStyle>;
}

export function Card({
  children,
  variant = 'default',
  color,
  padding = 16,
  radius,
  style,
}: CardProps) {
  const { theme } = useTheme();

  const getBg = () => {
    if (color) return color;
    switch (variant) {
      case 'elevated':  return theme.colors.surfaceElevated;
      case 'flat':      return theme.colors.backgroundMuted;
      case 'outlined':  return theme.colors.backgroundCard;
      default:          return theme.colors.backgroundCard;
    }
  };

  const getShadow = () => {
    switch (variant) {
      case 'elevated': return theme.shadows.md;
      case 'outlined': return {};
      case 'flat':     return {};
      default:         return theme.shadows.sm;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBg(),
          borderRadius:    radius ?? theme.radius.xl,
          padding:         padding === 'none' ? 0 : padding,
          borderWidth:     variant === 'outlined' ? 1.5 : 0,
          borderColor:     theme.colors.border,
          ...getShadow(),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
