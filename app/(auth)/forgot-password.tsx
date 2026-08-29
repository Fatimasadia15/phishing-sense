import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAuth } from '../../src/store/AppContext';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Header } from '../../src/components/ui/Header';
import { SenseOrb } from '../../src/components/ui/SenseOrb';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { sendResetEmail, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError(t('auth.validation.required'));
      return;
    }
    if (!email.includes('@')) {
      setError(t('auth.validation.invalidEmail'));
      return;
    }
    try {
      await sendResetEmail(email);
      setSubmitted(true);
    } catch (e) {
      console.warn('Reset error', e);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <Header title={t('auth.forgotPassword.title')} showBack onBack={() => router.back()} />

      {/* Background Soft Glow */}
      <View
        style={[
          styles.glowBackdrop,
          { backgroundColor: theme.colors.primaryLight },
        ]}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card
          style={[styles.card, { backgroundColor: theme.colors.backgroundCard }]}
          variant="elevated"
          padding={24}
        >
          {submitted ? (
            <View style={styles.successBox}>
              <View style={styles.orbSuccessWrap}>
                <SenseOrb state="result" size="md" />
              </View>
              <Text
                style={[
                  styles.successTitle,
                  {
                    fontFamily: theme.fonts.headingBold,
                    color: theme.colors.textPrimary,
                  },
                ]}
              >
                {t('auth.forgotPassword.successTitle')}
              </Text>
              <Text
                style={[
                  styles.successMessage,
                  {
                    fontFamily: theme.fonts.body,
                    color: theme.colors.textSecondary,
                  },
                ]}
              >
                {t('auth.forgotPassword.successMessage', { email })}
              </Text>
              <Button
                label={t('auth.forgotPassword.backToLogin')}
                onPress={() => router.replace('/(auth)/login')}
                variant="primary"
                size="lg"
                fullWidth
                style={{ marginTop: 20 }}
              />
            </View>
          ) : (
            <>
              <View style={styles.iconHero}>
                <SenseOrb state="idle" size="sm" />
              </View>

              <Text
                style={[
                  styles.subtitle,
                  {
                    fontFamily: theme.fonts.body,
                    color: theme.colors.textSecondary,
                  },
                ]}
              >
                {t('auth.forgotPassword.subtitle')}
              </Text>

              <Input
                label={t('auth.forgotPassword.email')}
                placeholder={t('auth.forgotPassword.emailPlaceholder')}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(undefined);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={error}
                style={{ marginBottom: 20 }}
              />

              <Button
                label={t('auth.forgotPassword.sendLink')}
                onPress={handleSubmit}
                loading={isLoading}
                variant="primary"
                size="lg"
                fullWidth
                icon={<Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" />}
              />

              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backLink}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={[
                    styles.backLinkText,
                    {
                      color: theme.colors.primaryDark,
                      fontFamily: theme.fonts.bodyMedium,
                    },
                  ]}
                >
                  {t('auth.forgotPassword.backToLogin')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glowBackdrop: {
    position: 'absolute',
    top: -width * 0.25,
    alignSelf: 'center',
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: (width * 1.1) / 2,
    opacity: 0.35,
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 16,
    flexGrow: 1,
  },
  card: {
    marginTop: 8,
    borderRadius: 24,
  },
  iconHero: {
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  backLink: {
    alignSelf: 'center',
    marginTop: 18,
  },
  backLinkText: {
    fontSize: 14,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  orbSuccessWrap: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
