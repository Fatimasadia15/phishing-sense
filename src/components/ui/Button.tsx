import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useApp } from '../../store/AppContext';
import { IS_WEB } from '../../theme/responsive';

// ─────────────────────────────────────────────────────────────
//  Button Component
//  Elderly-friendly: min 52px height, high contrast text
// ─────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress:    () => void;
  label:      string;
  variant?:   Variant;
  size?:      Size;
  disabled?:  boolean;
  loading?:   boolean;
  icon?:      React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  style?:     StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function Button({
  onPress,
  label,
  variant   = 'primary',
  size      = 'md',
  disabled  = false,
  loading   = false,
  icon,
  iconRight,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const { theme } = useTheme();
  const { textSize } = useApp();
  const isLarge = textSize === 'large';

  const heights: Record<Size, number> = {
    sm: IS_WEB ? 36 : 44,
    md: IS_WEB ? (isLarge ? 48 : 44) : (isLarge ? 60 : 52),
    lg: IS_WEB ? (isLarge ? 54 : 48) : (isLarge ? 68 : 60),
  };

  const fontSizes: Record<Size, number> = {
    sm: IS_WEB ? (isLarge ? 13 : 12) : (isLarge ? 15 : 13),
    md: IS_WEB ? (isLarge ? 15 : 14) : (isLarge ? 18 : 16),
    lg: IS_WEB ? (isLarge ? 17 : 15) : (isLarge ? 20 : 18),
  };

  const paddings: Record<Size, number> = {
    sm: IS_WEB ? 12 : 16,
    md: IS_WEB ? 18 : 24,
    lg: IS_WEB ? 22 : 32,
  };

  const getColors = (): { bg: string; text: string; border?: string } => {
    if (disabled) return { bg: theme.colors.border, text: theme.colors.textDisabled };
    switch (variant) {
      case 'primary':
        return { bg: theme.colors.primary, text: '#FFFFFF' };
      case 'secondary':
        return { bg: theme.colors.secondary, text: '#FFFFFF' };
      case 'ghost':
        return { bg: 'transparent', text: theme.colors.primary, border: theme.colors.border };
      case 'danger':
        return { bg: theme.colors.dangerDark, text: '#FFFFFF' };
      case 'soft':
        return { bg: theme.colors.primaryLight, text: theme.colors.primaryDark };
    }
  };

  const { bg, text, border } = getColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.base,
        {
          height:           heights[size],
          backgroundColor:  bg,
          paddingHorizontal: paddings[size],
          borderRadius:     theme.radius.pill,
          borderWidth:      border ? 1.5 : 0,
          borderColor:      border,
          width:            fullWidth ? '100%' : undefined,
          ...((variant === 'ghost' || disabled) ? {} : theme.shadows.sm),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={text} size="small" />
      ) : (
        <>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.label,
              {
                color:      text,
                fontSize:   fontSizes[size],
                fontFamily: theme.fonts.bodySemibold,
              },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  label: {
    letterSpacing: 0.2,
  },
  iconLeft: {
    marginEnd: 8,
  },
  iconRight: {
    marginStart: 8,
  },
});
