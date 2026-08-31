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
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../src/theme/ThemeContext';
import { IS_WEB } from '../../src/theme/responsive';
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

const SCAN_TYPES: ScanTypeOption[] = [
  { id: 'url',     icon: 'link-outline',       label: 'Link / URL',    placeholder: 'Paste a suspicious link here…',          hint: 'e.g. https://paypal-secure.xyz/login' },
  { id: 'message', icon: 'chatbubble-outline',  label: 'Message / SMS', placeholder: 'Paste a suspicious message here…',       hint: '"Your account has been suspended. Click here…"' },
  { id: 'email',   icon: 'mail-outline',        label: 'Email Text',    placeholder: 'Paste suspicious email content here…',   hint: 'Copy the full email body or sender address' },
  { id: 'phone',   icon: 'call-outline',        label: 'Phone Number',  placeholder: 'Enter a suspicious phone number…',       hint: 'e.g. +92 300 1234567' },
];

function scanTypeForContent(content: string): ScanType {
  const inferred = inferContentType(content);
  if (inferred === 'url' || inferred === 'email' || inferred === 'phone') return inferred;
  return 'message';
}

const RESULT_CONFIG = {
  safe:      { icon: 'shield-checkmark', iconColor: '#2E7D55', bgColor: '#F0FDF4', borderColor: '#4CAF82',  headline: 'Looks Safe ✓',       advice: 'No signs of phishing or scams were found.',                                          action: 'This appears safe — but always be cautious when sharing personal information online.' },
  suspicious:{ icon: 'warning',          iconColor: '#E07B20', bgColor: '#FFFBEB', borderColor: '#F59E0B',  headline: 'Be Careful ⚠️',       advice: 'Something about this looks a little unusual.',                                        action: 'Do not share passwords, PINs, or OTPs until you verify this is from a trusted source.' },
  dangerous: { icon: 'close-circle',     iconColor: '#DC2626', bgColor: '#FFF5F5', borderColor: '#F87171',  headline: 'Do Not Proceed 🚫', advice: 'This looks like a phishing attempt or scam.',                                         action: 'Do not click any links, share any information, or respond. Block the sender and report it.' },
};

// ─────────────────────────────────────────────────────────────
//  Outbound Share — Build privacy-safe share text
//
//  Generates a concise Phishing Sense warning message from scan
//  results.  The user's original (potentially sensitive) input is
//  NEVER included — only the analysis verdict, score, and
//  threat indicators are shared.
// ─────────────────────────────────────────────────────────────

function buildShareMessage(result: ScanResult): string {
  const verdict = result.risk.toUpperCase();
  const emoji =
    result.risk === 'dangerous' ? '🚨' :
    result.risk === 'suspicious' ? '⚠️' : '🛡️';

  const lines: string[] = [
    `${emoji} Phishing Sense ${result.risk === 'safe' ? 'Check' : 'Warning'}`,
    '',
    `Verdict: ${verdict}`,
    `Risk Score: ${result.confidence}/100`,
  ];

  if (result.indicators && result.indicators.length > 0) {
    lines.push('', 'Why:');
    result.indicators.slice(0, 3).forEach(ind => lines.push(`• ${ind}`));
  } else if (result.details) {
    lines.push('', result.details);
  }

  lines.push('');

  if (result.risk === 'safe') {
    if (result.isDemoFallback) {
      lines.push('No major warning signs detected in this limited offline check.');
      lines.push('This is not a verified safe result.');
    } else {
      lines.push('No major scam indicators were detected.');
      lines.push('');
      lines.push('Always verify sensitive requests through official channels.');
    }
  } else if (result.risk === 'suspicious') {
    lines.push('Be careful before clicking links or sharing personal information.');
  } else {
    lines.push('Do not click any links, share any information, or respond.');
    lines.push('Block the sender and report it.');
  }

  if (result.isDemoFallback && result.risk !== 'safe') {
    lines.push('');
    lines.push('Offline limited analysis — this is not a verified safe result.');
  }

  lines.push('');
  lines.push('— Phishing Sense');

  return lines.join('\n');
}

