import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { useApp } from '../../src/store/AppContext';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';

export default function SettingsScreen() {
  const { theme, mode, setMode } = useTheme();
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const {
    textSize,
    setTextSize,
    notificationsOn,
    setNotifications,
  } = useApp();
  const insets = useSafeAreaInsets();
  const isLarge = textSize === 'large';

  const themeOptions = [
    { key: 'light', label: t('settings.appearance.themeLight'), icon: 'sunny-outline' },
    { key: 'dark', label: t('settings.appearance.themeDark'), icon: 'moon-outline' },
    { key: 'system', label: t('settings.appearance.themeSystem'), icon: 'phone-portrait-outline' },
  ] as const;

  const textSizeOptions = [
    { key: 'normal', label: t('settings.appearance.textNormal') },
    { key: 'large', label: t('settings.appearance.textLarge') },
  ] as const;

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
        {/* Appearance Section */}
        <Text
          style={[
            styles.sectionHeading,
            {
              fontFamily: theme.fonts.headingBold,
              color: theme.colors.textPrimary,
              fontSize: isLarge ? 19 : 17,
            },
          ]}
        >
          {t('settings.appearance.title')}
        </Text>

        <Card variant="default" padding={16} style={styles.card}>
          <Text
            style={[
              styles.optionLabel,
              {
                fontFamily: theme.fonts.bodySemibold,
                color: theme.colors.textPrimary,
                fontSize: isLarge ? 16 : 14,
                marginBottom: 12,
              },
            ]}
          >
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
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                      backgroundColor: isSelected
                        ? theme.colors.primaryLight
                        : theme.colors.backgroundCard,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={22}
                    color={
                      isSelected
                        ? theme.colors.primaryDark
                        : theme.colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.themeBtnText,
                      {
                        fontFamily: isSelected
                          ? theme.fonts.bodySemibold
                          : theme.fonts.body,
                        color: isSelected
                          ? theme.colors.primaryDark
                          : theme.colors.textPrimary,
                        fontSize: isLarge ? 14 : 12,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Text Size Accessibility Selector */}
          <Text
            style={[
              styles.optionLabel,
              {
                fontFamily: theme.fonts.bodySemibold,
                color: theme.colors.textPrimary,
                fontSize: isLarge ? 16 : 14,
                marginTop: 18,
                marginBottom: 10,
              },
            ]}
          >
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
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                      backgroundColor: isSelected
                        ? theme.colors.primaryLight
                        : theme.colors.backgroundCard,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={
                      isSelected
                        ? 'radio-button-on'
                        : 'radio-button-off-outline'
                    }
                    size={18}
                    color={
                      isSelected
                        ? theme.colors.primaryDark
                        : theme.colors.textTertiary
                    }
                  />
                  <Text
                    style={[
                      styles.sizeOptionText,
                      {
                        fontFamily: isSelected
                          ? theme.fonts.bodySemibold
                          : theme.fonts.body,
                        color: isSelected
                          ? theme.colors.primaryDark
                          : theme.colors.textPrimary,
                        fontSize: isLarge ? 15 : 13,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Language Section */}
        <Text
          style={[
            styles.sectionHeading,
            {
              fontFamily: theme.fonts.headingBold,
              color: theme.colors.textPrimary,
              fontSize: isLarge ? 19 : 17,
            },
          ]}
        >
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
                style={[
                  styles.langRow,
                  idx > 0 && {
                    borderTopColor: theme.colors.border,
                    borderTopWidth: 1,
                    paddingTop: 12,
                    marginTop: 12,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.langLabel,
                    {
                      fontFamily: isSelected
                        ? theme.fonts.bodySemibold
                        : theme.fonts.body,
                      color: isSelected
                        ? theme.colors.primaryDark
                        : theme.colors.textPrimary,
                      fontSize: isLarge ? 17 : 15,
                    },
                  ]}
                >
                  {lang.label}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            );
          })}

          <Text
            style={[
              styles.langNotice,
              {
                fontFamily: theme.fonts.body,
                color: theme.colors.textTertiary,
                fontSize: isLarge ? 13 : 11,
              },
            ]}
          >
            {t('settings.language.changeNote')}
          </Text>
        </Card>

        {/* Notifications Section */}
        <Text
          style={[
            styles.sectionHeading,
            {
              fontFamily: theme.fonts.headingBold,
              color: theme.colors.textPrimary,
              fontSize: isLarge ? 19 : 17,
            },
          ]}
        >
          {t('settings.notifications.title')}
        </Text>

        <Card variant="default" padding={16} style={styles.card}>
          <View style={styles.notifRow}>
            <View style={{ flex: 1, marginEnd: 12 }}>
              <Text
                style={[
                  styles.notifTitle,
                  {
                    fontFamily: theme.fonts.bodySemibold,
                    color: theme.colors.textPrimary,
                    fontSize: isLarge ? 17 : 15,
                  },
                ]}
              >
                {t('settings.notifications.push')}
              </Text>
              <Text
                style={[
                  styles.notifSub,
                  {
                    fontFamily: theme.fonts.body,
                    color: theme.colors.textSecondary,
                    fontSize: isLarge ? 14 : 12,
                  },
                ]}
              >
                {t('settings.notifications.pushSub')}
              </Text>
            </View>
            <Switch
              value={notificationsOn}
              onValueChange={setNotifications}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* App Version Info */}
        <View style={styles.versionWrap}>
          <Text
            style={[
              styles.versionText,
              {
                fontFamily: theme.fonts.body,
                color: theme.colors.textTertiary,
                fontSize: isLarge ? 13 : 12,
              },
            ]}
          >
            {t('settings.about.versionFull')}
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
  sectionHeading: {
    letterSpacing: -0.2,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    marginBottom: 20,
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
  themeBtnText: {},
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
  sizeOptionText: {
    flex: 1,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  langLabel: {},
  langNotice: {
    marginTop: 12,
    lineHeight: 16,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    marginBottom: 2,
  },
  notifSub: {
    lineHeight: 18,
  },
  versionWrap: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  versionText: {
    letterSpacing: 0.2,
  },
});
