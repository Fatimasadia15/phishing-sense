import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../src/theme/ThemeContext';
import { IS_WEB, USE_NATIVE_DRIVER } from '../../src/theme/responsive';
import { shadow } from '../../src/theme/tokens';
import { useApp } from '../../src/store/AppContext';
import { Badge } from '../../src/components/ui/Badge';
import { SenseOrb, type OrbState } from '../../src/components/ui/SenseOrb';
import { VoiceButton } from '../../src/components/ui/VoiceButton';
import { useVoiceAssistant, buildVoiceSummary } from '../../src/services/voice';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { checkPhoneNumber, reportToCommunity, type CheckNumberResponse } from '../../src/services/api';
import { inferContentType } from '../../src/services/redact';
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

const getScanTypes = (t: TFunction): ScanTypeOption[] => [
  { id: 'url',     icon: 'link-outline',       label: t('scan.types.url.label'),     placeholder: t('scan.types.url.placeholder'),     hint: t('scan.types.url.hint') },
  { id: 'message', icon: 'chatbubble-outline',  label: t('scan.types.message.label'), placeholder: t('scan.types.message.placeholder'), hint: t('scan.types.message.hint') },
  { id: 'email',   icon: 'mail-outline',        label: t('scan.types.email.label'),   placeholder: t('scan.types.email.placeholder'),   hint: t('scan.types.email.hint') },
  { id: 'phone',   icon: 'call-outline',        label: t('scan.types.phone.label'),   placeholder: t('scan.types.phone.placeholder'),   hint: t('scan.types.phone.hint') },
];

function scanTypeForContent(content: string): ScanType {
  const inferred = inferContentType(content);
  if (inferred === 'url' || inferred === 'email' || inferred === 'phone') return inferred;
  return 'message';
}

const RESULT_CONFIG = {
  safe:      { icon: 'shield-checkmark', iconColor: '#2E7D55', bgColor: '#F0FDF4', borderColor: '#4CAF82' },
  suspicious:{ icon: 'warning',          iconColor: '#E07B20', bgColor: '#FFFBEB', borderColor: '#F59E0B' },
  dangerous: { icon: 'close-circle',     iconColor: '#DC2626', bgColor: '#FFF5F5', borderColor: '#F87171' },
};

// ─────────────────────────────────────────────────────────────
//  Outbound Share — Build privacy-safe share text
//
//  Generates a concise Phishing Sense warning message from scan
//  results.  The user's original (potentially sensitive) input is
//  NEVER included — only the analysis verdict, score, and
//  threat indicators are shared.
// ─────────────────────────────────────────────────────────────

function buildShareMessage(result: ScanResult, t: TFunction): string {
  const verdictLabel = t(`scan.result.${result.risk}.label`);
  const emoji =
    result.risk === 'dangerous' ? '🚨' :
    result.risk === 'suspicious' ? '⚠️' : '🛡️';

  const titleKey = result.risk === 'safe' ? 'scan.share.titleCheck' : 'scan.share.titleWarning';
  const lines: string[] = [
    `${emoji} ${t(titleKey)}`,
    '',
    t('scan.share.verdict', { verdict: verdictLabel }),
    t('scan.share.riskScore', { score: result.confidence }),
  ];

  if (result.indicators && result.indicators.length > 0) {
    lines.push('', t('scan.share.why'));
    result.indicators.slice(0, 3).forEach(ind => lines.push(`• ${ind}`));
  } else if (result.details) {
    lines.push('', result.details);
  }

  lines.push('');

  if (result.risk === 'safe') {
    if (result.isDemoFallback) {
      lines.push(t('scan.share.safe.offlineNoMajor'));
      lines.push(t('scan.share.safe.offlineNotVerified'));
    } else {
      lines.push(t('scan.share.safe.noIndicators'));
      lines.push('');
      lines.push(t('scan.share.safe.alwaysVerify'));
    }
  } else if (result.risk === 'suspicious') {
    lines.push(t('scan.share.suspicious'));
  } else {
    lines.push(t('scan.share.dangerous.doNot'));
    lines.push(t('scan.share.dangerous.block'));
  }

  if (result.isDemoFallback && result.risk !== 'safe') {
    lines.push('');
    lines.push(t('scan.share.offlineNotice'));
  }

  lines.push('');
  lines.push(t('scan.share.signature'));

  return lines.join('\n');
}

function buildPhoneShareMessage(r: CheckNumberResponse, t: TFunction): string {
  const verdictLabel =
    r.verdict === 'SAFE' ? t('scan.phoneSafe') :
    r.verdict === 'SUSPICIOUS' ? t('scan.phoneSuspicious') :
    t('scan.phoneDangerous');
  const emoji =
    r.verdict === 'DANGEROUS' ? '🚨' :
    r.verdict === 'SUSPICIOUS' ? '⚠️' : '🛡️';

  const titleKey = r.verdict === 'SAFE' ? 'scan.share.titleCheck' : 'scan.share.titleWarning';
  const lines: string[] = [
    `${emoji} ${t(titleKey)}`,
    '',
    t('scan.share.verdict', { verdict: verdictLabel }),
    t('scan.share.riskScore', { score: r.risk_score }),
  ];

  if (r.normalized_number) {
    lines.push(t('scan.share.phone.number', { number: r.normalized_number }));
  }
  if (r.carrier) {
    lines.push(t('scan.share.phone.network', { carrier: r.carrier }));
  }
  if (r.reason) {
    lines.push('', r.reason);
  }

  lines.push('');

  if (r.verdict === 'SAFE') {
    lines.push(t(r.valid ? 'scan.share.phone.safe.valid' : 'scan.share.phone.safe.invalid'));
  } else if (r.verdict === 'SUSPICIOUS') {
    lines.push(t('scan.share.phone.suspicious'));
  } else {
    lines.push(t('scan.share.phone.dangerous.doNot'));
    lines.push(t('scan.share.phone.dangerous.block'));
  }

  lines.push('');
  lines.push(t('scan.share.signature'));

  return lines.join('\n');
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestedType?: ScanType;
}

