import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  Animated,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useApp } from '../../src/store/AppContext';
import { Badge } from '../../src/components/ui/Badge';
import { SenseOrb, type OrbState } from '../../src/components/ui/SenseOrb';
import type { ScanResult } from '../../src/constants/mockData';


// ─────────────────────────────────────────────────────────────
//  Scan Screen — Phase 3 Redesign
//  "A calm safety checkpoint where anyone can ask: Is this safe?"
// ─────────────────────────────────────────────────────────────

type ScanType = 'url' | 'message' | 'email' | 'phone';

interface ScanTypeOption {
  id:          ScanType;
  icon:        string;
  label:       string;
  placeholder: string;
  hint:        string;
}

const SCAN_TYPES: ScanTypeOption[] = [
  { id: 'url',     icon: 'link-outline',       label: 'Link / URL',    placeholder: 'Paste a suspicious link here…',          hint: 'e.g. https://paypal-secure.xyz/login' },
  { id: 'message', icon: 'chatbubble-outline',  label: 'Message / SMS', placeholder: 'Paste a suspicious message here…',       hint: '"Your account has been suspended. Click here…"' },
  { id: 'email',   icon: 'mail-outline',        label: 'Email Text',    placeholder: 'Paste suspicious email content here…',   hint: 'Copy the full email body or sender address' },
  { id: 'phone',   icon: 'call-outline',        label: 'Phone Number',  placeholder: 'Enter a suspicious phone number…',       hint: 'e.g. +92 300 1234567' },
];

const RESULT_CONFIG = {
  safe:      { icon: 'shield-checkmark', iconColor: '#2E7D55', bgColor: '#F0FDF4', borderColor: '#4CAF82',  headline: 'Looks Safe ✓',       advice: 'No signs of phishing or scams were found.',                                          action: 'This appears safe — but always be cautious when sharing personal information online.' },
  suspicious:{ icon: 'warning',          iconColor: '#E07B20', bgColor: '#FFFBEB', borderColor: '#F59E0B',  headline: 'Be Careful ⚠️',       advice: 'Something about this looks a little unusual.',                                        action: 'Do not share passwords, PINs, or OTPs until you verify this is from a trusted source.' },
  dangerous: { icon: 'close-circle',     iconColor: '#DC2626', bgColor: '#FFF5F5', borderColor: '#F87171',  headline: 'Do Not Proceed 🚫', advice: 'This looks like a phishing attempt or scam.',                                         action: 'Do not click any links, share any information, or respond. Block the sender and report it.' },
};

