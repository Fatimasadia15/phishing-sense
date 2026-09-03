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
import { useAuth } from '../../src/store/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { LanguageToggle } from '../../src/components/ui/LanguageToggle';
import { SenseOrb } from '../../src/components/ui/SenseOrb';
import { BrandLogo } from '../../src/components/ui/BrandLogo';
import { SocialAuthButtons } from '../../src/components/auth/SocialAuthButtons';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { login, signInWithOAuth, isLoading, authError, clearAuthError } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  React.useEffect(() => {
    clearAuthError();
  }, []);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = t('auth.validation.required');
    } else if (!email.includes('@')) {
      newErrors.email = t('auth.validation.invalidEmail');
    }
    if (!password) {
      newErrors.password = t('auth.validation.required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await login(email, password);
      router.replace('/(app)/home');
    } catch {
      // Error is set in AuthContext
    }
  };

  const handleSocialAuth = async (provider: 'google') => {
    try {
      await signInWithOAuth(provider);
      router.replace('/(app)/home');
    } catch {
      // Error is set in AuthContext
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      {/* Soft Ambient Background Elements */}
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
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Control Bar */}
        <View style={styles.topBar}>
          <BrandLogo size="xs" variant="horizontal" />
          <LanguageToggle />
        </View>

        {/* Hero Section with Layered Sense Orb */}
        <View style={styles.heroSection}>
          <View style={styles.orbWrap}>
            <SenseOrb state="idle" size="md" />
          </View>
          <Text
            style={[
              styles.heading,
              {
                fontFamily: theme.fonts.headingBold,
                color: theme.colors.textPrimary,
              },
            ]}
          >
            {t('auth.login.title')}
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
            {t('auth.login.subtitle')}
          </Text>
        </View>

        {/* Main Form Surface */}
        <Card
          variant="elevated"
          padding={24}
          style={[styles.formCard, { backgroundColor: theme.colors.backgroundCard }]}
        >
          <Input
            label={t('auth.login.email')}
            placeholder={t('auth.login.emailPlaceholder')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              if (authError) clearAuthError();
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            style={styles.fieldSpacing}
          />

          <Input
            label={t('auth.login.password')}
            placeholder={t('auth.login.passwordPlaceholder')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              if (authError) clearAuthError();
            }}
            secureEntry
            error={errors.password}
            style={styles.fieldSpacing}
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

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.forgotText,
                {
                  color: theme.colors.primaryDark,
                  fontFamily: theme.fonts.bodyMedium,
                },
              ]}
            >
              {t('auth.login.forgotPassword')}
            </Text>
          </TouchableOpacity>

          <Button
            label={t('auth.login.signIn')}
            onPress={handleLogin}
            loading={isLoading}
            variant="primary"
            size="lg"
            fullWidth
            icon={<Ionicons name="log-in-outline" size={20} color="#FFFFFF" />}
            style={styles.actionBtn}
          />
        </Card>

        <SocialAuthButtons onPress={handleSocialAuth} disabled={isLoading} />

        {/* Friendly AI Protection Note */}
        <View
          style={[
            styles.trustBanner,
            {
              backgroundColor: theme.colors.mintLight,
              borderColor: theme.colors.mint,
            },
          ]}
        >
          <Ionicons name="sparkles" size={16} color={theme.colors.mintDark} />
          <Text
            style={[
              styles.trustText,
              {
                fontFamily: theme.fonts.bodyMedium,
                color: theme.colors.safeDark,
              },
            ]}
          >
            {t('auth.trustBanner')}
          </Text>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Text
            style={[
              styles.footerPrompt,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.fonts.body,
              },
            ]}
          >
            {t('auth.login.noAccount')}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/signup')}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text
              style={[
                styles.footerLink,
                {
                  color: theme.colors.primaryDark,
                  fontFamily: theme.fonts.headingBold,
                },
              ]}
            >
              {t('auth.login.createAccount')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glowBackdrop: {
    position: 'absolute',
    top: -width * 0.35,
    alignSelf: 'center',
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: (width * 1.1) / 2,
    opacity: 0.45,
  },
  scroll: {
    paddingHorizontal: 22,
    flexGrow: 1,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  brandPillText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 14,
  },
  orbWrap: {
    marginBottom: 12,
  },
  heading: {
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 24,
    marginBottom: 16,
  },
  fieldSpacing: {
    marginBottom: 16,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -2,
  },
  forgotText: {
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: -4,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 4,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 20,
  },
  trustText: {
    fontSize: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerPrompt: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
  },
});
