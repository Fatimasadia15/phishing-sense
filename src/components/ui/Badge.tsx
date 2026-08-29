import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useApp } from '../../store/AppContext';

// ─────────────────────────────────────────────────────────────
//  Badge Component
//  Risk level indicator: safe / suspicious / dangerous
//  + Generic label badge
// ─────────────────────────────────────────────────────────────

type RiskLevel = 'safe' | 'suspicious' | 'dangerous';
type BadgeVariant = RiskLevel | 'primary' | 'neutral';

interface BadgeProps {
  label:     string;
  variant?:  BadgeVariant;
  dot?:      boolean;
  style?:    ViewStyle;
}

export function Badge({ label, variant = 'neutral', dot = true, style }: BadgeProps) {
  const { theme }    = useTheme();
  const { textSize } = useApp();
  const isLarge      = textSize === 'large';

  const getColors = (): { bg: string; text: string; dot: string } => {
    switch (variant) {
      case 'safe':
        return { bg: theme.colors.safe, text: theme.colors.safeText, dot: theme.colors.safeDark };
      case 'suspicious':
        return {
          bg:   theme.colors.suspicious,
          text: theme.colors.suspiciousText,
          dot:  theme.colors.suspiciousDark,
        };
      case 'dangerous':
        return {
          bg:   theme.colors.danger,
          text: theme.colors.dangerText,
          dot:  theme.colors.dangerDark,
        };
      case 'primary':
        return {
          bg:   theme.colors.primaryLight,
          text: theme.colors.primaryDark,
          dot:  theme.colors.primary,
        };
      default:
        return {
          bg:   theme.colors.backgroundMuted,
          text: theme.colors.textSecondary,
          dot:  theme.colors.textTertiary,
        };
    }
  };

  const { bg, text, dot: dotColor } = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius:    theme.radius.pill,
          paddingVertical:   isLarge ? 5 : 4,
          paddingHorizontal: isLarge ? 12 : 10,
        },
        style,
      ]}
    >
      {dot && (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      )}
      <Text
        style={[
          styles.label,
          {
            color:      text,
            fontSize:   isLarge ? 13 : 11,
            fontFamily: theme.fonts.bodySemibold,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    alignSelf:      'flex-start',
  },
  dot: {
    width:        7,
    height:       7,
    borderRadius: 4,
    marginEnd:    6,
  },
  label: {
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