export default function ScanScreen() {
  const { theme }                          = useTheme();
  const { t }                              = useTranslation();
  const { addScan, scanHistory, textSize } = useApp();
  const insets                             = useSafeAreaInsets();
  const isLarge                            = textSize === 'large';

  const [selectedType, setSelectedType] = useState<ScanType>('url');
  const [inputContent, setInputContent] = useState('');
  const [orbState,     setOrbState]     = useState<OrbState>('idle');
  const [result,       setResult]       = useState<ScanResult | null>(null);
  const [isFocused,    setIsFocused]    = useState(false);

  const btnScale      = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultSlide   = useRef(new Animated.Value(20)).current;

  const currentType = SCAN_TYPES.find(s => s.id === selectedType) ?? SCAN_TYPES[0];
  const hasInput    = inputContent.trim().length > 0;
  const isScanning  = orbState === 'analyzing';

  // ── Existing scan logic (unchanged) ──────────────────────
  const handleScan = () => {
    if (!inputContent.trim() || isScanning) return;
    Keyboard.dismiss();
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80,  useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 150, useNativeDriver: true }),
    ]).start();
    setOrbState('analyzing');
    setResult(null);
    resultOpacity.setValue(0);
    resultSlide.setValue(20);
    setTimeout(() => {
      const scanRes = addScan(inputContent);
      setResult(scanRes);
      setOrbState('result');
      Animated.parallel([
        Animated.timing(resultOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(resultSlide,   { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 1800);
  };

  const handleClear = () => {
    setInputContent('');
    setResult(null);
    setOrbState('idle');
    resultOpacity.setValue(0);
  };

  const handleTypeSelect = (type: ScanType) => {
    setSelectedType(type);
    if (result) handleClear();
    else if (orbState !== 'idle') setOrbState('idle');
  };

  // ── Helpers ──────────────────────────────────────────────
  const orbCaption = (() => {
    switch (orbState) {
      case 'listening':  return 'Sense is ready…';
      case 'analyzing':  return 'Checking for risks…';
      case 'result':
        if (!result) return 'Done';
        return result.risk === 'safe' ? 'All clear!' : result.risk === 'suspicious' ? 'Stay cautious' : 'High risk detected';
      default:           return 'Paste something to check';
    }
  })();

  const timeLabel = (ts: Date): string => {
    const diff = Date.now() - ts.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const riskIcon = (risk: ScanResult['risk']) => {
    if (risk === 'safe')       return { name: 'shield-checkmark-outline' as const, color: '#2E7D55' };
    if (risk === 'suspicious') return { name: 'warning-outline' as const,          color: '#E07B20' };
    return                            { name: 'close-circle-outline'  as const,    color: '#DC2626' };
  };

  const recentScans = scanHistory.slice(0, 3);
  const resultCfg   = result ? RESULT_CONFIG[result.risk] : null;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.screenLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.primary, fontSize: isLarge ? 13 : 11 }]}>
              PHISHING SENSE
            </Text>
            <Text style={[styles.screenTitle, { fontFamily: theme.fonts.headingBold, color: theme.colors.textPrimary, fontSize: isLarge ? 26 : 22 }]}>
              Safety Check
            </Text>
          </View>
          <View style={[styles.orbMiniWrap, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border }]}>
            <SenseOrb state={orbState} size="xs" />
          </View>
        </View>

        <Text style={[styles.screenSub, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>
          Paste something suspicious and Sense will help you understand if it's safe.
        </Text>

        {/* ── Scan type chips ────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow} style={styles.typeScroll}>
          {SCAN_TYPES.map(opt => {
            const active = selectedType === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handleTypeSelect(opt.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Scan type: ${opt.label}`}
                accessibilityState={{ selected: active }}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.backgroundCard,
                    borderColor:     active ? theme.colors.primary : theme.colors.border,
                    shadowColor:     active ? theme.colors.primary : 'transparent',
                    shadowOpacity:   active ? 0.22 : 0,
                    shadowRadius:    8,
                    shadowOffset:    { width: 0, height: 3 },
                    elevation:       active ? 4 : 0,
                  },
                ]}
              >
                <Ionicons name={opt.icon as any} size={isLarge ? 18 : 16} color={active ? '#FFFFFF' : theme.colors.textSecondary} />
                <Text style={[styles.typeLabel, { fontFamily: active ? theme.fonts.bodySemibold : theme.fonts.bodyMedium, color: active ? '#FFFFFF' : theme.colors.textSecondary, fontSize: isLarge ? 14 : 13 }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Main input card ────────────────────────────────── */}
        <View
          style={[
            styles.inputCard,
            {
              backgroundColor: theme.colors.backgroundCard,
              borderColor:     isFocused ? theme.colors.primary : theme.colors.border,
              borderWidth:     isFocused ? 2 : 1.5,
              shadowColor:     theme.colors.primary,
              shadowOpacity:   isFocused ? 0.18 : 0.06,
              shadowRadius:    isFocused ? 12 : 4,
              shadowOffset:    { width: 0, height: 4 },
              elevation:       isFocused ? 6 : 2,
            },
          ]}
        >
          {/* Label row */}
          <View style={styles.inputLabelRow}>
            <Ionicons name={currentType.icon as any} size={18} color={theme.colors.primary} />
            <Text style={[styles.inputLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 16 : 14 }]}>
              {currentType.label}
            </Text>
            {hasInput && (
              <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={[styles.clearBtn, { backgroundColor: theme.colors.backgroundMuted }]} accessibilityLabel="Clear">
                <Ionicons name="close" size={14} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Text area */}
          <TextInput
            value={inputContent}
            onChangeText={(txt) => {
              setInputContent(txt);
              if (txt.length > 0 && orbState === 'idle')     setOrbState('listening');
              if (txt.length === 0 && orbState !== 'result') setOrbState('idle');
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={()  => setIsFocused(false)}
            placeholder={currentType.placeholder}
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={[styles.textArea, { fontFamily: theme.fonts.body, color: theme.colors.textPrimary, fontSize: isLarge ? 16 : 15 }]}
            accessibilityLabel={`Input for ${currentType.label}`}
          />

          <Text style={[styles.hintText, { fontFamily: theme.fonts.body, color: theme.colors.textTertiary, fontSize: isLarge ? 13 : 12 }]}>
            💡 {currentType.hint}
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* Scan button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              onPress={handleScan}
              disabled={!hasInput || isScanning}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Check for risk"
              accessibilityState={{ disabled: !hasInput || isScanning }}
              style={[
                styles.scanBtn,
                {
                  backgroundColor: hasInput && !isScanning ? theme.colors.primary : theme.colors.border,
                  shadowColor:     theme.colors.primary,
                  shadowOpacity:   hasInput && !isScanning ? 0.35 : 0,
                  shadowRadius:    14,
                  shadowOffset:    { width: 0, height: 5 },
                  elevation:       hasInput && !isScanning ? 6 : 0,
                },
              ]}
            >
              <Ionicons
                name={isScanning ? 'radio-outline' : 'shield-checkmark-outline'}
                size={20}
                color={hasInput && !isScanning ? '#FFFFFF' : theme.colors.textDisabled}
                style={styles.btnIcon}
              />
              <Text style={[styles.scanBtnText, { fontFamily: theme.fonts.bodySemibold, fontSize: isLarge ? 18 : 16, color: hasInput && !isScanning ? '#FFFFFF' : theme.colors.textDisabled }]}>
                {isScanning ? 'Checking…' : 'Check for Risk'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── Orb caption ────────────────────────────────────── */}
        <View style={styles.orbCapRow}>
          <View style={[styles.orbDot, {
            backgroundColor:
              orbState === 'analyzing' ? theme.colors.primary
              : orbState === 'result'  ? (result?.risk === 'safe' ? '#2E7D55' : result?.risk === 'suspicious' ? '#E07B20' : '#DC2626')
              : orbState === 'listening'? theme.colors.sky
              : theme.colors.border,
          }]} />
          <Text style={[styles.orbCapText, { fontFamily: theme.fonts.bodyMedium, color: theme.colors.textTertiary, fontSize: isLarge ? 13 : 12 }]}>
            {orbCaption}
          </Text>
        </View>

        {/* ── Result card ────────────────────────────────────── */}
        {result && resultCfg && (
          <Animated.View style={[styles.resultCard, { backgroundColor: resultCfg.bgColor, borderColor: resultCfg.borderColor, opacity: resultOpacity, transform: [{ translateY: resultSlide }] }]}>
            {/* Header */}
            <View style={styles.resultHeaderRow}>
              <View style={[styles.resultIconWrap, { backgroundColor: resultCfg.borderColor + '22' }]}>
                <Ionicons name={resultCfg.icon as any} size={28} color={resultCfg.iconColor} />
              </View>
              <View style={styles.resultHeaderText}>
                <Badge variant={result.risk} label={t(`scan.result.${result.risk}.label`)} />
                <Text style={[styles.resultHeadline, { fontFamily: theme.fonts.headingBold, color: resultCfg.iconColor, fontSize: isLarge ? 20 : 17, marginTop: 4 }]}>
                  {resultCfg.headline}
                </Text>
              </View>
            </View>

            {/* Confidence bar */}
            <View style={styles.confRow}>
              <Text style={[styles.confLabel, { fontFamily: theme.fonts.body, color: resultCfg.iconColor, fontSize: isLarge ? 13 : 12 }]}>
                Confidence
              </Text>
              <View style={[styles.confBarBg, { backgroundColor: resultCfg.borderColor + '33' }]}>
                <View style={[styles.confBarFill, { width: `${result.confidence}%` as any, backgroundColor: resultCfg.iconColor }]} />
              </View>
              <Text style={[styles.confPct, { fontFamily: theme.fonts.bodySemibold, color: resultCfg.iconColor, fontSize: isLarge ? 13 : 12 }]}>
                {result.confidence}%
              </Text>
            </View>

            {/* What this means */}
            <View style={styles.resultBlock}>
              <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12 }]}>What this means</Text>
              <Text style={[styles.resultBlockText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>{resultCfg.advice}</Text>
            </View>

            {/* What to do */}
            <View style={[styles.resultAdviceBox, { backgroundColor: resultCfg.borderColor + '18', borderColor: resultCfg.borderColor + '55' }]}>
              <View style={styles.resultAdviceRow}>
                <Ionicons name="information-circle-outline" size={16} color={resultCfg.iconColor} />
                <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: resultCfg.iconColor, fontSize: isLarge ? 14 : 12, marginLeft: 6 }]}>What should I do?</Text>
              </View>
              <Text style={[styles.resultBlockText, { fontFamily: theme.fonts.body, color: theme.colors.textPrimary, fontSize: isLarge ? 15 : 14, marginTop: 4 }]}>{resultCfg.action}</Text>
            </View>

            {/* Technical details */}
            {result.details && (
              <View style={styles.detailsBox}>
                <Text style={[styles.detailsLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textTertiary, fontSize: isLarge ? 12 : 11 }]}>
                  {t('scan.result.details')}
                </Text>
                <Text style={[styles.detailsText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 14 : 13 }]}>
                  {result.details}
                </Text>
              </View>
            )}

            {/* Scan again */}
            <TouchableOpacity
              onPress={handleClear}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('scan.result.scanAgain')}
              style={[styles.scanAgainBtn, { borderColor: resultCfg.borderColor }]}
            >
              <Ionicons name="refresh-outline" size={16} color={resultCfg.iconColor} />
              <Text style={[styles.scanAgainText, { fontFamily: theme.fonts.bodySemibold, color: resultCfg.iconColor, fontSize: isLarge ? 15 : 14 }]}>
                {t('scan.result.scanAgain')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Recent checks ──────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { fontFamily: theme.fonts.heading, color: theme.colors.textPrimary, fontSize: isLarge ? 17 : 15 }]}>
          Recent Checks
        </Text>

        {recentScans.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.backgroundCard, borderColor: theme.colors.border }]}>
            <View style={[styles.emptyOrbWrap, { backgroundColor: theme.colors.primaryLight }]}>
              <SenseOrb state="idle" size="sm" />
            </View>
            <Text style={[styles.emptyTitle, { fontFamily: theme.fonts.heading, color: theme.colors.textPrimary, fontSize: isLarge ? 16 : 15 }]}>
              No checks yet
            </Text>
            <Text style={[styles.emptySub, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 14 : 13 }]}>
              Paste a suspicious message, link, or phone number above and tap{' '}
              <Text style={{ fontFamily: theme.fonts.bodySemibold, color: theme.colors.primary }}>Check for Risk</Text>
              {' '}whenever you're unsure.
            </Text>
          </View>
        ) : (
          recentScans.map((scan) => {
            const icon        = riskIcon(scan.risk);
            const previewText = scan.content.length > 52 ? scan.content.slice(0, 52) + '…' : scan.content;
            return (
              <View
                key={scan.id}
                style={[
                  styles.historyCard,
                  { backgroundColor: theme.colors.backgroundCard, borderColor: theme.colors.border, shadowColor: '#9FA1FF', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
                ]}
              >
                <View style={[styles.historyIconWrap, { backgroundColor: theme.colors.backgroundMuted }]}>
                  <Ionicons name={icon.name} size={20} color={icon.color} />
                </View>
                <View style={styles.historyContent}>
                  <Text numberOfLines={1} style={[styles.historyText, { fontFamily: theme.fonts.bodyMedium, color: theme.colors.textPrimary, fontSize: isLarge ? 15 : 13 }]}>
                    {previewText}
                  </Text>
                  <View style={styles.historyMeta}>
                    <Badge variant={scan.risk} label={scan.risk.charAt(0).toUpperCase() + scan.risk.slice(1)} dot={false} />
                    <Text style={[styles.historyTime, { fontFamily: theme.fonts.body, color: theme.colors.textTertiary, fontSize: isLarge ? 12 : 11 }]}>
                      {timeLabel(scan.timestamp)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* ── Safety tips ────────────────────────────────────── */}
        <View style={[styles.tipsCard, { backgroundColor: theme.colors.skyLight, borderColor: theme.colors.sky + '80' }]}>
          <View style={styles.tipsHeaderRow}>
            <Ionicons name="bulb-outline" size={18} color={theme.colors.skyDark} />
            <Text style={[styles.tipsHeading, { fontFamily: theme.fonts.heading, color: theme.colors.skyDark, fontSize: isLarge ? 15 : 13 }]}>
              {t('scan.tips.title')}
            </Text>
          </View>
          {[t('scan.tips.tip1'), t('scan.tips.tip2'), t('scan.tips.tip3')].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={[styles.tipDot, { color: theme.colors.skyDark }]}>•</Text>
              <Text style={[styles.tipText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 14 : 13 }]}>{tip}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  topBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  screenLabel:  { letterSpacing: 1.2, marginBottom: 2 },
  screenTitle:  { letterSpacing: -0.4 },
  orbMiniWrap:  { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  screenSub:    { lineHeight: 22, marginBottom: 20 },

  typeScroll: { marginHorizontal: -20, marginBottom: 16 },
  typeRow:    { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  typeChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5 },
  typeLabel:  { letterSpacing: 0.1 },

  inputCard:      { borderRadius: 20, padding: 20, marginBottom: 10 },
  inputLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  inputLabel:     { flex: 1 },
  clearBtn:       { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  textArea:       { minHeight: 110, lineHeight: 22, marginBottom: 8, padding: 0, ...Platform.select({ android: { textAlignVertical: 'top' } }) },
  hintText:       { lineHeight: 18, marginBottom: 14 },
  divider:        { height: 1, marginBottom: 16 },
  scanBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 999, paddingHorizontal: 24 },
  btnIcon:        { marginRight: 8 },
  scanBtnText:    { letterSpacing: 0.3 },

  orbCapRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20, marginTop: 4 },
  orbDot:     { width: 7, height: 7, borderRadius: 4 },
  orbCapText: { letterSpacing: 0.3 },

  resultCard:       { borderRadius: 20, borderWidth: 1.5, padding: 20, marginBottom: 24 },
  resultHeaderRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  resultIconWrap:   { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  resultHeaderText: { flex: 1, justifyContent: 'center' },
  resultHeadline:   { letterSpacing: -0.3 },
  confRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  confLabel:        { width: 72 },
  confBarBg:        { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  confBarFill:      { height: 6, borderRadius: 3 },
  confPct:          { width: 34, textAlign: 'right' },
  resultBlock:      { marginBottom: 12 },
  resultBlockLabel: { marginBottom: 4, letterSpacing: 0.1 },
  resultBlockText:  { lineHeight: 22 },
  resultAdviceBox:  { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  resultAdviceRow:  { flexDirection: 'row', alignItems: 'center' },
  detailsBox:       { paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', marginBottom: 14 },
  detailsLabel:     { marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  detailsText:      { lineHeight: 20 },
  scanAgainBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 999, borderWidth: 1.5, paddingVertical: 12, paddingHorizontal: 20, marginTop: 4 },
  scanAgainText:    { letterSpacing: 0.2 },

  sectionTitle: { marginBottom: 12, marginTop: 4, letterSpacing: -0.2 },

  emptyState:   { borderRadius: 20, borderWidth: 1.5, padding: 28, alignItems: 'center', marginBottom: 24 },
  emptyOrbWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:   { marginBottom: 8, letterSpacing: -0.2 },
  emptySub:     { textAlign: 'center', lineHeight: 21 },

  historyCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 10 },
  historyIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  historyContent:  { flex: 1 },
  historyText:     { marginBottom: 6 },
  historyMeta:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyTime:     { marginLeft: 'auto' },

  tipsCard:      { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 8 },
  tipsHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  tipsHeading:   { letterSpacing: -0.1 },
  tipRow:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 6 },
  tipDot:        { fontSize: 16, lineHeight: 20 },
  tipText:       { flex: 1, lineHeight: 20 },
});



