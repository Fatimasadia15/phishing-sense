import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';

type Provider = 'google' | 'facebook';

interface SocialAuthButtonsProps {
  onPress: (provider: Provider) => void;
  disabled?: boolean;
}

export function SocialAuthButtons({ onPress, disabled }: SocialAuthButtonsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        <Text
          style={[
            styles.dividerText,
            {
              color: theme.colors.textTertiary,
              fontFamily: theme.fonts.bodyMedium,
            },
          ]}
        >
          {t('auth.social.or')}
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
      </View>

      <TouchableOpacity
        onPress={() => onPress('google')}
        disabled={disabled}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={t('auth.social.continueWithGoogle')}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.backgroundCard,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons name="logo-google" size={20} color={theme.colors.textPrimary} />
        <Text
          style={[
            styles.buttonText,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.fonts.bodySemibold,
            },
          ]}
        >
          {t('auth.social.continueWithGoogle')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onPress('facebook')}
        disabled={disabled}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={t('auth.social.continueWithFacebook')}
        style={[
          styles.button,
          {
            backgroundColor: '#1877F2',
            borderColor: '#1877F2',
            marginTop: 12,
          },
        ]}
      >
        <Ionicons name="logo-facebook" size={22} color="#FFFFFF" />
        <Text
          style={[
            styles.buttonText,
            {
              color: '#FFFFFF',
              fontFamily: theme.fonts.bodySemibold,
            },
          ]}
        >
          {t('auth.social.continueWithFacebook')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    gap: 10,
  },
  buttonText: {
    fontSize: 15,
  },
});
