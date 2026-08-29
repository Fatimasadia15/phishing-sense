import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAuth, useApp } from '../../src/store/AppContext';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { SenseOrb } from '../../src/components/ui/SenseOrb';
import { Badge } from '../../src/components/ui/Badge';
import { LanguageToggle } from '../../src/components/ui/LanguageToggle';
import { BrandLogo } from '../../src/components/ui/BrandLogo';

// ─────────────────────────────────────────────────────────────
//  Profile Screen — Phase 5 Refined
//  "A calm, simple control center for my Phishing Sense experience"
// ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { theme, mode } = useTheme();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user, logout } = useAuth();
  const { stats, textSize } = useApp();
  const insets = useSafeAreaInsets();
  const isLarge = textSize === 'large';

  const handleSignOut = () => {
    Alert.alert(
      t('profile.signOut'),
      t('profile.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.signOut'),
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const getInitials = (name?: string | null) => {
    if (!name || !name.trim()) return 'PS';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = user?.name?.trim() || 'Your Profile';
  const displayEmail = user?.email?.trim() || 'Account information unavailable';

  const themeLabel =
    mode === 'light'
      ? t('settings.appearance.themeLight')
      : mode === 'dark'
      ? t('settings.appearance.themeDark')
      : t('settings.appearance.themeSystem');

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 36,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Bar / Header ───────────────────────────────── */}
        <View style={styles.topBar}>
          <View>
            <Text
              style={[
                styles.screenLabel,
                {
                  fontFamily: theme.fonts.bodySemibold,
                  color: theme.colors.primary,
                  fontSize: isLarge ? 13 : 11,
                },
              ]}
            >
              PHISHING SENSE
            </Text>
            <Text
              style={[
                styles.screenTitle,
                {
                  fontFamily: theme.fonts.headingBold,
                  color: theme.colors.textPrimary,
                  fontSize: isLarge ? 28 : 24,
                },
              ]}
            >
              {t('profile.title')}
            </Text>
          </View>
          <LanguageToggle />
        </View>

        {/* ── User Profile Identity Card ─────────────────────── */}
        <View
          style={[
            styles.userCard,
            {
              backgroundColor: theme.colors.backgroundCard,
              borderColor: theme.colors.border,
              shadowColor: '#9FA1FF',
              shadowOpacity: 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            },
          ]}
        >
          <View style={styles.userCardTop}>
            {/* Avatar with Initials */}
            <View style={styles.avatarContainer}>
              <View
                style={[
                  styles.avatarBg,
                  {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    {
                      fontFamily: theme.fonts.headingBold,
                      fontSize: isLarge ? 22 : 19,
                    },
                  ]}
                >
                  {getInitials(user?.name)}
                </Text>
              </View>
            </View>

            {/* Name + Email */}
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text
                  style={[
                    styles.userName,
                    {
                      fontFamily: theme.fonts.headingBold,
                      color: theme.colors.textPrimary,
                      fontSize: isLarge ? 21 : 18,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
              </View>

              <Text
                style={[
                  styles.userEmail,
                  {
                    fontFamily: theme.fonts.body,
                    color: theme.colors.textSecondary,
                    fontSize: isLarge ? 14 : 13,
                  },
                ]}
                numberOfLines={1}
              >
                {displayEmail}
              </Text>

              {user?.name && (
                <View style={styles.statusPillRow}>
                  <Badge variant="primary" label="Active" dot />
                </View>
              )}
            </View>
          </View>

          {/* Bottom Guardian Tagline */}
          <View
            style={[
              styles.userCardFooter,
              {
                borderTopColor: theme.colors.border,
                backgroundColor: theme.colors.backgroundMuted,
              },
            ]}
          >
            <View style={styles.guardianInfoRow}>
              <View style={styles.guardianOrbMini}>
                <SenseOrb state="idle" size="xs" />
              </View>
              <Text
                style={[
                  styles.guardianText,
                  {
                    fontFamily: theme.fonts.bodyMedium,
                    color: theme.colors.textSecondary,
                    fontSize: isLarge ? 13 : 12,
                  },
                ]}
              >
                Your safety companion, whenever you need it.
              </Text>
            </View>
          </View>
        </View>

        {/* ── Quick Tools Section ────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: theme.fonts.heading,
                color: theme.colors.textPrimary,
                fontSize: isLarge ? 17 : 15,
              },
            ]}
          >
            Quick Tools
          </Text>
        </View>

        <View style={styles.toolsGrid}>
          {/* Scan Link tool */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/scan')}
            activeOpacity={0.75}
            style={[
              styles.toolCard,
              {
                backgroundColor: theme.colors.backgroundCard,
                borderColor: theme.colors.border,
                shadowColor: '#9FA1FF',
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Check Link"
          >
            <View style={[styles.toolIconWrap, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="link-outline" size={20} color={theme.colors.primaryDark} />
            </View>
            <Text
              style={[
                styles.toolTitle,
                {
                  fontFamily: theme.fonts.bodySemibold,
                  color: theme.colors.textPrimary,
                  fontSize: isLarge ? 14 : 13,
                },
              ]}
            >
              Check Link
            </Text>
            <Text
              style={[
                styles.toolSub,
                {
                  fontFamily: theme.fonts.body,
                  color: theme.colors.textTertiary,
                  fontSize: isLarge ? 12 : 11,
                },
              ]}
            >
              Verify URLs
            </Text>
          </TouchableOpacity>

          {/* Ask Sense AI tool */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/sense-ai')}
            activeOpacity={0.75}
            style={[
              styles.toolCard,
              {
                backgroundColor: theme.colors.backgroundCard,
                borderColor: theme.colors.border,
                shadowColor: '#9FA1FF',
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Ask Sense"
          >
            <View style={[styles.toolIconWrap, { backgroundColor: theme.colors.skyLight }]}>
              <Ionicons name="sparkles-outline" size={20} color={theme.colors.skyDark} />
            </View>
            <Text
              style={[
                styles.toolTitle,
                {
                  fontFamily: theme.fonts.bodySemibold,
                  color: theme.colors.textPrimary,
                  fontSize: isLarge ? 14 : 13,
                },
              ]}
            >
              Ask Sense
            </Text>
            <Text
              style={[
                styles.toolSub,
                {
                  fontFamily: theme.fonts.body,
                  color: theme.colors.textTertiary,
                  fontSize: isLarge ? 12 : 11,
                },
              ]}
            >
              AI Assistant
            </Text>
          </TouchableOpacity>

          {/* Panic Mode tool */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/panic')}
            activeOpacity={0.75}
            style={[
              styles.toolCard,
              {
                backgroundColor: theme.colors.backgroundCard,
                borderColor: theme.colors.border,
                shadowColor: '#9FA1FF',
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Panic Mode"
          >
            <View style={[styles.toolIconWrap, { backgroundColor: theme.colors.danger }]}>
              <Ionicons name="alert-circle-outline" size={20} color={theme.colors.dangerDark} />
            </View>
            <Text
              style={[
                styles.toolTitle,
                {
                  fontFamily: theme.fonts.bodySemibold,
                  color: theme.colors.dangerDark,
                  fontSize: isLarge ? 14 : 13,
                },
              ]}
            >
              Panic Mode
            </Text>
            <Text
              style={[
                styles.toolSub,
                {
                  fontFamily: theme.fonts.body,
                  color: theme.colors.textTertiary,
                  fontSize: isLarge ? 12 : 11,
                },
              ]}
            >
              Quick Help
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── App Preferences Section ────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: theme.fonts.heading,
                color: theme.colors.textPrimary,
                fontSize: isLarge ? 17 : 15,
              },
            ]}
          >
            Preferences
          </Text>
        </View>

        <View
          style={[
            styles.settingsGroupCard,
            {
              backgroundColor: theme.colors.backgroundCard,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Settings & Appearance */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings')}
            activeOpacity={0.7}
            style={[styles.settingsRow, { borderBottomColor: theme.colors.border }]}
            accessibilityRole="button"
            accessibilityLabel={t('profile.menu.settings')}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="settings-outline" size={20} color={theme.colors.primaryDark} />
            </View>
            <View style={styles.rowContent}>
              <Text
                style={[
                  styles.rowTitle,
                  {
                    fontFamily: theme.fonts.bodySemibold,
                    color: theme.colors.textPrimary,
                    fontSize: isLarge ? 16 : 14,
                  },
                ]}
              >
                {t('profile.menu.settings')}
              </Text>
              <Text
                style={[
                  styles.rowSub,
                  {
                    fontFamily: theme.fonts.body,
                    color: theme.colors.textTertiary,
                    fontSize: isLarge ? 13 : 12,
                  },
                ]}
              >
                Theme ({themeLabel}) · Text Size ({textSize})
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          {/* Language Selector */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings')}
            activeOpacity={0.7}
            style={styles.settingsRow}
            accessibilityRole="button"
            accessibilityLabel={t('profile.menu.language')}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: theme.colors.secondaryLight }]}>
              <Ionicons name="language-outline" size={20} color={theme.colors.secondaryDark} />
            </View>
            <View style={styles.rowContent}>
              <Text
                style={[
                  styles.rowTitle,
                  {
                    fontFamily: theme.fonts.bodySemibold,
                    color: theme.colors.textPrimary,
                    fontSize: isLarge ? 16 : 14,
                  },
                ]}
              >
                {t('profile.menu.language')}
              </Text>
              <Text
                style={[
                  styles.rowSub,
                  {
                    fontFamily: theme.fonts.body,
                    color: theme.colors.textTertiary,
                    fontSize: isLarge ? 13 : 12,
                  },
                ]}
              >
                {language === 'ur' ? 'اردو (Urdu)' : 'English'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* ── Support & Information Section ──────────────────── */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: theme.fonts.heading,
                color: theme.colors.textPrimary,
                fontSize: isLarge ? 17 : 15,
              },
            ]}
          >
            Support & Info
          </Text>
        </View>

        <View
          style={[
            styles.settingsGroupCard,
            {
              backgroundColor: theme.colors.backgroundCard,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Ask Sense AI */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/sense-ai')}
            activeOpacity={0.7}
            style={[styles.settingsRow, { borderBottomColor: theme.colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Ask Sense AI"
          >
            <View style={[styles.rowIconWrap, { backgroundColor: theme.colors.skyLight }]}>
              <Ionicons name="sparkles-outline" size={20} color={theme.colors.skyDark} />
            </View>
            <View style={styles.rowContent}>
              <Text
                style={[
                  styles.rowTitle,
                  {
                    fontFamily: theme.fonts.bodySemibold,
                    color: theme.colors.textPrimary,
                    fontSize: isLarge ? 16 : 14,
                  },
                ]}
              >
                {t('profile.menu.help')}
              </Text>
              <Text
                style={[
                  styles.rowSub,
                  {
                    fontFamily: theme.fonts.body,
                    color: theme.colors.textTertiary,
                    fontSize: isLarge ? 13 : 12,
                  },
                ]}
              >
                Ask questions about online safety
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          {/* Privacy & Guidelines */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                t('profile.menu.privacy'),
                'Phishing Sense helps you identify suspicious links, messages, and calls. Please review safety guidelines and always verify sources independently.'
              );
            }}
            activeOpacity={0.7}
            style={styles.settingsRow}
            accessibilityRole="button"
            accessibilityLabel={t('profile.menu.privacy')}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: theme.colors.mintLight }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.safeDark} />
            </View>
            <View style={styles.rowContent}>
              <Text
                style={[
                  styles.rowTitle,
                  {
                    fontFamily: theme.fonts.bodySemibold,
                    color: theme.colors.textPrimary,
                    fontSize: isLarge ? 16 : 14,
                  },
                ]}
              >
                {t('profile.menu.privacy')}
              </Text>
              <Text
                style={[
                  styles.rowSub,
                  {
                    fontFamily: theme.fonts.body,
                    color: theme.colors.textTertiary,
                    fontSize: isLarge ? 13 : 12,
                  },
                ]}
              >
                Safety guidelines and privacy info
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* ── Sign Out Action Card ───────────────────────────── */}
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.82}
          style={[
            styles.signOutCard,
            {
              backgroundColor: theme.colors.backgroundCard,
              borderColor: theme.colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('profile.signOut')}
        >
          <View style={[styles.signOutIconWrap, { backgroundColor: theme.colors.danger }]}>
            <Ionicons name="log-out-outline" size={20} color={theme.colors.dangerDark} />
          </View>
          <Text
            style={[
              styles.signOutLabel,
              {
                fontFamily: theme.fonts.bodySemibold,
                color: theme.colors.dangerDark,
                fontSize: isLarge ? 17 : 15,
              },
            ]}
          >
            {t('profile.signOut')}
          </Text>
        </TouchableOpacity>

        {/* ── App Version Footnote ───────────────────────────── */}
        <View style={styles.versionWrap}>
          <BrandLogo size="xs" variant="horizontal" style={{ marginBottom: 6 }} />
          <Text
            style={[
              styles.versionText,
              {
                fontFamily: theme.fonts.bodyMedium,
                color: theme.colors.textTertiary,
                fontSize: isLarge ? 12 : 11,
              },
            ]}
          >
            v1.0.0 · AI-Assisted Companion
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
  },

  // ── Top Header ──────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenLabel: {
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  screenTitle: {
    letterSpacing: -0.4,
  },

  // ── User Identity Card ──────────────────────────────────────
  userCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBg: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    letterSpacing: -0.2,
  },
  userEmail: {
    marginBottom: 6,
  },
  statusPillRow: {
    flexDirection: 'row',
  },
  userCardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  guardianInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guardianOrbMini: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardianText: {
    flex: 1,
    lineHeight: 18,
  },

  // ── Section Headers ─────────────────────────────────────────
  sectionHeader: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    letterSpacing: -0.2,
  },

  // ── Quick Tools Grid ────────────────────────────────────────
  toolsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  toolCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    marginBottom: 2,
    textAlign: 'center',
  },
  toolSub: {
    textAlign: 'center',
  },

  // ── Settings Group Card ─────────────────────────────────────
  settingsGroupCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    marginBottom: 2,
  },
  rowSub: {
    lineHeight: 16,
  },

  // ── Sign Out Card ───────────────────────────────────────────
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  signOutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutLabel: {
    letterSpacing: 0.2,
  },

  // ── Version Footnote ────────────────────────────────────────
  versionWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  versionText: {
    letterSpacing: 0.2,
  },
});




