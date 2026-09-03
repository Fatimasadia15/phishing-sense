import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useApp } from '../../src/store/AppContext';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';

// Configurable emergency helpline directory for Pakistan.
// Numbers can be overridden at build time via app.json extra values if needed.
const HELPLINES = [
  { key: 'police',     number: '15' },
  { key: 'ambulance',  number: '115' },
  { key: 'fire',       number: '16' },
  { key: 'cybercrime', number: '1991' },
];

const PRIMARY_HELPLINE = HELPLINES[0];

export default function PanicScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { textSize } = useApp();
  const insets = useSafeAreaInsets();
  const isLarge = textSize === 'large';

  const handleCallHelp = async () => {
    const telUrl = `tel:${PRIMARY_HELPLINE.number}`;
    const canDial = await Linking.canOpenURL(telUrl).catch(() => false);

    if (canDial) {
      Linking.openURL(telUrl).catch(() => {
        Alert.alert(
          t('panic.dialFallbackTitle'),
          t('panic.dialFallbackMessage', { number: PRIMARY_HELPLINE.number })
        );
      });
    } else {
      const numbersList = HELPLINES
        .map(h => `• ${t(`panic.helplines.${h.key}`)}: ${h.number}`)
        .join('\n');
      Alert.alert(
        t('panic.dialFallbackTitle'),
        `${t('panic.dialFallbackMessage', { number: PRIMARY_HELPLINE.number })}\n\n${t('panic.dialFallbackNumbers')}\n${numbersList}`
      );
    }
  };

  const steps = [
    {
      num: t('panic.step1.num'),
      title: t('panic.step1.title'),
      detail: t('panic.step1.detail'),
      icon: 'call-outline',
    },
    {
      num: t('panic.step2.num'),
      title: t('panic.step2.title'),
      detail: t('panic.step2.detail'),
      icon: 'hand-left-outline',
    },
    {
      num: t('panic.step3.num'),
      title: t('panic.step3.title'),
      detail: t('panic.step3.detail'),
      icon: 'card-outline',
    },
    {
      num: t('panic.step4.num'),
      title: t('panic.step4.title'),
      detail: t('panic.step4.detail'),
      icon: 'shield-checkmark-outline',
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgent Calming Header */}
        <View style={styles.topSection}>
          <View
            style={[
              styles.shieldBadge,
              { backgroundColor: theme.colors.danger },
            ]}
          >
            <Ionicons
              name="shield-outline"
              size={48}
              color={theme.colors.dangerDark}
            />
          </View>
          <Text
            style={[
              styles.title,
              {
                fontFamily: theme.fonts.headingBold,
                color: theme.colors.textPrimary,
                fontSize: isLarge ? 28 : 24,
              },
            ]}
          >
            {t('panic.title')}
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                fontFamily: theme.fonts.body,
                color: theme.colors.textSecondary,
                fontSize: isLarge ? 17 : 15,
              },
            ]}
          >
            {t('panic.subtitle')}
          </Text>
        </View>

        {/* Emergency Steps Cards */}
        <View style={styles.stepsWrap}>
          {steps.map((step, idx) => (
            <Card
              key={idx}
              variant="default"
              padding={16}
              style={styles.stepCard}
            >
              <View style={styles.stepHeader}>
                <View
                  style={[
                    styles.stepNumCircle,
                    { backgroundColor: theme.colors.primaryLight },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNum,
                      {
                        fontFamily: theme.fonts.headingBold,
                        color: theme.colors.primaryDark,
                        fontSize: isLarge ? 16 : 14,
                      },
                    ]}
                  >
                    {step.num}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepTitle,
                    {
                      fontFamily: theme.fonts.headingBold,
                      color: theme.colors.textPrimary,
                      fontSize: isLarge ? 17 : 15,
                    },
                  ]}
                >
                  {step.title}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepDetail,
                  {
                    fontFamily: theme.fonts.body,
                    color: theme.colors.textSecondary,
                    fontSize: isLarge ? 15 : 13,
                  },
                ]}
              >
                {step.detail}
              </Text>
            </Card>
          ))}
        </View>

        {/* Reassurance Message */}
        <Card
          variant="flat"
          padding={16}
          color={theme.colors.mintLight}
          style={styles.reminderCard}
        >
          <View style={styles.reminderRow}>
            <Ionicons
              name="heart-circle"
              size={28}
              color={theme.colors.mintDark}
            />
            <Text
              style={[
                styles.reminderText,
                {
                  fontFamily: theme.fonts.bodyMedium,
                  color: theme.colors.safeDark,
                  fontSize: isLarge ? 14 : 13,
                },
              ]}
            >
              {t('panic.reminder')}
            </Text>
          </View>
        </Card>

        {/* Emergency Helpline Directory */}
        <Card
          variant="default"
          padding={16}
          style={styles.helplineCard}
        >
          <Text
            style={[
              styles.helplineTitle,
              {
                fontFamily: theme.fonts.headingBold,
                color: theme.colors.textPrimary,
                fontSize: isLarge ? 16 : 14,
              },
            ]}
          >
            {t('panic.dialFallbackNumbers')}
          </Text>
          {HELPLINES.map((h) => (
            <TouchableOpacity
              key={h.key}
              onPress={() => Linking.openURL(`tel:${h.number}`).catch(() => {
                Alert.alert(
                  t('panic.dialFallbackTitle'),
                  t('panic.dialFallbackMessage', { number: h.number })
                );
              })}
              activeOpacity={0.7}
              style={styles.helplineRow}
              accessibilityRole="button"
              accessibilityLabel={`${t(`panic.helplines.${h.key}`)} ${h.number}`}
            >
              <View style={[styles.helplineIconWrap, { backgroundColor: theme.colors.dangerLight }]}>
                <Ionicons name="call-outline" size={16} color={theme.colors.dangerDark} />
              </View>
              <View style={styles.helplineInfo}>
                <Text
                  style={[
                    styles.helplineName,
                    {
                      fontFamily: theme.fonts.bodySemibold,
                      color: theme.colors.textPrimary,
                      fontSize: isLarge ? 15 : 13,
                    },
                  ]}
                >
                  {t(`panic.helplines.${h.key}`)}
                </Text>
              </View>
              <Text
                style={[
                  styles.helplineNumber,
                  {
                    fontFamily: theme.fonts.headingBold,
                    color: theme.colors.dangerDark,
                    fontSize: isLarge ? 16 : 14,
                  },
                ]}
              >
                {h.number}
              </Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            label={t('panic.callForHelp')}
            onPress={handleCallHelp}
            variant="danger"
            size="lg"
            fullWidth
            icon={<Ionicons name="call" size={20} color="#FFFFFF" />}
            style={{ marginBottom: 12 }}
          />

          <Button
            label={t('panic.imSafeNow')}
            onPress={() => router.back()}
            variant="ghost"
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  stepsWrap: {
    gap: 12,
    marginBottom: 20,
  },
  stepCard: {},
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  stepNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {},
  stepTitle: {
    flex: 1,
  },
  stepDetail: {
    lineHeight: 20,
    paddingStart: 40,
  },
  reminderCard: {
    marginBottom: 24,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderText: {
    flex: 1,
    lineHeight: 19,
  },
  helplineCard: {
    marginBottom: 20,
  },
  helplineTitle: {
    marginBottom: 12,
  },
  helplineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  helplineIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helplineInfo: {
    flex: 1,
  },
  helplineName: {},
  helplineNumber: {
    letterSpacing: 0.5,
  },
  actions: {
    marginTop: 4,
  },
});