function buildPhoneShareMessage(r: CheckNumberResponse): string {
  const verdict = r.verdict.toUpperCase();
  const emoji =
    r.verdict === 'DANGEROUS' ? '🚨' :
    r.verdict === 'SUSPICIOUS' ? '⚠️' : '🛡️';

  const lines: string[] = [
    `${emoji} Phishing Sense ${r.verdict === 'SAFE' ? 'Check' : 'Warning'}`,
    '',
    `Verdict: ${verdict}`,
    `Risk Score: ${r.risk_score}/100`,
  ];

  if (r.normalized_number) {
    lines.push(`Number: ${r.normalized_number}`);
  }
  if (r.carrier) {
    lines.push(`Network: ${r.carrier}`);
  }
  if (r.reason) {
    lines.push('', r.reason);
  }

  lines.push('');

  if (r.verdict === 'SAFE') {
    lines.push(r.valid
      ? 'No community reports are known for this number. This does not prove the caller is legitimate.'
      : 'This number format could not be verified. Treat unknown callers with caution.');
  } else if (r.verdict === 'SUSPICIOUS') {
    lines.push('Be careful with calls or messages from this number.');
  } else {
    lines.push('Do not answer calls or respond to messages from this number.');
    lines.push('Block the number and report it.');
  }

  lines.push('');
  lines.push('— Phishing Sense');

  return lines.join('\n');
}