export function validateScanTypeInput(content: string, type: ScanType): ValidationResult {
  const trimmed = content.trim();
  if (!trimmed) return { valid: true };

  const lower = trimmed.toLowerCase();

  // 1. URL tab restriction
  if (type === 'url') {
    const isExplicitUrl = lower.startsWith('http://') || lower.startsWith('https://');
    const isDomainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/\S*)?$/i.test(trimmed);
    const hasSpace = /\s/.test(trimmed);
    const hasEmailAt = lower.includes('@');
    const isPurePhone = /^\+?[\d\s\-()]{7,20}$/.test(trimmed) && trimmed.replace(/\D/g, '').length >= 7 && !/[a-zA-Z]/.test(trimmed);

    if (hasEmailAt) {
      return {
        valid: false,
        error: 'This tab is for URLs only. You entered an email address. Please switch to the Email tab.',
        suggestedType: 'email',
      };
    }
    if (isPurePhone) {
      return {
        valid: false,
        error: 'This tab is for URLs only. You entered a phone number. Please switch to the Phone tab.',
        suggestedType: 'phone',
      };
    }
    if (hasSpace || (!isExplicitUrl && !isDomainPattern)) {
      return {
        valid: false,
        error: 'Invalid URL format. Please enter a valid link (e.g. https://example.com or domain.com).',
      };
    }
  }

  // 2. Email tab restriction
  if (type === 'email') {
    const hasEmailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed) || lower.includes('@');
    const isExplicitUrlWithoutEmail = (lower.startsWith('http://') || lower.startsWith('https://') || /^([a-zA-Z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(trimmed)) && !lower.includes('@') && !/\s/.test(trimmed);
    const isPurePhone = /^\+?[\d\s\-()]{7,20}$/.test(trimmed) && !lower.includes('@') && trimmed.replace(/\D/g, '').length >= 7 && !/[a-zA-Z]/.test(trimmed);

    if (isExplicitUrlWithoutEmail) {
      return {
        valid: false,
        error: 'This tab is for Emails only. You entered a web link. Please switch to the Link tab.',
        suggestedType: 'url',
      };
    }
    if (isPurePhone) {
      return {
        valid: false,
        error: 'This tab is for Emails only. You entered a phone number. Please switch to the Phone tab.',
        suggestedType: 'phone',
      };
    }
    if (!hasEmailPattern) {
      return {
        valid: false,
        error: 'Invalid Email. Please enter a valid email address (e.g. user@domain.com) or email content.',
      };
    }
  }

  // 3. Phone tab restriction
  if (type === 'phone') {
    const isExplicitUrl = (lower.startsWith('http://') || lower.startsWith('https://') || /^([a-zA-Z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(trimmed)) && !/\s/.test(trimmed);
    const isEmail = lower.includes('@');
    const isPhonePattern = /^\+?[\d\s\-()]{7,20}$/.test(trimmed);
    const digitsOnly = trimmed.replace(/\D/g, '');
    const hasLetters = /[a-zA-Z]/.test(trimmed);

    if (isExplicitUrl) {
      return {
        valid: false,
        error: 'This tab is for Phone numbers only. You entered a web link. Please switch to the Link tab.',
        suggestedType: 'url',
      };
    }
    if (isEmail) {
      return {
        valid: false,
        error: 'This tab is for Phone numbers only. You entered an email address. Please switch to the Email tab.',
        suggestedType: 'email',
      };
    }
    if (hasLetters || !isPhonePattern || digitsOnly.length < 7 || digitsOnly.length > 15) {
      return {
        valid: false,
        error: 'Invalid Phone Number. Please enter a valid phone number (e.g. +92 300 1234567 or 03001234567).',
      };
    }
  }

  // 4. SMS / Message tab restriction
  if (type === 'message') {
    const isExplicitUrl = (lower.startsWith('http://') || lower.startsWith('https://') || /^([a-zA-Z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(trimmed)) && !/\s/.test(trimmed);
    const isStandaloneEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
    const isStandalonePhone = /^\+?[\d\s\-()]{7,20}$/.test(trimmed) && trimmed.replace(/\D/g, '').length >= 7 && !/[a-zA-Z]/.test(trimmed);

    if (isExplicitUrl) {
      return {
        valid: false,
        error: 'You entered a standalone link. Please switch to the Link tab to scan web links.',
        suggestedType: 'url',
      };
    }
    if (isStandaloneEmail) {
      return {
        valid: false,
        error: 'You entered an Email address. Please switch to the Email tab to scan emails.',
        suggestedType: 'email',
      };
    }
    if (isStandalonePhone) {
      return {
        valid: false,
        error: 'You entered a Phone number. Please switch to the Phone tab to check phone numbers.',
        suggestedType: 'phone',
      };
    }
  }

  return { valid: true };
}

export default function ScanScreen() {
  const { theme }                          = useTheme();
  const { t }                              = useTranslation();
  const { addScan, scanHistory, textSize } = useApp();
  const { language }                       = useLanguage();
  const insets                             = useSafeAreaInsets();
  const isLarge                            = textSize === 'large';

  const [selectedType,    setSelectedType]    = useState<ScanType>('url');
  const [inputContent,    setInputContent]    = useState('');
  const [orbState,        setOrbState]        = useState<OrbState>('idle');
  const [result,          setResult]          = useState<ScanResult | null>(null);
  const [isFocused,       setIsFocused]       = useState(false);
  const [phoneResult,     setPhoneResult]     = useState<CheckNumberResponse | null>(null);
  const [reportStatus,    setReportStatus]    = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [reportCount,     setReportCount]     = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [suggestedTab,    setSuggestedTab]    = useState<ScanType | null>(null);
  const [expandedScanId,  setExpandedScanId]  = useState<string | null>(null);

  const mainScrollRef = useRef<ScrollView>(null);
  const btnScale      = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultSlide   = useRef(new Animated.Value(20)).current;

  const currentType = getScanTypes(t).find(s => s.id === selectedType) ?? getScanTypes(t)[0];
  const hasInput    = inputContent.trim().length > 0;
  const isScanning  = orbState === 'analyzing';

  // ── Manual paste from system clipboard (PRD 4.1) ──────────
  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim()) {
        setInputContent(text.trim());
        if (orbState === 'idle') setOrbState('listening');
      }
    } catch {
      // Clipboard unavailable (e.g. web permission denied) — no-op
    }
  }, [orbState]);

  // ── Voice: callback returns text to auto-speak ──────────
  const handleVoiceTextReady = useCallback(async (text: string): Promise<string> => {
    setInputContent(text);
    setOrbState('analyzing');
    setResult(null);
    resultOpacity.setValue(0);
    resultSlide.setValue(20);
    const scanRes = await addScan(text, scanTypeForContent(text));
    setResult(scanRes);
    setOrbState('result');
    Animated.parallel([
      Animated.timing(resultOpacity, { toValue: 1, duration: 350, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(resultSlide,   { toValue: 0, duration: 350, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
    // Return the verdict summary — the voice hook will auto-speak it
    return buildVoiceSummary(scanRes.risk, scanRes.details, language);
  }, [addScan, language, resultOpacity, resultSlide]);

  const {
    voiceState, recognizedText, errorMessage, isAvailable,
    startListening, stopListening, speakResult, stopSpeaking, reset: resetVoice,
  } = useVoiceAssistant(language, handleVoiceTextReady);

  // ── Route Params ──────────────────────────────
  const params = useLocalSearchParams<{ sharedText?: string; autoScan?: string; ts?: string; type?: ScanType }>();
  const lastProcessedTsRef = useRef<string | null>(null);

  useEffect(() => {
    if (params.type && ['url', 'message', 'email', 'phone'].includes(params.type)) {
      setSelectedType(params.type);
    }
  }, [params.type]);

  const runScanWithContent = useCallback(async (content: string, type: ScanType) => {
    if (!content.trim()) return;

    const val = validateScanTypeInput(content, type);
    if (!val.valid) {
      setValidationError(val.error || 'Invalid input for selected tab.');
      setSuggestedTab(val.suggestedType || null);
      setOrbState('idle');
      return;
    }

    setValidationError(null);
    setSuggestedTab(null);
    Keyboard.dismiss();
    setOrbState('analyzing');
    setResult(null);
    setPhoneResult(null);
    setReportStatus('idle');
    setReportCount(0);
    resultOpacity.setValue(0);
    resultSlide.setValue(20);

    if (type === 'phone') {
      const phoneRes = await checkPhoneNumber(content.trim());
      if (phoneRes) {
        setPhoneResult(phoneRes);
        setReportCount(phoneRes.community_reports);
        speakResult(buildVoiceSummary(phoneRes.verdict.toLowerCase() as 'safe' | 'suspicious' | 'dangerous', phoneRes.reason, language));
      } else {
        const scanRes = await addScan(content, type);
        setResult(scanRes);
        speakResult(buildVoiceSummary(scanRes.risk, scanRes.details, language));
      }
    } else {
      const scanRes = await addScan(content, type);
      setResult(scanRes);
      speakResult(buildVoiceSummary(scanRes.risk, scanRes.details, language));
    }
    setOrbState('result');
    Animated.parallel([
      Animated.timing(resultOpacity, { toValue: 1, duration: 350, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(resultSlide,   { toValue: 0, duration: 350, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  }, [addScan, resultOpacity, resultSlide, speakResult, language]);

  useEffect(() => {
    if (params.sharedText && params.ts && params.ts !== lastProcessedTsRef.current) {
      lastProcessedTsRef.current = params.ts;
      const text = params.sharedText;
      setInputContent(text);
      const inferred = inferContentType(text);
      const targetType: ScanType = params.type || (inferred === 'url' ? 'url' : (inferred === 'phone' ? 'phone' : (inferred === 'email' ? 'email' : 'message')));
      setSelectedType(targetType);

      if (params.autoScan === 'true') {
        runScanWithContent(text, targetType);
      }
    }
  }, [params.sharedText, params.autoScan, params.ts, params.type, runScanWithContent]);

  // ── Existing scan logic ────────────────────────────────────
  const handleScan = async () => {
    if (!inputContent.trim() || isScanning) return;
    setValidationError(null);
    setSuggestedTab(null);

    const val = validateScanTypeInput(inputContent, selectedType);
    if (!val.valid) {
      setValidationError(val.error || 'Invalid input for selected tab.');
      setSuggestedTab(val.suggestedType || null);
      return;
    }

    Keyboard.dismiss();
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80,  useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(btnScale, { toValue: 1,    duration: 150, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
    runScanWithContent(inputContent, selectedType);
  };

  const handleReportCommunity = async () => {
    if (reportStatus === 'sending' || reportStatus === 'done') return;
    setReportStatus('sending');

    const contentType = phoneResult ? 'phone' : (selectedType === 'url' ? 'link' : 'text');
    const identifier = phoneResult?.normalized_number || inputContent.trim();
    const res = await reportToCommunity(contentType, identifier);

    if (res) {
      setReportStatus('done');
      setReportCount(res.count);
    } else {
      setReportStatus('error');
    }
  };

  const handleClear = () => {
    setInputContent('');
    setValidationError(null);
    setSuggestedTab(null);
    setResult(null);
    setPhoneResult(null);
    setReportStatus('idle');
    setReportCount(0);
    setOrbState('idle');
    resultOpacity.setValue(0);
    resetVoice();
  };

  // ── Outbound Share ─────────────────────────────────────
  const handleShareResult = useCallback(async (scanResult: ScanResult) => {
    try {
      const message = buildShareMessage(scanResult, t);
      await Share.share({ message, title: t('scan.shareTitle') });
    } catch {
      // User cancelled or share failed — no-op
    }
  }, [t]);

  const handleSharePhoneResult = useCallback(async (phoneRes: CheckNumberResponse) => {
    try {
      const message = buildPhoneShareMessage(phoneRes, t);
      await Share.share({ message, title: t('scan.shareTitle') });
    } catch {
      // User cancelled or share failed — no-op
    }
  }, [t]);

  const handleTypeSelect = (type: ScanType) => {
    setSelectedType(type);
    setValidationError(null);
    setSuggestedTab(null);
    if (result) handleClear();
    else if (orbState !== 'idle') setOrbState('idle');
  };

  // ── Helpers ──────────────────────────────────────────────
  const orbCaption = (() => {
    switch (orbState) {
      case 'listening':  return t('scan.orbCaption.listening');
      case 'analyzing':  return t('scan.orbCaption.analyzing');
      case 'result':
        if (!result) return t('scan.orbCaption.done');
        return result.risk === 'safe' ? t('scan.orbCaption.resultSafe') : result.risk === 'suspicious' ? t('scan.orbCaption.resultSuspicious') : t('scan.orbCaption.resultDangerous');
      default:           return t('scan.orbCaption.idle');
    }
  })();

  const timeLabel = (ts: Date): string => {
    const diff = Date.now() - ts.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return t('scan.time.justNow');
    if (m < 60) return t('scan.time.minutesAgo', { count: m });
    const h = Math.floor(m / 60);
    if (h < 24) return t('scan.time.hoursAgo', { count: h });
    return t('scan.time.daysAgo', { count: Math.floor(h / 24) });
  };

  const riskIcon = (risk: ScanResult['risk']) => {
    if (risk === 'safe')       return { name: 'shield-checkmark-outline' as const, color: '#2E7D55' };
    if (risk === 'suspicious') return { name: 'warning-outline' as const,          color: '#E07B20' };
    return                            { name: 'close-circle-outline'  as const,    color: '#DC2626' };
  };

  const recentScans = scanHistory.slice(0, 3);
  const resultCfg   = result ? RESULT_CONFIG[result.risk] : null;
  const resultHeadline = result?.isDemoFallback && result.risk === 'safe'
    ? t('scan.result.safe.limitedTitle')
    : result ? t(`scan.result.${result.risk}.title`) : undefined;
  const resultAdvice = result?.isDemoFallback && result.risk === 'safe'
    ? t('scan.result.safe.limitedAdvice')
    : result ? t(`scan.result.${result.risk}.advice`) : undefined;
  const resultAction = result?.isDemoFallback && result.risk === 'safe'
    ? t('scan.result.safe.limitedAction')
    : result ? t(`scan.result.${result.risk}.action`) : undefined;
  const phoneSafeStatus = phoneResult?.valid ? t('scan.phoneSafe') : t('scan.formatNotVerified');
  const phoneRiskColor = phoneResult?.verdict === 'SAFE' ? '#2E7D55' : phoneResult?.verdict === 'SUSPICIOUS' ? '#E07B20' : '#DC2626';

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        ref={mainScrollRef}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.screenLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.primary, fontSize: isLarge ? 13 : 11 }]}>
              {t('scan.screenLabel')}
            </Text>
            <Text style={[styles.screenTitle, { fontFamily: theme.fonts.headingBold, color: theme.colors.textPrimary, fontSize: isLarge ? 26 : 22 }]}>
              {t('scan.screenTitle')}
            </Text>
          </View>
          <View style={[styles.orbMiniWrap, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border }]}>
            <SenseOrb state={orbState} size="xs" />
          </View>
        </View>

        <Text style={[styles.screenSub, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>
          {t('scan.screenSubtitle')}
        </Text>

        {/* ── Scan type chips ────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow} style={styles.typeScroll}>
          {getScanTypes(t).map(opt => {
            const active = selectedType === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handleTypeSelect(opt.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('scan.inputFor', { type: opt.label })}
                accessibilityState={{ selected: active }}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.backgroundCard,
                    borderColor:     active ? theme.colors.primary : theme.colors.border,
                    ...(active
                      ? shadow('sm', { color: theme.colors.primary, opacity: 0.22, radius: 8, offsetY: 3, elevation: 4 })
                      : {}),
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
              ...shadow('sm', {
                color: theme.colors.primary,
                opacity: isFocused ? 0.18 : 0.06,
                radius: isFocused ? 12 : 4,
                offsetY: 4,
                elevation: isFocused ? 6 : 2,
              }),
            },
          ]}
        >
          {/* Label row */}
          <View style={styles.inputLabelRow}>
            <Ionicons name={currentType.icon as any} size={18} color={theme.colors.primary} />
            <Text style={[styles.inputLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 16 : 14 }]}>
              {currentType.label}
            </Text>
            {!hasInput && (
              <TouchableOpacity
                onPress={handlePaste}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.pasteBtn, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel={t('scan.pasteFromClipboard')}
              >
                <Ionicons name="clipboard-outline" size={13} color={theme.colors.primaryDark} />
                <Text style={[styles.pasteBtnText, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.primaryDark, fontSize: isLarge ? 13 : 12 }]}>
                  {t('scan.paste')}
                </Text>
              </TouchableOpacity>
            )}
            {hasInput && (
              <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={[styles.clearBtn, { backgroundColor: theme.colors.backgroundMuted }]}>
                <Ionicons name="close" size={14} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Text area */}
          <TextInput
            value={inputContent}
            onChangeText={(txt) => {
              setInputContent(txt);
              if (validationError) {
                setValidationError(null);
                setSuggestedTab(null);
              }
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
            accessibilityLabel={t('scan.inputFor', { type: currentType.label })}
          />

          {validationError ? (
            <View style={[styles.validationErrorBox, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.validationErrorText, { fontFamily: theme.fonts.bodyMedium, color: '#991B1B', fontSize: isLarge ? 14 : 13 }]}>
                  {validationError}
                </Text>
                {suggestedTab ? (
                  <TouchableOpacity
                    onPress={() => handleTypeSelect(suggestedTab)}
                    activeOpacity={0.8}
                    style={[styles.suggestedTabBtn, { backgroundColor: theme.colors.primary }]}
                  >
                    <Ionicons name="arrow-forward-circle-outline" size={15} color="#FFFFFF" />
                    <Text style={[styles.suggestedTabText, { fontFamily: theme.fonts.bodySemibold, color: '#FFFFFF', fontSize: isLarge ? 13 : 12 }]}>
                      Switch to {getScanTypes(t).find(s => s.id === suggestedTab)?.label}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}

          <Text style={[styles.hintText, { fontFamily: theme.fonts.body, color: theme.colors.textTertiary, fontSize: isLarge ? 13 : 12 }]}>
            💡 {currentType.hint}
          </Text>

          {/* ── Voice input row ─────────────────────────────── */}
          <View style={[styles.voiceRow, { borderTopColor: theme.colors.border }]}>
            <VoiceButton
              voiceState={voiceState}
              isAvailable={isAvailable}
              onStart={startListening}
              onStop={voiceState === 'speaking' ? stopSpeaking : stopListening}
              onReset={resetVoice}
              disabled={isScanning}
            />
            {/* Live transcription preview */}
            {voiceState === 'listening' && recognizedText ? (
              <View style={styles.voiceTranscriptWrap}>
                <Text style={[styles.voiceTranscriptLabel, { fontFamily: theme.fonts.bodyMedium, color: theme.colors.textTertiary, fontSize: isLarge ? 12 : 11 }]}>
                  {t('scan.voice.hearing')}
                </Text>
                <Text
                  style={[styles.voiceTranscriptText, { fontFamily: theme.fonts.body, color: theme.colors.textPrimary, fontSize: isLarge ? 15 : 14 }]}
                  numberOfLines={3}
                >
                  {recognizedText}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Voice error message */}
          {voiceState === 'error' && errorMessage ? (
            <View style={[styles.voiceErrorBox, { backgroundColor: theme.colors.backgroundMuted }]}>
              <Ionicons name="information-circle-outline" size={14} color="#E07B20" />
              <Text style={[styles.voiceErrorText, { fontFamily: theme.fonts.body, color: '#E07B20', fontSize: isLarge ? 13 : 12 }]}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* Scan button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              onPress={handleScan}
              disabled={!hasInput || isScanning}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={t('scan.checkForRisk')}
              accessibilityState={{ disabled: !hasInput || isScanning }}
              style={[
                styles.scanBtn,
                {
                  backgroundColor: hasInput && !isScanning ? theme.colors.primary : theme.colors.border,
                  ...(hasInput && !isScanning
                    ? shadow('md', { color: theme.colors.primary, opacity: 0.35, radius: 14, offsetY: 5, elevation: 6 })
                    : {}),
                },
              ]}
            >
              <Ionicons
                name={isScanning ? 'radio-outline' : 'shield-checkmark-outline'}
                size={IS_WEB ? 17 : 20}
                color={hasInput && !isScanning ? '#FFFFFF' : theme.colors.textDisabled}
                style={styles.btnIcon}
              />
              <Text style={[styles.scanBtnText, { fontFamily: theme.fonts.bodySemibold, fontSize: isLarge ? 18 : 16, color: hasInput && !isScanning ? '#FFFFFF' : theme.colors.textDisabled }]}>
                {isScanning ? t('scan.checking') : t('scan.checkForRisk')}
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
                  {resultHeadline}
                </Text>
              </View>
            </View>

            {result.isDemoFallback && (
              <View style={[styles.offlineNotice, { backgroundColor: '#FFF7ED', borderColor: '#F59E0B' }]}>
                <Ionicons name="cloud-offline-outline" size={16} color="#B45309" />
                <Text style={[styles.offlineNoticeText, { fontFamily: theme.fonts.bodyMedium, color: '#92400E', fontSize: isLarge ? 14 : 13 }]}>
                  {t('scan.result.offlineNotice')}
                </Text>
              </View>
            )}

            {/* Risk gauge 0-100 */}
            <View style={styles.confRow}>
              <Text style={[styles.confLabel, { fontFamily: theme.fonts.body, color: resultCfg.iconColor, fontSize: isLarge ? 13 : 12 }]}>
                {t('scan.riskScore')}
              </Text>
              <View style={[styles.confBarBg, { backgroundColor: resultCfg.borderColor + '33' }]}>
                <View style={[styles.confBarFill, { width: `${result.confidence}%` as any, backgroundColor: resultCfg.iconColor }]} />
              </View>
              <Text style={[styles.confPct, { fontFamily: theme.fonts.bodySemibold, color: resultCfg.iconColor, fontSize: isLarge ? 13 : 12 }]}>
                {result.confidence}/100
              </Text>
            </View>

            {/* Why — max 2 plain-language bullets (PRD 4.1) */}
            {result.indicators && result.indicators.length > 0 && (
              <View style={styles.resultBlock}>
                <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12 }]}>{t('scan.whatWeNoticed')}</Text>
                {result.indicators.slice(0, 2).map((ind, i) => (
                  <View key={i} style={styles.indicatorRow}>
                    <View style={[styles.indicatorDot, { backgroundColor: resultCfg.iconColor }]} />
                    <Text style={[styles.indicatorText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>
                      {ind}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* What this means */}
            <View style={styles.resultBlock}>
              <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12 }]}>{t('scan.whatThisMeans')}</Text>
              <Text style={[styles.resultBlockText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>{resultAdvice}</Text>
            </View>

            {/* What to do */}
            <View style={[styles.resultAdviceBox, { backgroundColor: resultCfg.borderColor + '18', borderColor: resultCfg.borderColor + '55' }]}>
              <View style={styles.resultAdviceRow}>
                <Ionicons name="information-circle-outline" size={16} color={resultCfg.iconColor} />
                <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: resultCfg.iconColor, fontSize: isLarge ? 14 : 12, marginLeft: 6 }]}>{t('scan.whatShouldIDo')}</Text>
              </View>
              <Text style={[styles.resultBlockText, { fontFamily: theme.fonts.body, color: theme.colors.textPrimary, fontSize: isLarge ? 15 : 14, marginTop: 4 }]}>{resultAction}</Text>
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

            {/* Report to community */}
            {(result.risk === 'suspicious' || result.risk === 'dangerous') && (
              <TouchableOpacity
                onPress={handleReportCommunity}
                disabled={reportStatus === 'sending' || reportStatus === 'done'}
                activeOpacity={0.75}
                style={[styles.scanAgainBtn, {
                  borderColor: reportStatus === 'done' ? '#4CAF82' : resultCfg.borderColor,
                  backgroundColor: reportStatus === 'done' ? '#F0FDF4' : 'transparent',
                  marginBottom: 8,
                }]}
              >
                <Ionicons
                  name={reportStatus === 'done' ? 'checkmark-circle' : 'flag-outline'}
                  size={16}
                  color={reportStatus === 'done' ? '#2E7D55' : resultCfg.iconColor}
                />
                <Text style={[styles.scanAgainText, {
                  fontFamily: theme.fonts.bodySemibold,
                  color: reportStatus === 'done' ? '#2E7D55' : resultCfg.iconColor,
                  fontSize: isLarge ? 15 : 14,
                }]}>
                  {reportStatus === 'done' ? t('scan.reportedWithCount', { count: reportCount }) : reportStatus === 'sending' ? t('scan.submitting') : t('scan.reportAsScam')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Share result */}
            {result && (
              <TouchableOpacity
                onPress={() => handleShareResult(result)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('scan.shareResult')}
                style={[styles.scanAgainBtn, { borderColor: resultCfg.iconColor }]}
              >
                <Ionicons name="share-outline" size={16} color={resultCfg.iconColor} />
                <Text style={[styles.scanAgainText, { fontFamily: theme.fonts.bodySemibold, color: resultCfg.iconColor, fontSize: isLarge ? 15 : 14 }]}>
                  {t('scan.shareResult')}
                </Text>
              </TouchableOpacity>
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

        {/* ── Phone number result card ──────────────────────── */}
        {phoneResult && (
          <Animated.View style={[styles.resultCard, {
            backgroundColor: phoneResult.verdict === 'SAFE' ? '#F0FDF4' : phoneResult.verdict === 'SUSPICIOUS' ? '#FFFBEB' : '#FFF5F5',
            borderColor: phoneResult.verdict === 'SAFE' ? '#4CAF82' : phoneResult.verdict === 'SUSPICIOUS' ? '#F59E0B' : '#F87171',
            opacity: resultOpacity,
            transform: [{ translateY: resultSlide }],
          }]}>
            <View style={styles.resultHeaderRow}>
              <View style={[styles.resultIconWrap, { backgroundColor: phoneResult.verdict === 'SAFE' ? '#4CAF8222' : phoneResult.verdict === 'SUSPICIOUS' ? '#F59E0B22' : '#F8717122' }]}>
                <Ionicons
                  name={phoneResult.verdict === 'SAFE' ? 'shield-checkmark' : phoneResult.verdict === 'SUSPICIOUS' ? 'warning' : 'close-circle'}
                  size={28}
                  color={phoneResult.verdict === 'SAFE' ? '#2E7D55' : phoneResult.verdict === 'SUSPICIOUS' ? '#E07B20' : '#DC2626'}
                />
              </View>
              <View style={styles.resultHeaderText}>
                <Badge
                  variant={phoneResult.verdict.toLowerCase() as any}
                  label={phoneResult.verdict === 'SAFE' ? phoneSafeStatus : phoneResult.verdict === 'SUSPICIOUS' ? t('scan.result.suspicious.label') : t('scan.result.dangerous.label')}
                />
                <Text style={[styles.resultHeadline, {
                  fontFamily: theme.fonts.headingBold,
                  color: phoneResult.verdict === 'SAFE' ? '#2E7D55' : phoneResult.verdict === 'SUSPICIOUS' ? '#E07B20' : '#DC2626',
                  fontSize: isLarge ? 20 : 17,
                  marginTop: 4,
                }]}>
                  {phoneResult.verdict === 'SAFE' ? phoneSafeStatus : phoneResult.verdict === 'SUSPICIOUS' ? t('scan.phoneSuspicious') : t('scan.phoneDangerous')}
                </Text>
              </View>
            </View>

            {/* Risk gauge 0-100 */}
            <View style={styles.confRow}>
              <Text style={[styles.confLabel, { fontFamily: theme.fonts.body, color: phoneRiskColor, fontSize: isLarge ? 13 : 12 }]}>
                {t('scan.riskScore')}
              </Text>
              <View style={[styles.confBarBg, { backgroundColor: phoneRiskColor + '33' }]}>
                <View style={[styles.confBarFill, { width: `${Math.min(100, Math.max(0, phoneResult.risk_score))}%` as any, backgroundColor: phoneRiskColor }]} />
              </View>
              <Text style={[styles.confPct, { fontFamily: theme.fonts.bodySemibold, color: phoneRiskColor, fontSize: isLarge ? 13 : 12 }]}>
                {phoneResult.risk_score}/100
              </Text>
            </View>

            {/* Phone details */}
            <View style={styles.resultBlock}>
              <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12 }]}>{t('scan.numberLabel')}</Text>
              <Text style={[styles.resultBlockText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>{phoneResult.normalized_number || inputContent}</Text>
            </View>

            {phoneResult.carrier && (
              <View style={styles.resultBlock}>
                <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12 }]}>{t('scan.networkLabel')}</Text>
                <Text style={[styles.resultBlockText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>{phoneResult.carrier}</Text>
              </View>
            )}

            <View style={styles.resultBlock}>
              <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12 }]}>{t('scan.assessmentLabel')}</Text>
              <Text style={[styles.resultBlockText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>{phoneResult.reason}</Text>
            </View>

            {/* Community reports */}
            <View style={[styles.resultAdviceBox, { backgroundColor: 'rgba(0,0,0,0.03)', borderColor: theme.colors.border }]}>
              <View style={styles.resultAdviceRow}>
                <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12, marginLeft: 6 }]}>
                  {t('scan.communityReports')}
                </Text>
              </View>
              <Text style={[styles.resultBlockText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14, marginTop: 4 }]}>
                {reportCount > 0
                  ? t(reportCount === 1 ? 'scan.onePersonReported' : 'scan.manyPeopleReported', { count: reportCount })
                  : phoneResult.valid
                    ? t('scan.noReportsKnown')
                    : t('scan.formatNotVerified')}
              </Text>
            </View>

            {/* Report button */}
            <TouchableOpacity
              onPress={handleReportCommunity}
              disabled={reportStatus === 'sending' || reportStatus === 'done'}
              activeOpacity={0.75}
              style={[styles.scanAgainBtn, {
                borderColor: reportStatus === 'done' ? '#4CAF82' : phoneResult.verdict === 'SUSPICIOUS' ? '#F59E0B' : '#DC2626',
                backgroundColor: reportStatus === 'done' ? '#F0FDF4' : 'transparent',
              }]}
            >
              <Ionicons
                name={reportStatus === 'done' ? 'checkmark-circle' : reportStatus === 'sending' ? 'hourglass-outline' : 'flag-outline'}
                size={16}
                color={reportStatus === 'done' ? '#2E7D55' : phoneResult.verdict === 'SUSPICIOUS' ? '#E07B20' : '#DC2626'}
              />
              <Text style={[styles.scanAgainText, {
                fontFamily: theme.fonts.bodySemibold,
                color: reportStatus === 'done' ? '#2E7D55' : phoneResult.verdict === 'SUSPICIOUS' ? '#E07B20' : '#DC2626',
                fontSize: isLarge ? 15 : 14,
              }]}>
                {reportStatus === 'done' ? t('scan.reportedWithCount', { count: reportCount }) : reportStatus === 'sending' ? t('scan.submitting') : t('scan.reportAsScam')}
              </Text>
            </TouchableOpacity>

            {/* Share result */}
            {phoneResult && (
              <TouchableOpacity
                onPress={() => handleSharePhoneResult(phoneResult)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('scan.shareResult')}
                style={[styles.scanAgainBtn, { borderColor: phoneRiskColor }]}
              >
                <Ionicons name="share-outline" size={16} color={phoneRiskColor} />
                <Text style={[styles.scanAgainText, { fontFamily: theme.fonts.bodySemibold, color: phoneRiskColor, fontSize: isLarge ? 15 : 14 }]}>
                  {t('scan.shareResult')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Scan again */}
            <TouchableOpacity
              onPress={handleClear}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('scan.checkAnotherNumber')}
              style={[styles.scanAgainBtn, { borderColor: theme.colors.border, marginTop: 8 }]}
            >
              <Ionicons name="refresh-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.scanAgainText, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>
                {t('scan.checkAnotherNumber')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Recent checks ──────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { fontFamily: theme.fonts.heading, color: theme.colors.textPrimary, fontSize: isLarge ? 17 : 15 }]}>
          {t('scan.recentChecks')}
        </Text>

        {recentScans.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.backgroundCard, borderColor: theme.colors.border }]}>
            <View style={[styles.emptyOrbWrap, { backgroundColor: theme.colors.primaryLight }]}>
              <SenseOrb state="idle" size="sm" />
            </View>
            <Text style={[styles.emptyTitle, { fontFamily: theme.fonts.heading, color: theme.colors.textPrimary, fontSize: isLarge ? 16 : 15 }]}>
              {t('scan.noChecksYet')}
            </Text>
            <Text style={[styles.emptySub, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 14 : 13 }]}>
              {t('scan.noChecksSub')}
            </Text>
          </View>
        ) : (
          recentScans.map((scan) => {
            const icon        = riskIcon(scan.risk);
            const isExpanded  = expandedScanId === scan.id;
            const previewText = scan.content.length > 56 ? scan.content.slice(0, 56) + '…' : scan.content;

            return (
              <View
                key={scan.id}
                style={[
                  styles.historyCard,
                  isExpanded && styles.historyCardExpanded,
                  {
                    backgroundColor: theme.colors.backgroundCard,
                    borderColor:     isExpanded ? theme.colors.primary : theme.colors.border,
                    ...shadow('sm', { opacity: isExpanded ? 0.12 : 0.06, radius: isExpanded ? 8 : 6, offsetY: 2, elevation: isExpanded ? 4 : 2 }),
                  },
                ]}
              >
                {/* Header row - tap to toggle full message */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setExpandedScanId(isExpanded ? null : scan.id)}
                  style={styles.historyCardHeader}
                  accessibilityRole="button"
                  accessibilityLabel={isExpanded ? 'Collapse previous scan' : 'Expand previous scan'}
                >
                  <View style={[styles.historyIconWrap, { backgroundColor: theme.colors.backgroundMuted }]}>
                    <Ionicons name={icon.name} size={IS_WEB ? 17 : 20} color={icon.color} />
                  </View>
                  <View style={styles.historyContent}>
                    <Text numberOfLines={isExpanded ? undefined : 1} style={[styles.historyText, { fontFamily: theme.fonts.bodyMedium, color: theme.colors.textPrimary, fontSize: isLarge ? 15 : 13 }]}>
                      {isExpanded ? scan.content.slice(0, 48) + (scan.content.length > 48 ? '…' : '') : previewText}
                    </Text>
                    <View style={styles.historyMeta}>
                      <Badge variant={scan.risk} label={t(`scan.result.${scan.risk}.label`)} dot={false} />
                      <Text style={[styles.historyTime, { fontFamily: theme.fonts.body, color: theme.colors.textTertiary, fontSize: isLarge ? 12 : 11 }]}>
                        {timeLabel(scan.timestamp)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={isExpanded ? theme.colors.primary : theme.colors.textTertiary}
                    style={{ marginStart: 8 }}
                  />
                </TouchableOpacity>

                {/* Expanded complete message & details */}
                {isExpanded && (
                  <View style={styles.historyExpandedBody}>
                    <View style={[styles.historyDivider, { backgroundColor: theme.colors.border }]} />

                    <Text style={[styles.historySectionLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textSecondary, fontSize: isLarge ? 12 : 11 }]}>
                      {t('scan.fullMessageContent', { defaultValue: 'COMPLETE SCANNED CONTENT' })}
                    </Text>

                    <View style={[styles.historyFullTextWrap, { backgroundColor: theme.colors.backgroundMuted, borderColor: theme.colors.border }]}>
                      <ScrollView
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={true}
                        style={{ maxHeight: 200 }}
                      >
                        <Text
                          selectable
                          style={[
                            styles.historyFullText,
                            { fontFamily: theme.fonts.body, color: theme.colors.textPrimary, fontSize: isLarge ? 15 : 13 },
                          ]}
                        >
                          {scan.content}
                        </Text>
                      </ScrollView>
                    </View>

                    {scan.details ? (
                      <View style={{ marginTop: 10 }}>
                        <Text style={[styles.historySectionLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textSecondary, fontSize: isLarge ? 12 : 11 }]}>
                          {t('scan.result.details', { defaultValue: 'ASSESSMENT' })}
                        </Text>
                        <Text style={[styles.historyDetailText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 14 : 12 }]}>
                          {scan.details}
                        </Text>
                      </View>
                    ) : null}

                    {scan.explanationUr ? (
                      <View style={{ marginTop: 8 }}>
                        <Text style={[styles.historySectionLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.primaryDark, fontSize: isLarge ? 12 : 11 }]}>
                          ROMAN URDU
                        </Text>
                        <Text style={[styles.historyDetailText, { fontFamily: theme.fonts.body, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12 }]}>
                          {scan.explanationUr}
                        </Text>
                      </View>
                    ) : null}

                    {scan.indicators && scan.indicators.length > 0 ? (
                      <View style={{ marginTop: 10 }}>
                        <Text style={[styles.historySectionLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textSecondary, fontSize: isLarge ? 12 : 11 }]}>
                          {t('scan.whatWeNoticed', { defaultValue: 'THREAT INDICATORS' })}
                        </Text>
                        {scan.indicators.map((ind, i) => (
                          <View key={i} style={styles.historyIndicatorRow}>
                            <View style={[styles.historyIndicatorDot, { backgroundColor: icon.color }]} />
                            <Text style={[styles.historyIndicatorText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 14 : 12 }]}>
                              {ind}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <View style={styles.historyActionRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setInputContent(scan.content);
                          const targetType: ScanType = scan.type === 'phone' ? 'phone' : (scan.type === 'url' ? 'url' : (scan.type === 'email' ? 'email' : 'message'));
                          setSelectedType(targetType);
                          mainScrollRef.current?.scrollTo({ y: 0, animated: true });
                        }}
                        style={[styles.historyActionBtn, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}
                      >
                        <Ionicons name="refresh-outline" size={14} color={theme.colors.primaryDark} />
                        <Text style={[styles.historyActionText, { color: theme.colors.primaryDark, fontFamily: theme.fonts.bodySemibold, fontSize: isLarge ? 13 : 12 }]}>
                          Load in Scanner
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleShareResult(scan)}
                        style={[styles.historyActionBtn, { backgroundColor: theme.colors.backgroundMuted, borderColor: theme.colors.border }]}
                      >
                        <Ionicons name="share-outline" size={14} color={theme.colors.textSecondary} />
                        <Text style={[styles.historyActionText, { color: theme.colors.textSecondary, fontFamily: theme.fonts.bodySemibold, fontSize: isLarge ? 13 : 12 }]}>
                          {t('scan.shareResult')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* ── Safety tips ────────────────────────────────────── */}
        <View style={[styles.tipsCard, { backgroundColor: theme.colors.skyLight, borderColor: theme.colors.sky + '80' }]}>
          <View style={styles.tipsHeaderRow}>
            <Ionicons name="bulb-outline" size={IS_WEB ? 15 : 18} color={theme.colors.skyDark} />
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
  scroll: { paddingHorizontal: IS_WEB ? 14 : 20 },

  topBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  screenLabel:  { letterSpacing: 1.2, marginBottom: 2 },
  screenTitle:  { letterSpacing: -0.4 },
  orbMiniWrap:  { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  screenSub:    { lineHeight: 22, marginBottom: 20 },

  typeScroll: { marginHorizontal: -20, marginBottom: 16 },
  typeRow:    { paddingHorizontal: IS_WEB ? 14 : 20, gap: IS_WEB ? 8 : 10, paddingBottom: 4 },
  typeChip:   { flexDirection: 'row', alignItems: 'center', gap: IS_WEB ? 5 : 6, paddingVertical: IS_WEB ? 7 : 10, paddingHorizontal: IS_WEB ? 12 : 16, borderRadius: 999, borderWidth: 1.5 },
  typeLabel:  { letterSpacing: 0.1 },

  inputCard:      { borderRadius: IS_WEB ? 16 : 20, padding: IS_WEB ? 14 : 20, marginBottom: 10 },
  inputLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  inputLabel:     { flex: 1 },
  pasteBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, height: 28, borderRadius: 14, paddingHorizontal: 10, borderWidth: 1 },
  pasteBtnText:   { letterSpacing: 0.2 },
  clearBtn:       { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  textArea:       { minHeight: 110, lineHeight: 22, marginBottom: 8, padding: 0, ...Platform.select({ android: { textAlignVertical: 'top' } }) },
  hintText:       { lineHeight: 18, marginBottom: 14 },
  divider:        { height: 1, marginBottom: IS_WEB ? 12 : 16 },
  scanBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: IS_WEB ? 46 : 56, borderRadius: 999, paddingHorizontal: IS_WEB ? 18 : 24 },
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
  offlineNotice:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 16 },
  offlineNoticeText:{ flex: 1, lineHeight: 20 },
  confRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  confLabel:        { width: 72 },
  confBarBg:        { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  confBarFill:      { height: 6, borderRadius: 3 },
  confPct:          { width: 44, textAlign: 'right' },
  indicatorRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  indicatorDot:     { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  indicatorText:    { flex: 1, lineHeight: 21 },
  resultBlock:      { marginBottom: 12 },
  resultBlockLabel: { marginBottom: 4, letterSpacing: 0.1 },
  resultBlockText:  { lineHeight: 22 },
  resultAdviceBox:  { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  resultAdviceRow:  { flexDirection: 'row', alignItems: 'center' },
  detailsBox:       { paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', marginBottom: 14 },
  detailsLabel:     { marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  detailsText:      { lineHeight: 20 },
  scanAgainBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 999, borderWidth: 1.5, minHeight: 44, paddingVertical: IS_WEB ? 9 : 12, paddingHorizontal: IS_WEB ? 16 : 20, marginTop: 4 },
  scanAgainText:    { letterSpacing: 0.2 },

  sectionTitle: { marginBottom: 12, marginTop: 4, letterSpacing: -0.2 },

  emptyState:   { borderRadius: IS_WEB ? 16 : 20, borderWidth: 1.5, padding: IS_WEB ? 20 : 28, alignItems: 'center', marginBottom: IS_WEB ? 18 : 24 },
  emptyOrbWrap: { width: IS_WEB ? 64 : 80, height: IS_WEB ? 64 : 80, borderRadius: IS_WEB ? 32 : 40, alignItems: 'center', justifyContent: 'center', marginBottom: IS_WEB ? 12 : 16 },
  emptyTitle:   { marginBottom: 8, letterSpacing: -0.2 },
  emptySub:     { textAlign: 'center', lineHeight: 21 },

  historyCard:         { borderRadius: IS_WEB ? 14 : 16, borderWidth: 1.5, padding: IS_WEB ? 10 : 14, marginBottom: 10 },
  historyCardExpanded: { paddingBottom: 16 },
  historyCardHeader:   { flexDirection: 'row', alignItems: 'center', gap: IS_WEB ? 10 : 12 },
  historyIconWrap:     { width: IS_WEB ? 36 : 44, height: IS_WEB ? 36 : 44, borderRadius: IS_WEB ? 18 : 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  historyContent:      { flex: 1 },
  historyText:         { marginBottom: 6 },
  historyMeta:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyTime:         { marginLeft: 'auto' },

  historyExpandedBody:  { marginTop: 12 },
  historyDivider:       { height: 1, marginBottom: 12 },
  historySectionLabel:  { letterSpacing: 0.8, marginBottom: 6 },
  historyFullTextWrap:  { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
  historyFullText:      { lineHeight: 21 },
  historyDetailText:    { lineHeight: 20 },
  historyIndicatorRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  historyIndicatorDot:  { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  historyIndicatorText: { flex: 1, lineHeight: 18 },
  historyActionRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  historyActionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
  historyActionText:    { letterSpacing: 0.2 },

  tipsCard:      { borderRadius: IS_WEB ? 14 : 16, borderWidth: 1, padding: IS_WEB ? 12 : 16, marginTop: 8 },
  tipsHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  tipsHeading:   { letterSpacing: -0.1 },
  tipRow:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 6 },
  tipDot:        { fontSize: 16, lineHeight: 20 },
  tipText:       { flex: 1, lineHeight: 20 },

  // ── Voice input styles ──────────────────────────────────
  voiceRow:             { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 14, paddingBottom: 4, borderTopWidth: 1, marginTop: 8 },
  voiceTranscriptWrap:  { flex: 1 },
  voiceTranscriptLabel: { marginBottom: 2 },
  voiceTranscriptText:  { lineHeight: 20 },
  voiceErrorBox:        { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, padding: 10, marginTop: 4 },
  voiceErrorText:       { flex: 1, lineHeight: 18 },

  // ── Tab Validation styles ───────────────────────────────
  validationErrorBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 8, marginBottom: 12 },
  validationErrorText:  { lineHeight: 19 },
  suggestedTabBtn:      { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, marginTop: 8 },
  suggestedTabText:     { letterSpacing: 0.2 },
});



