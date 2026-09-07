import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { useApp } from '../../src/store/AppContext';
import { useAuth } from '../../src/store/AuthContext';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

export default function SettingsScreen() {
  const { theme, mode, setMode } = useTheme();
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const { user, updatePassword, isLoading: authLoading, authError, clearAuthError } = useAuth();
  const {
    textSize,
    setTextSize,
    notificationsOn,
    setNotifications,
    clearHistory,
    scanHistory,
  } = useApp();
  const insets = useSafeAreaInsets();
  const isLarge = textSize === 'large';

  // State for Change Password section
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState<string | undefined>();
  const [passSuccess, setPassSuccess] = useState(false);

  // Security Toggles State
  const [biometricLock, setBiometricLock] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(true);

  const themeOptions = [
    { key: 'light', label: t('settings.appearance.themeLight'), icon: 'sunny-outline' },
    { key: 'dark', label: t('settings.appearance.themeDark'), icon: 'moon-outline' },
    { key: 'system', label: t('settings.appearance.themeSystem'), icon: 'phone-portrait-outline' },
  ] as const;

  const textSizeOptions = [
    { key: 'normal', label: t('settings.appearance.textNormal') },
    { key: 'large', label: t('settings.appearance.textLarge') },
  ] as const;

  const handleUpdatePassword = async () => {
    clearAuthError();
    setPassError(undefined);

    if (!newPassword) {
      setPassError(t('auth.validation.required'));
      return;
    }
    if (newPassword.length < 8) {
      setPassError(t('auth.validation.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError(t('auth.validation.passwordMismatch'));
      return;
    }

    try {
      await updatePassword(newPassword);
      setPassSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(false), 4000);
    } catch {
      // Auth error handled by context
    }
  };

  const handleClearHistory = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to clear all scan history? This action cannot be undone.')) {
        clearHistory();
      }
      return;
    }
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all scan history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear History', style: 'destructive', onPress: clearHistory },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Header title={t('settings.title')} showBack onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: insets.bottom + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Profile Header Card */}
        <Card variant="elevated" padding={16} style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatarWrap, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: theme.colors.primaryDark }]}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: theme.colors.textPrimary, fontFamily: theme.fonts.headingBold }]}>
                {user?.name || 'Phishing Sense User'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary, fontFamily: theme.fonts.body }]}>
                {user?.email || 'Secured Account'}
              </Text>
            </View>
          </View>
        </Card>

        {/* ── 1. Account & Security Settings ────────────────── */}
        <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary, fontFamily: theme.fonts.headingBold, fontSize: isLarge ? 19 : 17 }]}>
          Account Security & Password
        </Text>

        <Card variant="default" padding={16} style={styles.card}>
          <TouchableOpacity
            style={styles.settingActionRow}
            onPress={() => {
              setShowPasswordChange(!showPasswordChange);
              clearAuthError();
              setPassError(undefined);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="key-outline" size={20} color={theme.colors.primary} />
              <View>
                <Text style={[styles.actionTitle, { color: theme.colors.textPrimary, fontFamily: theme.fonts.bodySemibold, fontSize: isLarge ? 16 : 14 }]}>
                  Change Account Password
                </Text>
                <Text style={[styles.actionSub, { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: isLarge ? 13 : 11 }]}>
                  Set a new password for your Supabase login
                </Text>
              </View>
            </View>
            <Ionicons name={showPasswordChange ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {showPasswordChange && (
            <View style={styles.passwordForm}>
              {passSuccess ? (
                <View style={[styles.successBanner, { backgroundColor: theme.colors.mintLight }]}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.mintDark} />
                  <Text style={[styles.successBannerText, { color: theme.colors.mintDark, fontFamily: theme.fonts.bodyMedium }]}>
                    Password updated successfully!
                  </Text>
                </View>
              ) : null}

              <Input
                label="New Password"
                placeholder="Enter new password (min 8 chars)"
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  if (passError) setPassError(undefined);
                  if (authError) clearAuthError();
                }}
                secureEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={passError}
                style={{ marginBottom: 12 }}
              />

              <Input
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (passError) setPassError(undefined);
                  if (authError) clearAuthError();
                }}
                secureEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={{ marginBottom: 16 }}
              />

              {authError ? (
                <Text style={[styles.errorText, { color: theme.colors.dangerText, fontFamily: theme.fonts.bodyMedium }]}>
                  {authError}
                </Text>
              ) : null}

              <Button
                label="Save New Password"
                onPress={handleUpdatePassword}
                loading={authLoading}
                variant="primary"
                size="md"
                fullWidth
              />
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginEnd: 12 }}>
              <Text style={[styles.actionTitle, { color: theme.colors.textPrimary, fontFamily: theme.fonts.bodySemibold, fontSize: isLarge ? 16 : 14 }]}>
                Biometric / App Lock
              </Text>
              <Text style={[styles.actionSub, { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: isLarge ? 13 : 11 }]}>
                Require passcode / fingerprint on app launch
              </Text>
            </View>
            <Switch
              value={biometricLock}
              onValueChange={setBiometricLock}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* ── 2. Appearance & Accessibility ──────────────────── */}
        <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary, fontFamily: theme.fonts.headingBold, fontSize: isLarge ? 19 : 17 }]}>
          {t('settings.appearance.title')}
        </Text>

        <Card variant="default" padding={16} style={styles.card}>
          <Text style={[styles.optionLabel, { color: theme.colors.textPrimary, fontFamily: theme.fonts.bodySemibold, fontSize: isLarge ? 16 : 14, marginBottom: 12 }]}>
            {t('settings.appearance.theme')}
          </Text>

          <View style={styles.themeOptionsGrid}>
            {themeOptions.map((opt) => {
              const isSelected = mode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setMode(opt.key)}
                  style={[
                    styles.themeBtn,
                    {
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.backgroundCard,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name={opt.icon as any} size={22} color={isSelected ? theme.colors.primaryDark : theme.colors.textSecondary} />
                  <Text style={{ fontFamily: isSelected ? theme.fonts.bodySemibold : theme.fonts.body, color: isSelected ? theme.colors.primaryDark : theme.colors.textPrimary, fontSize: isLarge ? 14 : 12 }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.optionLabel, { color: theme.colors.textPrimary, fontFamily: theme.fonts.bodySemibold, fontSize: isLarge ? 16 : 14, marginTop: 18, marginBottom: 10 }]}>
            {t('settings.appearance.textSize')}
          </Text>

          <View style={styles.sizeOptionsWrap}>
            {textSizeOptions.map((opt) => {
              const isSelected = textSize === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setTextSize(opt.key)}
                  style={[
                    styles.sizeOption,
                    {
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.backgroundCard,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name={isSelected ? 'radio-button-on' : 'radio-button-off-outline'} size={18} color={isSelected ? theme.colors.primaryDark : theme.colors.textTertiary} />
                  <Text style={{ fontFamily: isSelected ? theme.fonts.bodySemibold : theme.fonts.body, color: isSelected ? theme.colors.primaryDark : theme.colors.textPrimary, fontSize: isLarge ? 15 : 13 }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* ── 3. Language & Regional Settings ───────────────── */}
        <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary, fontFamily: theme.fonts.headingBold, fontSize: isLarge ? 19 : 17 }]}>
          {t('settings.language.title')}
        </Text>

        <Card variant="default" padding={16} style={styles.card}>
          {[
            { code: 'en' as const, label: t('settings.language.english') },
            { code: 'ur' as const, label: t('settings.language.urdu') },
          ].map((lang, idx) => {
            const isSelected = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => changeLanguage(lang.code)}
                style={[styles.langRow, idx > 0 && { borderTopColor: theme.colors.border, borderTopWidth: 1, paddingTop: 12, marginTop: 12 }]}
                activeOpacity={0.7}
              >
                <Text style={{ fontFamily: isSelected ? theme.fonts.bodySemibold : theme.fonts.body, color: isSelected ? theme.colors.primaryDark : theme.colors.textPrimary, fontSize: isLarge ? 17 : 15 }}>
                  {lang.label}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </Card>

        {/* ── 4. Notifications & Alerts ──────────────────────── */}
        <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary, fontFamily: theme.fonts.headingBold, fontSize: isLarge ? 19 : 17 }]}>
          {t('settings.notifications.title')}
        </Text>

        <Card variant="default" padding={16} style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginEnd: 12 }}>
              <Text style={[styles.actionTitle, { color: theme.colors.textPrimary, fontFamily: theme.fonts.bodySemibold, fontSize: isLarge ? 17 : 15 }]}>
                {t('settings.notifications.push')}
              </Text>
              <Text style={[styles.actionSub, { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: isLarge ? 14 : 12 }]}>
                {t('settings.notifications.pushSub')}
              </Text>
            </View>
            <Switch
              value={notificationsOn}
              onValueChange={setNotifications}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* ── 5. Privacy & Data Controls ─────────────────────── */}
        <Text style={[styles.sectionHeading, { color: theme.colors.textPrimary, fontFamily: theme.fonts.headingBold, fontSize: isLarge ? 19 : 17 }]}>
          Privacy & Data Control
        </Text>

        <Card variant="default" padding={16} style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginEnd: 12 }}>
              <Text style={[styles.actionTitle, { color: theme.colors.textPrimary, fontFamily: theme.fonts.bodySemibold, fontSize: isLarge ? 16 : 14 }]}>
                Client-Side Data Redaction
              </Text>
              <Text style={[styles.actionSub, { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: isLarge ? 13 : 11 }]}>
                Automatically strips OTPs, PINs, and CNICs before cloud checks
              </Text>
            </View>
            <Switch
              value={privacyMode}
              onValueChange={setPrivacyMode}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <TouchableOpacity style={styles.settingActionRow} onPress={handleClearHistory} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.dangerText} />
              <View>
                <Text style={[styles.actionTitle, { color: theme.colors.dangerText, fontFamily: theme.fonts.bodySemibold, fontSize: isLarge ? 16 : 14 }]}>
                  Clear Scan History
                </Text>
                <Text style={[styles.actionSub, { color: theme.colors.textSecondary, fontFamily: theme.fonts.body, fontSize: isLarge ? 13 : 11 }]}>
                  {scanHistory.length} saved scans in local device storage
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* App Version & Engine Info */}
        <View style={styles.versionWrap}>
          <Text style={[styles.versionText, { color: theme.colors.textTertiary, fontFamily: theme.fonts.body, fontSize: isLarge ? 13 : 12 }]}>
            Phishing Sense Engine v1.2.0 (Build 104)
          </Text>
          <Text style={[styles.versionSub, { color: theme.colors.textTertiary, fontFamily: theme.fonts.body, fontSize: isLarge ? 12 : 11 }]}>
            Protected by Real-Time Telephony & Heuristic Intelligence
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  profileCard: {
    marginBottom: 20,
    borderRadius: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 17,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeading: {
    letterSpacing: -0.2,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    marginBottom: 20,
  },
  settingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  actionTitle: {
    letterSpacing: -0.1,
  },
  actionSub: {
    marginTop: 2,
    lineHeight: 16,
  },
  passwordForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  successBannerText: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    letterSpacing: -0.1,
  },
  themeOptionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  sizeOptionsWrap: {
    gap: 8,
  },
  sizeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  versionWrap: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
    gap: 4,
  },
  versionText: {
    letterSpacing: 0.2,
  },
  versionSub: {
    opacity: 0.8,
  },
});
