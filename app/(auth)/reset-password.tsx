import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAuth } from '../../src/store/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Header } from '../../src/components/ui/Header';
import { SenseOrb } from '../../src/components/ui/SenseOrb';

const { width } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { updatePassword, isLoading, authError, clearAuthError } = useAuth();
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    clearAuthError();
  }, []);

  const handleSubmit = async () => {
    clearAuthError();
    setError(undefined);

    if (!password) {
      setError(t('auth.validation.required'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.validation.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.validation.passwordMismatch'));
      return;
    }

    try {
      await updatePassword(password);
      setSubmitted(true);
    } catch {
      // Error handles in AuthContext
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <Header title="Reset Password" showBack onBack={() => router.replace('/(auth)/login')} />

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
                Password Reset Successfully!
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
                Your password has been updated. You can now sign in with your new password.
              </Text>
              <Button
                label="Sign In Now"
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
                  styles.title,
                  {
                    fontFamily: theme.fonts.headingBold,
                    color: theme.colors.textPrimary,
                  },
                ]}
              >
                Create New Password
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  {
                    fontFamily: theme.fonts.body,
                    color: theme.colors.textSecondary,
                  },
                ]}
              >
                Please enter a secure password with at least 8 characters.
              </Text>

              <Input
                label="New Password"
                placeholder="Enter new password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(undefined);
                  if (authError) clearAuthError();
                }}
                secureEntry
                error={error}
                style={{ marginBottom: 16 }}
              />

              <Input
                label="Confirm New Password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError(undefined);
                  if (authError) clearAuthError();
                }}
                secureEntry
                style={{ marginBottom: 20 }}
              />

              {authError ? (
                <View
                  style={[
                    styles.errorBanner,
                    { backgroundColor: theme.colors.danger },
                  ]}
                >
                  <Ionicons name="alert-circle" size={16} color={theme.colors.dangerDark} />
                  <Text
                    style={[
                      styles.errorBannerText,
                      { color: theme.colors.dangerDark, fontFamily: theme.fonts.bodyMedium },
                    ]}
                  >
                    {authError}
                  </Text>
                </View>
              ) : null}

              <Button
                label="Update Password"
                onPress={handleSubmit}
                loading={isLoading}
                variant="primary"
                size="lg"
                fullWidth
                icon={<Ionicons name="key-outline" size={20} color="#FFFFFF" />}
              />
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
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 18,
    marginTop: -6,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
