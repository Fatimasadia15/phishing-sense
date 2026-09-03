import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { IS_WEB } from '../../src/theme/responsive';
import { shadow } from '../../src/theme/tokens';
import { useAuth } from '../../src/store/AuthContext';
import { useApp } from '../../src/store/AppContext';
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
  const { stats, textSize, refreshHistory } = useApp();
  const insets = useSafeAreaInsets();
  const isLarge = textSize === 'large';
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshHistory();
    setRefreshing(false);
  }, [refreshHistory]);

  const doSignOut = React.useCallback(async () => {
    try {
      await logout();
    } finally {
      router.replace('/(auth)/login');
    }
  }, [logout]);

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      const confirmMsg = `${t('profile.signOut')}\n\n${t('profile.signOutConfirm')}`;
      if (typeof window !== 'undefined' ? window.confirm(confirmMsg) : true) {
        doSignOut();
      }
      return;
    }

    Alert.alert(
      t('profile.signOut'),
      t('profile.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.signOut'),
          style: 'destructive',
          onPress: doSignOut,
        },
      ]
    );
  };

  const getInitials = (name?: string | null) => {
    if (!name || !name.trim()) return t('profile.initialsFallback');
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = user?.name?.trim() || t('profile.defaultName');
  const displayEmail = user?.email?.trim() || t('profile.defaultEmail');

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
              {t('profile.screenLabel')}
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
              ...shadow('sm', { opacity: 0.08, radius: 10, offsetY: 4, elevation: 3 }),
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
                  <Badge variant="primary" label={t('profile.activeLabel')} dot />
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
                {t('profile.guardianText')}
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
            {t('profile.quickTools')}
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
                ...shadow('sm', { opacity: 0.05, radius: 6, offsetY: 2, elevation: 2 }),
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('profile.tools.checkLink')}
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
              {t('profile.tools.checkLink')}
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
              {t('profile.tools.checkLinkSub')}
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
                ...shadow('sm', { opacity: 0.05, radius: 6, offsetY: 2, elevation: 2 }),
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('profile.tools.askSense')}
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
              {t('profile.tools.askSense')}
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
              {t('profile.tools.askSenseSub')}
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
                ...shadow('sm', { opacity: 0.05, radius: 6, offsetY: 2, elevation: 2 }),
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('profile.tools.panicMode')}
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
              {t('profile.tools.panicMode')}
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
              {t('profile.tools.panicModeSub')}
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
            {t('profile.preferences')}
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
                {t('profile.themeSizeSub', { theme: themeLabel, textSize })}
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
                {t(`languages.${language}`)}
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
            {t('profile.supportInfo')}
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
            accessibilityLabel={t('profile.menu.help')}
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
                {t('profile.helpSub')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          {/* Privacy & Guidelines */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                t('profile.menu.privacy'),
                t('profile.privacyAlert')
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
                {t('profile.privacySub')}
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
            {t('profile.version')}
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
    paddingHorizontal: IS_WEB ? 14 : 20,
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
    borderRadius: IS_WEB ? 16 : 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: IS_WEB ? 12 : 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBg: {
    width: IS_WEB ? 48 : 58,
    height: IS_WEB ? 48 : 58,
    borderRadius: IS_WEB ? 24 : 29,
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
    paddingHorizontal: IS_WEB ? 12 : 16,
    paddingVertical: IS_WEB ? 8 : 10,
    borderTopWidth: 1,
  },
  guardianInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IS_WEB ? 8 : 10,
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
    gap: IS_WEB ? 8 : 10,
    marginBottom: 20,
  },
  toolCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: IS_WEB ? 11 : 14,
    paddingHorizontal: IS_WEB ? 8 : 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconWrap: {
    width: IS_WEB ? 32 : 38,
    height: IS_WEB ? 32 : 38,
    borderRadius: IS_WEB ? 16 : 19,
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
    paddingVertical: IS_WEB ? 12 : 15,
    paddingHorizontal: IS_WEB ? 12 : 16,
    borderBottomWidth: 1,
    gap: IS_WEB ? 10 : 14,
  },
  rowIconWrap: {
    width: IS_WEB ? 34 : 40,
    height: IS_WEB ? 34 : 40,
    borderRadius: IS_WEB ? 17 : 20,
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
    gap: IS_WEB ? 8 : 10,
    borderRadius: IS_WEB ? 14 : 18,
    borderWidth: 1.5,
    paddingVertical: IS_WEB ? 12 : 16,
    paddingHorizontal: IS_WEB ? 14 : 20,
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




