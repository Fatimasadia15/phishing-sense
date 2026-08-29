import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';
import type { SupportedLanguage } from '../../i18n/index';

// ─────────────────────────────────────────────────────────────
//  Language Toggle
//  Pill-style EN ↔ اردو switcher
// ─────────────────────────────────────────────────────────────

interface LanguageToggleProps {
  style?: ViewStyle;
}

const LANGS: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ur', label: 'اردو' },
];

export function LanguageToggle({ style }: LanguageToggleProps) {
  const { theme }                    = useTheme();
  const { language, changeLanguage } = useLanguage();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.backgroundMuted,
          borderRadius:    theme.radius.pill,
          borderColor:     theme.colors.border,
          borderWidth:     1,
        },
        style,
      ]}
    >
      {LANGS.map(({ code, label }) => {
        const active = language === code;
        return (
          <TouchableOpacity
            key={code}
            onPress={() => changeLanguage(code)}
            style={[
              styles.pill,
              {
                backgroundColor: active ? theme.colors.primary : 'transparent',
                borderRadius:    theme.radius.pill,
                paddingVertical:   6,
                paddingHorizontal: 14,
              },
            ]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${code === 'en' ? 'English' : 'Urdu'}`}
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.label,
                {
                  color:      active ? '#FFFFFF' : theme.colors.textSecondary,
                  fontFamily: active ? theme.fonts.bodySemibold : theme.fonts.body,
                  fontSize:   code === 'ur' ? 15 : 13,
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    alignItems:     'center',
    alignSelf:      'center',
    padding:        3,
  },
  pill: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    letterSpacing: 0.2,
  },
});
