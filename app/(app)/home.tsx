import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { IS_WEB } from '../../src/theme/responsive';
import { useAuth, useApp } from '../../src/store/AppContext';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { SenseOrb } from '../../src/components/ui/SenseOrb';
import { LanguageToggle } from '../../src/components/ui/LanguageToggle';
import { BrandLogo } from '../../src/components/ui/BrandLogo';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { theme }              = useTheme();
  const { t }                  = useTranslation();
  const { user }               = useAuth();
  const { scanHistory, textSize, stats } = useApp();
  const insets                 = useSafeAreaInsets();
  const isLarge                = textSize === 'large';

  const userName = user?.name?.split(' ')[0] || 'Friend';

  // Time-aware greeting
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return t('home.greetingMorning', { name: userName });
    if (hours < 18) return t('home.greetingAfternoon', { name: userName });
    return t('home.greetingEvening', { name: userName });
  };

  const quickActions = [
    {
      key:   'url',
      label: t('home.scanUrl'),
      desc:  'Check fake links & websites',
      icon:  'globe-outline',
      color: theme.colors.primary,
      bg:    theme.colors.primaryLight,
    },
    {
      key:   'email',
      label: t('home.scanEmail'),
      desc:  'Verify sender & content',
      icon:  'mail-outline',
      color: theme.colors.secondaryDark,
      bg:    theme.colors.secondaryLight,
    },
    {
      key:   'sms',
      label: t('home.scanSms'),
      desc:  'Detect phishing texts & OTPs',
      icon:  'chatbox-ellipses-outline',
      color: theme.colors.skyDark,
      bg:    theme.colors.skyLight,
    },
    {
      key:   'call',
      label: t('home.scanCall'),
      desc:  'Lookup unknown phone numbers',
      icon:  'call-outline',
      color: theme.colors.mintDark,
      bg:    theme.colors.mintLight,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Ambient background soft glow */}
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
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Top Brand & Header Bar ──────────────────────── */}
        <View style={styles.topHeader}>
          <BrandLogo size="xs" variant="horizontal" />

          <View style={styles.headerRight}>
            <LanguageToggle />
            <TouchableOpacity
              onPress={() => router.push('/(app)/settings')}
              style={[
                styles.settingsBtn,
                { backgroundColor: theme.colors.backgroundCard, borderColor: theme.colors.border },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Warm Welcome & Greeting ────────────────────── */}
        <View style={styles.greetingSection}>
          <Text
            style={[
              styles.greetingTitle,
              {
                fontFamily: theme.fonts.headingBold,
                color:      theme.colors.textPrimary,
                fontSize:   isLarge ? 26 : 22,
              },
            ]}
          >
            {getGreeting()}
          </Text>
          <Text
            style={[
              styles.greetingSubtitle,
              {
                fontFamily: theme.fonts.body,
                color:      theme.colors.textSecondary,
                fontSize:   isLarge ? 15 : 13,
              },
            ]}
          >
            {t('home.protectionStatus.protectedSub')}
          </Text>
        </View>

        {/* ── 3. The Sense Orb Stage (AI Companion) ─────────── */}
        <Card
          variant="elevated"
          padding={IS_WEB ? 14 : 20}
          style={styles.orbStageCard}
        >
          {/* Status Chip */}
          <View style={styles.statusPillRow}>
            <View
              style={[
                styles.liveStatusPill,
                { backgroundColor: theme.colors.mintLight, borderColor: theme.colors.mint },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: theme.colors.mintDark }]} />
              <Text
                style={[
                  styles.statusPillText,
                  {
                    fontFamily: theme.fonts.bodySemibold,
                    color:      theme.colors.safeText,
                    fontSize:   isLarge ? 13 : 11,
                  },
                ]}
              >
                {t('home.protectionStatus.protected')}
              </Text>
            </View>
          </View>

          {/* Living Orb Centerpiece */}
          <View style={styles.orbCenterWrap}>
            <SenseOrb state="idle" size="lg" />
          </View>

          {/* Calming Reassurance Subtitle */}
          <Text
            style={[
              styles.orbStageSubtitle,
              {
                fontFamily: theme.fonts.body,
                color:      theme.colors.textSecondary,
                fontSize:   isLarge ? 15 : 13,
              },
            ]}
          >
            Sense is ready to help check your links, messages, and calls.
          </Text>

          {/* Primary Action Button */}
          <Button
            label="Scan Something Now"
            onPress={() => router.push('/(app)/scan')}
            variant="primary"
            size={IS_WEB ? 'md' : 'lg'}
            fullWidth
            icon={<Ionicons name="scan-outline" size={IS_WEB ? 18 : 22} color="#FFFFFF" />}
            style={[styles.primaryScanBtn, IS_WEB && { maxWidth: 280 }]}
          />
        </Card>

        {/* ── 4. Quick Protection Features Grid ─────────────── */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: theme.fonts.headingBold,
                color:      theme.colors.textPrimary,
                fontSize:   isLarge ? 19 : 17,
              },
            ]}
          >
            {t('home.quickActions')}
          </Text>
        </View>

        <View style={styles.gridContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={[
                styles.gridCard,
                {
                  backgroundColor: theme.colors.backgroundCard,
                  borderColor:     theme.colors.border,
                  ...theme.shadows.sm,
                },
              ]}
              activeOpacity={0.82}
              onPress={() => router.push('/(app)/scan')}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <View style={[styles.gridIconWrap, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon as any} size={IS_WEB ? 18 : 22} color={action.color} />
              </View>
              <Text
                style={[
                  styles.gridLabel,
                  {
                    fontFamily: theme.fonts.heading,
                    color:      theme.colors.textPrimary,
                    fontSize:   isLarge ? 15 : 14,
                  },
                ]}
                numberOfLines={1}
              >
                {action.label}
              </Text>
              <Text
                style={[
                  styles.gridDesc,
                  {
                    fontFamily: theme.fonts.body,
                    color:      theme.colors.textTertiary,
                    fontSize:   isLarge ? 12 : 11,
                  },
                ]}
                numberOfLines={1}
              >
                {action.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── 5. Urgent Panic Mode Assistance ────────────────── */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push('/(app)/panic')}
          style={[
            styles.panicCard,
            {
              backgroundColor: theme.colors.danger,
              borderColor:     theme.colors.dangerDark,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Panic Mode — Being scammed right now?"
        >
          <View
            style={[
              styles.panicIconBadge,
              { backgroundColor: theme.colors.dangerDark },
            ]}
          >
            <Ionicons name="warning" size={IS_WEB ? 16 : 20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.panicHeading,
                {
                  fontFamily: theme.fonts.headingBold,
                  color:      theme.colors.dangerText,
                  fontSize:   isLarge ? 16 : 14,
                },
              ]}
            >
              {t('home.panicMode')}
            </Text>
            <Text
              style={[
                styles.panicSubtext,
                {
                  fontFamily: theme.fonts.body,
                  color:      theme.colors.dangerDark,
                  fontSize:   isLarge ? 13 : 12,
                },
              ]}
            >
              {t('home.panicModeSub')}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={IS_WEB ? 16 : 18}
            color={theme.colors.dangerDark}
          />
        </TouchableOpacity>

        {/* ── 6. Recent Safety Activity ─────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: theme.fonts.headingBold,
                color:      theme.colors.textPrimary,
                fontSize:   isLarge ? 19 : 17,
              },
            ]}
          >
            {t('home.recentScans')}
          </Text>
          {scanHistory.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(app)/scan')}>
              <Text
                style={[
                  styles.seeAllText,
                  {
                    fontFamily: theme.fonts.bodySemibold,
                    color:      theme.colors.primaryDark,
                    fontSize:   isLarge ? 14 : 12,
                  },
                ]}
              >
                {t('home.seeAll')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {scanHistory.length === 0 ? (
          <Card variant="flat" padding={18} style={styles.emptyCard}>
            <Ionicons name="shield-outline" size={32} color={theme.colors.textTertiary} />
            <Text
              style={[
                styles.emptyText,
                {
                  fontFamily: theme.fonts.body,
                  color:      theme.colors.textSecondary,
                  fontSize:   isLarge ? 14 : 13,
                },
              ]}
            >
              {t('home.noRecentScans')}
            </Text>
          </Card>
        ) : (
          scanHistory.slice(0, 2).map((scan) => (
            <Card
              key={scan.id}
              variant="default"
              padding={16}
              style={styles.activityCard}
            >
              <View style={styles.activityHeader}>
                <Badge
                  variant={scan.risk}
                  label={t(`scan.result.${scan.risk}.label`)}
                />
                <Text
                  style={[
                    styles.activityType,
                    {
                      fontFamily: theme.fonts.bodyMedium,
                      color:      theme.colors.textTertiary,
                      fontSize:   isLarge ? 13 : 11,
                    },
                  ]}
                >
                  {scan.type.toUpperCase()}
                </Text>
              </View>
              <Text
                style={[
                  styles.activityContent,
                  {
                    fontFamily: theme.fonts.bodyMedium,
                    color:      theme.colors.textPrimary,
                    fontSize:   isLarge ? 15 : 13,
                  },
                ]}
                numberOfLines={1}
              >
                {scan.content}
              </Text>
              {scan.details ? (
                <Text
                  style={[
                    styles.activityDetails,
                    {
                      fontFamily: theme.fonts.body,
                      color:      theme.colors.textSecondary,
                      fontSize:   isLarge ? 13 : 12,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {scan.details}
                </Text>
              ) : null}
            </Card>
          ))
        )}

        {/* ── 7. Daily Safety Tip ───────────────────────────── */}
        <Card
          variant="flat"
          padding={IS_WEB ? 12 : 16}
          color={theme.colors.skyLight}
          style={styles.tipCard}
        >
          <View style={styles.tipRow}>
            <View
              style={[
                styles.tipIconWrap,
                { backgroundColor: theme.colors.sky },
              ]}
            >
              <Ionicons name="bulb-outline" size={IS_WEB ? 16 : 20} color={theme.colors.skyDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.tipTitle,
                  {
                    fontFamily: theme.fonts.headingBold,
                    color:      theme.colors.textPrimary,
                    fontSize:   isLarge ? 15 : 13,
                  },
                ]}
              >
                Quick Security Tip
              </Text>
              <Text
                style={[
                  styles.tipBody,
                  {
                    fontFamily: theme.fonts.body,
                    color:      theme.colors.textSecondary,
                    fontSize:   isLarge ? 14 : 12,
                  },
                ]}
              >
                Never share OTPs, PINs, or bank passwords over phone calls or SMS.
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glowBackdrop: {
    position:     'absolute',
    top:          -width * 0.35,
    alignSelf:    'center',
    width:        width * 1.15,
    height:       width * 1.15,
    borderRadius: (width * 1.15) / 2,
    opacity:      0.45,
  },
  scroll: {
    paddingHorizontal: IS_WEB ? 14 : 20,
  },
  topHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   12,
  },
  brandBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius:    16,
  },
  brandIconWrap: {
    width:          26,
    height:         26,
    borderRadius:   13,
    alignItems:     'center',
    justifyContent: 'center',
  },
  brandName: {
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  settingsBtn: {
    width:          34,
    height:         34,
    borderRadius:   17,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  greetingSection: {
    marginBottom: 14,
  },
  greetingTitle: {
    letterSpacing: -0.4,
    marginBottom:  2,
  },
  greetingSubtitle: {
    opacity: 0.85,
  },
  orbStageCard: {
    borderRadius:  IS_WEB ? 18 : 24,
    alignItems:    'center',
    marginBottom:  IS_WEB ? 14 : 20,
  },
  statusPillRow: {
    alignItems:   'center',
    marginBottom: 8,
  },
  liveStatusPill: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   5,
    paddingHorizontal: 12,
    borderRadius:      20,
    borderWidth:       1,
    gap:               6,
  },
  statusDot: {
    width:        7,
    height:       7,
    borderRadius: 4,
  },
  statusPillText: {
    letterSpacing: 0.3,
  },
  orbCenterWrap: {
    marginVertical: 10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  orbStageSubtitle: {
    textAlign:         'center',
    paddingHorizontal: 16,
    marginBottom:      18,
    lineHeight:        20,
  },
  primaryScanBtn: {
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   12,
    marginTop:      4,
  },
  sectionTitle: {
    letterSpacing: -0.2,
  },
  seeAllText: {
    letterSpacing: 0.2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           IS_WEB ? 10 : 12,
    marginBottom:  IS_WEB ? 14 : 18,
  },
  gridCard: {
    width:             '48%',
    paddingVertical:   IS_WEB ? 12 : 16,
    paddingHorizontal: IS_WEB ? 10 : 14,
    borderRadius:      IS_WEB ? 14 : 18,
    borderWidth:       1,
    alignItems:        'flex-start',
  },
  gridIconWrap: {
    width:          IS_WEB ? 34 : 40,
    height:         IS_WEB ? 34 : 40,
    borderRadius:   IS_WEB ? 17 : 20,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   IS_WEB ? 8 : 10,
  },
  gridLabel: {
    marginBottom: 2,
  },
  gridDesc: {
    lineHeight: 15,
  },
  panicCard: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: IS_WEB ? 10 : 12,
    paddingHorizontal: IS_WEB ? 12 : 16,
    borderRadius:    IS_WEB ? 14 : 16,
    borderWidth:     1.2,
    marginBottom:    IS_WEB ? 14 : 18,
    gap:             IS_WEB ? 10 : 12,
  },
  panicIconBadge: {
    width:          IS_WEB ? 28 : 34,
    height:         IS_WEB ? 28 : 34,
    borderRadius:   IS_WEB ? 14 : 17,
    alignItems:     'center',
    justifyContent: 'center',
  },
  panicHeading: {
    letterSpacing: 0.1,
  },
  panicSubtext: {
    marginTop: 1,
  },
  activityCard: {
    marginBottom: 10,
    borderRadius: 16,
  },
  activityHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   6,
  },
  activityType: {
    letterSpacing: 0.4,
  },
  activityContent: {
    marginBottom: 2,
  },
  activityDetails: {
    opacity: 0.8,
  },
  emptyCard: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom:   14,
    gap:            8,
  },
  emptyText: {
    textAlign: 'center',
  },
  tipCard: {
    borderRadius: IS_WEB ? 14 : 16,
    marginTop:    4,
    marginBottom: IS_WEB ? 10 : 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           IS_WEB ? 10 : 12,
  },
  tipIconWrap: {
    width:          IS_WEB ? 30 : 36,
    height:         IS_WEB ? 30 : 36,
    borderRadius:   IS_WEB ? 15 : 18,
    alignItems:     'center',
    justifyContent: 'center',
  },
  tipTitle: {
    marginBottom: 2,
  },
  tipBody: {
    lineHeight: 18,
  },
});
