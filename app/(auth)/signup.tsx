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
import { SocialAuthButtons } from '../../src/components/auth/SocialAuthButtons';

const { width } = Dimensions.get('window');

export default function SignupScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { signup, signInWithOAuth, isLoading, authError, clearAuthError, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  React.useEffect(() => {
    clearAuthError();
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = t('auth.validation.nameRequired');
    if (!email.trim()) {
      newErrors.email = t('auth.validation.required');
    } else if (!email.includes('@')) {
      newErrors.email = t('auth.validation.invalidEmail');
    }
    if (!password) {
      newErrors.password = t('auth.validation.required');
    } else if (password.length < 8) {
      newErrors.password = t('auth.validation.passwordTooShort');
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.validation.passwordMismatch');
    }
    if (!agreeTerms) {
      newErrors.terms = t('auth.validation.termsRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    try {
      await signup(name, email, password);
      router.replace('/(app)/home');
    } catch {
      // Error is set in AuthContext
    }
  };

  const handleSocialAuth = async (provider: 'google') => {
    try {
      await signInWithOAuth(provider);
    } catch {
      // Error is set in AuthContext
    }
  };

  const getPasswordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { level: 'weak', color: theme.colors.dangerDark, pct: '25%' };
    if (password.length < 8) return { level: 'fair', color: theme.colors.suspiciousDark, pct: '50%' };
    if (password.length < 10) return { level: 'good', color: theme.colors.primaryDark, pct: '75%' };
    return { level: 'strong', color: theme.colors.safeDark, pct: '100%' };
  };

  const strength = getPasswordStrength();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
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
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Control Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              { backgroundColor: theme.colors.backgroundMuted },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <LanguageToggle />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.orbWrap}>
            <SenseOrb state="idle" size="sm" />
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
            {t('auth.signup.title')}
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
            {t('auth.signup.subtitle')}
          </Text>
        </View>

        {/* Main Form Surface */}
        <Card
          variant="elevated"
          padding={24}
          style={[styles.formCard, { backgroundColor: theme.colors.backgroundCard }]}
        >
          <Input
            label={t('auth.signup.fullName')}
            placeholder={t('auth.signup.namePlaceholder')}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              if (authError) clearAuthError();
            }}
            error={errors.name}
            style={styles.fieldSpacing}
          />

          <Input
            label={t('auth.signup.email')}
            placeholder={t('auth.signup.emailPlaceholder')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              if (authError) clearAuthError();
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            style={styles.fieldSpacing}
          />

          <Input
            label={t('auth.signup.password')}
            placeholder={t('auth.signup.passwordPlaceholder')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              if (authError) clearAuthError();
            }}
            secureEntry
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.password}
            style={styles.fieldSpacing}
          />

          {strength && (
            <View style={styles.strengthBox}>
              <View style={[styles.strengthTrack, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.strengthBar,
                    {
                      width: strength.pct as any,
                      backgroundColor: strength.color,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.strengthLabel,
                  {
                    color: strength.color,
                    fontFamily: theme.fonts.bodyMedium,
                  },
                ]}
              >
                {t(`auth.signup.passwordStrength.${strength.level}`)}
              </Text>
            </View>
          )}

          <Input
            label={t('auth.signup.confirmPassword')}
            placeholder={t('auth.signup.confirmPlaceholder')}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }));
              if (authError) clearAuthError();
            }}
            secureEntry
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.confirmPassword}
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
            style={styles.termsRow}
            onPress={() => {
              setAgreeTerms((p) => !p);
              if (errors.terms) setErrors((p) => ({ ...p, terms: undefined }));
              if (authError) clearAuthError();
            }}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: errors.terms
                    ? theme.colors.dangerDark
                    : agreeTerms
                    ? theme.colors.primary
                    : theme.colors.border,
                  backgroundColor: agreeTerms ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              {agreeTerms && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
            <Text
              style={[
                styles.termsLabel,
                {
                  color: errors.terms ? theme.colors.dangerDark : theme.colors.textSecondary,
                  fontFamily: theme.fonts.body,
                },
              ]}
            >
              {t('auth.signup.terms')}
            </Text>
          </TouchableOpacity>

          <Button
            label={t('auth.signup.createAccount')}
            onPress={handleSignup}
            loading={isLoading}
            variant="primary"
            size="lg"
            fullWidth
            icon={<Ionicons name="person-add-outline" size={20} color="#FFFFFF" />}
            style={{ marginTop: 12 }}
          />
        </Card>

        <SocialAuthButtons onPress={handleSocialAuth} disabled={isLoading} />

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Text
            style={[
              styles.footerPrompt,
              { color: theme.colors.textSecondary, fontFamily: theme.fonts.body },
            ]}
          >
            {t('auth.signup.haveAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text
              style={[
                styles.footerLink,
                {
                  color: theme.colors.primaryDark,
                  fontFamily: theme.fonts.headingBold,
                },
              ]}
            >
              {t('auth.signup.signIn')}
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
    opacity: 0.4,
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  orbWrap: {
    marginBottom: 10,
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
    marginBottom: 18,
  },
  fieldSpacing: {
    marginBottom: 14,
  },
  strengthBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  strengthTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 10,
  },
  termsLabel: {
    fontSize: 13,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 14,
    marginTop: -4,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