export default function ScanScreen() {
  const { theme }                          = useTheme();
  const { t }                              = useTranslation();
  const { addScan, scanHistory, textSize } = useApp();
  const { language }                       = useLanguage();
  const insets                             = useSafeAreaInsets();
  const isLarge                            = textSize === 'large';

  const [selectedType, setSelectedType] = useState<ScanType>('url');
  const [inputContent, setInputContent] = useState('');
  const [orbState,     setOrbState]     = useState<OrbState>('idle');
  const [result,       setResult]       = useState<ScanResult | null>(null);
  const [isFocused,    setIsFocused]    = useState(false);
  const [phoneResult,  setPhoneResult]  = useState<CheckNumberResponse | null>(null);
  const [reportStatus, setReportStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [reportCount,  setReportCount]  = useState(0);

  const btnScale      = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultSlide   = useRef(new Animated.Value(20)).current;

  const currentType = SCAN_TYPES.find(s => s.id === selectedType) ?? SCAN_TYPES[0];
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
    // Brief delay for the text to render, then trigger analysis
    await new Promise(resolve => setTimeout(resolve, 1800));
    const scanRes = await addScan(text, scanTypeForContent(text));
    setResult(scanRes);
    setOrbState('result');
    Animated.parallel([
      Animated.timing(resultOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(resultSlide,   { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
    // Return the verdict summary — the voice hook will auto-speak it
    return buildVoiceSummary(scanRes.risk, scanRes.details, language);
  }, [addScan, language]);

  const {
    voiceState, recognizedText, errorMessage, isAvailable,
    startListening, stopListening, speakResult, stopSpeaking, reset: resetVoice,
  } = useVoiceAssistant(language, handleVoiceTextReady);

  // ── Share Intent Route Params ──────────────────────────────
  const params = useLocalSearchParams<{ sharedText?: string; autoScan?: string; ts?: string }>();
  const lastProcessedTsRef = useRef<string | null>(null);

  const runScanWithContent = useCallback(async (content: string, type: ScanType) => {
    if (!content.trim()) return;
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
      Animated.timing(resultOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(resultSlide,   { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [addScan, resultOpacity, resultSlide, speakResult, language]);

  useEffect(() => {
    if (params.sharedText && params.ts && params.ts !== lastProcessedTsRef.current) {
      lastProcessedTsRef.current = params.ts;
      const text = params.sharedText;
      setInputContent(text);
      const inferred = inferContentType(text);
      const targetType: ScanType = inferred === 'url' ? 'url' : (inferred === 'phone' ? 'phone' : (inferred === 'email' ? 'email' : 'message'));
      setSelectedType(targetType);

      if (params.autoScan === 'true') {
        runScanWithContent(text, targetType);
      }
    }
  }, [params.sharedText, params.autoScan, params.ts, runScanWithContent]);

  // ── Existing scan logic ────────────────────────────────────
  const handleScan = async () => {
    if (!inputContent.trim() || isScanning) return;
    Keyboard.dismiss();
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80,  useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 150, useNativeDriver: true }),
    ]).start();
    setOrbState('analyzing');
    setResult(null);
    setPhoneResult(null);
    setReportStatus('idle');
    setReportCount(0);
    resultOpacity.setValue(0);
    resultSlide.setValue(20);

    if (selectedType === 'phone') {
      // Phone number check — dedicated flow
      const phoneRes = await checkPhoneNumber(inputContent.trim());
      if (phoneRes) {
        setPhoneResult(phoneRes);
        setReportCount(phoneRes.community_reports);
        speakResult(buildVoiceSummary(phoneRes.verdict.toLowerCase() as 'safe' | 'suspicious' | 'dangerous', phoneRes.reason, language));
      } else {
        // Fallback to generic scan if backend unavailable
        const scanRes = await addScan(inputContent, selectedType);
        setResult(scanRes);
        speakResult(buildVoiceSummary(scanRes.risk, scanRes.details, language));
      }
      setOrbState('result');
      Animated.parallel([
        Animated.timing(resultOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(resultSlide,   { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    } else {
      setTimeout(async () => {
        const scanRes = await addScan(inputContent, selectedType);
        setResult(scanRes);
        setOrbState('result');
        speakResult(buildVoiceSummary(scanRes.risk, scanRes.details, language));
        Animated.parallel([
          Animated.timing(resultOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(resultSlide,   { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start();
      }, 1800);
    }
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
      const message = buildShareMessage(scanResult);
      await Share.share({ message, title: 'Phishing Sense Warning' });
    } catch {
      // User cancelled or share failed — no-op
    }
  }, []);

  const handleSharePhoneResult = useCallback(async (phoneRes: CheckNumberResponse) => {
    try {
      const message = buildPhoneShareMessage(phoneRes);
      await Share.share({ message, title: 'Phishing Sense Warning' });
    } catch {
      // User cancelled or share failed — no-op
    }
  }, []);

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
  const resultHeadline = result?.isDemoFallback && result.risk === 'safe'
    ? 'Limited Check Complete'
    : resultCfg?.headline;
  const resultAdvice = result?.isDemoFallback && result.risk === 'safe'
    ? 'The offline checks did not find major warning signs, but this is not a verified safe result.'
    : resultCfg?.advice;
  const resultAction = result?.isDemoFallback && result.risk === 'safe'
    ? 'Verify the sender through an official channel before clicking a link, replying, or sharing information.'
    : resultCfg?.action;
  const phoneSafeStatus = phoneResult?.valid ? 'No Known Reports' : 'Format Not Verified';
  const phoneRiskColor = phoneResult?.verdict === 'SAFE' ? '#2E7D55' : phoneResult?.verdict === 'SUSPICIOUS' ? '#E07B20' : '#DC2626';

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
                accessibilityLabel="Paste from clipboard"
              >
                <Ionicons name="clipboard-outline" size={13} color={theme.colors.primaryDark} />
                <Text style={[styles.pasteBtnText, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.primaryDark, fontSize: isLarge ? 13 : 12 }]}>
                  Paste
                </Text>
              </TouchableOpacity>
            )}
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
                  Hearing…
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
              accessibilityLabel="Check for risk"
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
                  {resultHeadline}
                </Text>
              </View>
            </View>

            {result.isDemoFallback && (
              <View style={[styles.offlineNotice, { backgroundColor: '#FFF7ED', borderColor: '#F59E0B' }]}>
                <Ionicons name="cloud-offline-outline" size={16} color="#B45309" />
                <Text style={[styles.offlineNoticeText, { fontFamily: theme.fonts.bodyMedium, color: '#92400E', fontSize: isLarge ? 14 : 13 }]}>
                  Offline limited analysis — this is not a verified safe result.
                </Text>
              </View>
            )}

            {/* Risk gauge 0-100 */}
            <View style={styles.confRow}>
              <Text style={[styles.confLabel, { fontFamily: theme.fonts.body, color: resultCfg.iconColor, fontSize: isLarge ? 13 : 12 }]}>
                Risk Score
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
                <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12 }]}>What we noticed</Text>
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
              <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12 }]}>What this means</Text>
              <Text style={[styles.resultBlockText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>{resultAdvice}</Text>
            </View>

            {/* What to do */}
            <View style={[styles.resultAdviceBox, { backgroundColor: resultCfg.borderColor + '18', borderColor: resultCfg.borderColor + '55' }]}>
              <View style={styles.resultAdviceRow}>
                <Ionicons name="information-circle-outline" size={16} color={resultCfg.iconColor} />
                <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: resultCfg.iconColor, fontSize: isLarge ? 14 : 12, marginLeft: 6 }]}>What should I do?</Text>
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
                  {reportStatus === 'done' ? `Reported (${reportCount}) — Thank You` : reportStatus === 'sending' ? 'Submitting…' : 'Report as Scam to Community'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Share result */}
            {result && (
              <TouchableOpacity
                onPress={() => handleShareResult(result)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Share result"
                style={[styles.scanAgainBtn, { borderColor: resultCfg.iconColor }]}
              >
                <Ionicons name="share-outline" size={16} color={resultCfg.iconColor} />
                <Text style={[styles.scanAgainText, { fontFamily: theme.fonts.bodySemibold, color: resultCfg.iconColor, fontSize: isLarge ? 15 : 14 }]}>
                  Share Result
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
                  label={phoneResult.verdict === 'SAFE' ? phoneSafeStatus : phoneResult.verdict === 'SUSPICIOUS' ? 'Suspicious' : 'Dangerous'}
                />
                <Text style={[styles.resultHeadline, {
                  fontFamily: theme.fonts.headingBold,
                  color: phoneResult.verdict === 'SAFE' ? '#2E7D55' : phoneResult.verdict === 'SUSPICIOUS' ? '#E07B20' : '#DC2626',
                  fontSize: isLarge ? 20 : 17,
                  marginTop: 4,
                }]}>
                  {phoneResult.verdict === 'SAFE' ? phoneSafeStatus : phoneResult.verdict === 'SUSPICIOUS' ? 'Be Careful With This Number' : 'High Risk Number'}
                </Text>
              </View>
            </View>

            {/* Risk gauge 0-100 */}
            <View style={styles.confRow}>
              <Text style={[styles.confLabel, { fontFamily: theme.fonts.body, color: phoneRiskColor, fontSize: isLarge ? 13 : 12 }]}>
                Risk Score
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
              <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12 }]}>Number</Text>
              <Text style={[styles.resultBlockText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>{phoneResult.normalized_number || inputContent}</Text>
            </View>

            {phoneResult.carrier && (
              <View style={styles.resultBlock}>
                <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12 }]}>Network</Text>
                <Text style={[styles.resultBlockText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>{phoneResult.carrier}</Text>
              </View>
            )}

            <View style={styles.resultBlock}>
              <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12 }]}>Assessment</Text>
              <Text style={[styles.resultBlockText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>{phoneResult.reason}</Text>
            </View>

            {/* Community reports */}
            <View style={[styles.resultAdviceBox, { backgroundColor: 'rgba(0,0,0,0.03)', borderColor: theme.colors.border }]}>
              <View style={styles.resultAdviceRow}>
                <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.resultBlockLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textPrimary, fontSize: isLarge ? 14 : 12, marginLeft: 6 }]}>
                  Community Reports
                </Text>
              </View>
              <Text style={[styles.resultBlockText, { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14, marginTop: 4 }]}>
                {reportCount > 0
                  ? `${reportCount} ${reportCount === 1 ? 'person has' : 'people have'} reported this number.`
                  : phoneResult.valid
                    ? 'No community reports are known for this number. This does not prove the caller is legitimate.'
                    : 'This number format could not be verified. Treat unknown callers with caution.'}
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
                {reportStatus === 'done' ? 'Reported — Thank You' : reportStatus === 'sending' ? 'Submitting…' : 'Report as Scam to Community'}
              </Text>
            </TouchableOpacity>

            {/* Share result */}
            {phoneResult && (
              <TouchableOpacity
                onPress={() => handleSharePhoneResult(phoneResult)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Share result"
                style={[styles.scanAgainBtn, { borderColor: phoneRiskColor }]}
              >
                <Ionicons name="share-outline" size={16} color={phoneRiskColor} />
                <Text style={[styles.scanAgainText, { fontFamily: theme.fonts.bodySemibold, color: phoneRiskColor, fontSize: isLarge ? 15 : 14 }]}>
                  Share Result
                </Text>
              </TouchableOpacity>
            )}

            {/* Scan again */}
            <TouchableOpacity
              onPress={handleClear}
              activeOpacity={0.75}
              accessibilityRole="button"
              style={[styles.scanAgainBtn, { borderColor: theme.colors.border, marginTop: 8 }]}
            >
              <Ionicons name="refresh-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.scanAgainText, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textSecondary, fontSize: isLarge ? 15 : 14 }]}>
                Check Another Number
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
                  { backgroundColor: theme.colors.backgroundCard, borderColor: theme.colors.border, ...shadow('sm', { opacity: 0.06, radius: 6, offsetY: 2, elevation: 2 }) },
                ]}
              >
                <View style={[styles.historyIconWrap, { backgroundColor: theme.colors.backgroundMuted }]}>
                  <Ionicons name={icon.name} size={IS_WEB ? 17 : 20} color={icon.color} />
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
  scanAgainBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 999, borderWidth: 1.5, paddingVertical: IS_WEB ? 9 : 12, paddingHorizontal: IS_WEB ? 16 : 20, marginTop: 4 },
  scanAgainText:    { letterSpacing: 0.2 },

  sectionTitle: { marginBottom: 12, marginTop: 4, letterSpacing: -0.2 },

  emptyState:   { borderRadius: IS_WEB ? 16 : 20, borderWidth: 1.5, padding: IS_WEB ? 20 : 28, alignItems: 'center', marginBottom: IS_WEB ? 18 : 24 },
  emptyOrbWrap: { width: IS_WEB ? 64 : 80, height: IS_WEB ? 64 : 80, borderRadius: IS_WEB ? 32 : 40, alignItems: 'center', justifyContent: 'center', marginBottom: IS_WEB ? 12 : 16 },
  emptyTitle:   { marginBottom: 8, letterSpacing: -0.2 },
  emptySub:     { textAlign: 'center', lineHeight: 21 },

  historyCard:     { flexDirection: 'row', alignItems: 'center', gap: IS_WEB ? 10 : 12, borderRadius: IS_WEB ? 14 : 16, borderWidth: 1.5, padding: IS_WEB ? 10 : 14, marginBottom: 10 },
  historyIconWrap: { width: IS_WEB ? 36 : 44, height: IS_WEB ? 36 : 44, borderRadius: IS_WEB ? 18 : 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  historyContent:  { flex: 1 },
  historyText:     { marginBottom: 6 },
  historyMeta:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyTime:     { marginLeft: 'auto' },

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
});



