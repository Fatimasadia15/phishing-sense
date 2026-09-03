import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { IS_WEB, USE_NATIVE_DRIVER } from '../../src/theme/responsive';
import { shadow } from '../../src/theme/tokens';
import { useApp } from '../../src/store/AppContext';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { useVoiceAssistant, detectLanguageForTTS } from '../../src/services/voice';
import { SenseOrb } from '../../src/components/ui/SenseOrb';

// ─────────────────────────────────────────────────────────────
//  Sense AI Screen — Phase 4 Redesign
//  "A calm, intelligent friend who helps you understand
//   whether something online is safe."
// ─────────────────────────────────────────────────────────────

// Animated 3-dot thinking indicator
function ThinkingDots({ color }: { color: string }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1,   duration: 350, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(val, { toValue: 0.3, duration: 350, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.delay(700 - delay),
        ])
      );
    const anim = Animated.parallel([pulse(dot1, 0), pulse(dot2, 200), pulse(dot3, 400)]);
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={tdStyles.row}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View key={i} style={[tdStyles.dot, { backgroundColor: color, opacity: d }]} />
      ))}
    </View>
  );
}

const tdStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

export default function SenseAIScreen() {
  const { theme }  = useTheme();
  const { t }      = useTranslation();
  const { language } = useLanguage();
  const {
    chatMessages,
    sendChatMessage,
    isChatThinking,
    clearChat,
    textSize,
  } = useApp();
  const insets  = useSafeAreaInsets();
  const isLarge = textSize === 'large';

  const [input, setInput]         = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const sendScale = useRef(new Animated.Value(1)).current;
  // When true, the next assistant reply is spoken aloud (voice-initiated chat)
  const speakNextRef = useRef(false);

  const suggestions = t('senseAi.suggestions', { returnObjects: true }) as string[];
  const hasMessages = chatMessages.length > 0;

  // ── Voice input: transcript lands in the input field, then auto-sends ──
  const handleVoiceTextReady = useCallback((text: string) => {
    setInput(text);
    if (isChatThinking) return; // AI busy — keep text in the field for manual send
    speakNextRef.current = true;
    // Brief pause so the user sees what was heard before it sends
    setTimeout(() => {
      sendChatMessage(text, language);
      setInput('');
    }, 900);
  }, [language, isChatThinking, sendChatMessage]);

  const {
    voiceState, recognizedText, errorMessage, isAvailable,
    startListening, stopListening, speakResult, stopSpeaking, reset: resetVoice,
  } = useVoiceAssistant(language, handleVoiceTextReady);

  // ── Chat Send Logic ──────────────────────────────
  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isChatThinking) return;

    // Immediately stop any currently playing voice speech when sending a new message
    stopSpeaking();
    speakNextRef.current = false;

    // Press animation
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.88, duration: 80,  useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(sendScale, { toValue: 1,    duration: 150, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();

    sendChatMessage(query, language);
    setInput('');
  };

  // Auto-speak the AI reply for voice-initiated questions
  useEffect(() => {
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (speakNextRef.current && lastMsg && lastMsg.role === 'assistant' && !isChatThinking) {
      speakNextRef.current = false;
      const ttsLang = detectLanguageForTTS(lastMsg.content) === 'ur-PK' ? 'ur' : 'en';
      speakResult(lastMsg.content, ttsLang);
    }
  }, [chatMessages, isChatThinking, speakResult]);

  // Clean up speech when screen unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [chatMessages, isChatThinking]);

  // ── Orb state derived from chat state ─────────────────────
  const orbState = isChatThinking ? 'analyzing' : hasMessages ? 'result' : 'idle';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >

      {/* ── Header ──────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            paddingTop:      insets.top + 12,
            borderBottomColor: theme.colors.border,
            backgroundColor:   theme.colors.background,
          },
        ]}
      >
        <View style={styles.headerRow}>
          {/* Left: Sense Orb indicator */}
          <View style={[styles.headerOrbWrap, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border }]}>
            <SenseOrb state={orbState} size="xs" />
          </View>

          {/* Centre: Title + subtitle */}
          <View style={styles.headerText}>
            <Text
              style={[
                styles.headerTitle,
                { fontFamily: theme.fonts.headingBold, color: theme.colors.textPrimary, fontSize: isLarge ? 20 : 17 },
              ]}
            >
              {t('senseAi.title')}
            </Text>
            <Text
              style={[
                styles.headerSub,
                { fontFamily: theme.fonts.body, color: isChatThinking ? theme.colors.primary : theme.colors.textSecondary, fontSize: isLarge ? 13 : 12 },
              ]}
            >
              {isChatThinking ? `● ${t('senseAi.headerThinking')}` : t('senseAi.headerSubtitle')}
            </Text>
          </View>

          {/* Right: Clear button if messages exist */}
          {hasMessages && (
            <TouchableOpacity
              onPress={clearChat}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.clearBtn, { backgroundColor: theme.colors.backgroundMuted }]}
              accessibilityLabel={t('senseAi.clearConversation')}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={16} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Chat area ───────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.chatContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Empty / Welcome state ────────────────────────── */}
        {!hasMessages && (
          <View style={styles.welcomeWrap}>
            {/* Orb stage */}
            <View style={[styles.welcomeOrbStage, { backgroundColor: theme.colors.primaryLight + '60' }]}>
              <SenseOrb state="idle" size="lg" />
            </View>

            {/* Greeting */}
            <Text
              style={[
                styles.welcomeTitle,
                { fontFamily: theme.fonts.headingBold, color: theme.colors.textPrimary, fontSize: isLarge ? 24 : 20 },
              ]}
            >
              {t('senseAi.welcomeTitle')}
            </Text>
            <Text
              style={[
                styles.welcomeSub,
                { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 16 : 14 },
              ]}
            >
              {t('senseAi.welcomeSubtitle')}
            </Text>

            {/* Trust badges */}
            <View style={styles.trustRow}>
              {[
                { icon: 'shield-checkmark-outline', label: t('senseAi.trust.private') },
                { icon: 'eye-off-outline',          label: t('senseAi.trust.safe') },
                { icon: 'heart-outline',            label: t('senseAi.trust.friendly') },
              ].map(b => (
                <View key={b.label} style={[styles.trustBadge, { backgroundColor: theme.colors.backgroundCard, borderColor: theme.colors.border }]}>
                  <Ionicons name={b.icon as any} size={14} color={theme.colors.primary} />
                  <Text style={[styles.trustLabel, { fontFamily: theme.fonts.bodyMedium, color: theme.colors.textSecondary, fontSize: isLarge ? 12 : 11 }]}>
                    {b.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Suggestions */}
            <View style={styles.suggestSection}>
              <Text
                style={[
                  styles.suggestHeading,
                  { fontFamily: theme.fonts.bodySemibold, color: theme.colors.textTertiary, fontSize: isLarge ? 13 : 11 },
                ]}
              >
                {t('senseAi.suggestedTitle').toUpperCase()}
              </Text>
              {suggestions.map((sug, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSend(sug)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={sug}
                  style={[
                    styles.suggestChip,
                    {
                      backgroundColor: theme.colors.backgroundCard,
                      borderColor:     theme.colors.border,
                      ...shadow('sm', { opacity: 0.07, radius: 6, offsetY: 2, elevation: 2 }),
                    },
                  ]}
                >
                  <View style={[styles.suggestIconWrap, { backgroundColor: theme.colors.primaryLight }]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.colors.primaryDark} />
                  </View>
                  <Text
                    style={[
                      styles.suggestText,
                      { fontFamily: theme.fonts.bodyMedium, color: theme.colors.textPrimary, fontSize: isLarge ? 15 : 14 },
                    ]}
                  >
                    {sug}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Message stream ───────────────────────────────── */}
        {chatMessages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isLast = index === chatMessages.length - 1;

          return (
            <View
              key={msg.id}
              style={[
                styles.msgRow,
                isUser ? styles.userRow : styles.aiRow,
                isLast && { marginBottom: 4 },
              ]}
            >
              {/* AI avatar */}
              {!isUser && (
                <View style={[styles.aiAvatarWrap, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border }]}>
                  <SenseOrb state="idle" size="xs" />
                </View>
              )}

              {/* Bubble */}
              <View
                style={[
                  styles.bubble,
                  isUser
                    ? {
                        backgroundColor: theme.colors.primary,
                        borderBottomEndRadius: 4,
                        ...shadow('sm', { color: theme.colors.primary, opacity: 0.28, radius: 10, offsetY: 3, elevation: 4 }),
                      }
                    : {
                        backgroundColor: theme.colors.backgroundCard,
                        borderColor: theme.colors.border,
                        borderWidth: 1.5,
                        borderBottomStartRadius: 4,
                        ...shadow('sm', { opacity: 0.06, radius: 6, offsetY: 2, elevation: 2 }),
                      },
                ]}
              >
                {/* AI label row */}
                {!isUser && (
                  <View style={styles.aiLabelRow}>
                    <Text
                      style={[
                        styles.aiLabel,
                        { fontFamily: theme.fonts.bodySemibold, color: theme.colors.primary, fontSize: isLarge ? 12 : 10 },
                      ]}
                    >
                      {t('senseAi.aiLabel')}
                    </Text>
                  </View>
                )}

                <Text
                  style={[
                    styles.bubbleText,
                    {
                      fontFamily: theme.fonts.body,
                      color:      isUser ? '#FFFFFF' : theme.colors.textPrimary,
                      fontSize:   isLarge ? 16 : 14,
                      lineHeight: isLarge ? 25 : 22,
                    },
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            </View>
          );
        })}

        {/* ── Thinking indicator ───────────────────────────── */}
        {isChatThinking && (
          <View style={[styles.msgRow, styles.aiRow]}>
            <View style={[styles.aiAvatarWrap, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border }]}>
              <SenseOrb state="analyzing" size="xs" />
            </View>
            <View
              style={[
                styles.bubble,
                {
                  backgroundColor: theme.colors.backgroundCard,
                  borderColor:     theme.colors.border,
                  borderWidth:     1.5,
                  borderBottomStartRadius: 4,
                  paddingVertical:  14,
                  paddingHorizontal: 18,
                },
              ]}
            >
              <View style={[styles.aiLabelRow, { marginBottom: 8 }]}>
                <Text style={[styles.aiLabel, { fontFamily: theme.fonts.bodySemibold, color: theme.colors.primary, fontSize: isLarge ? 12 : 10 }]}>
                  {t('senseAi.aiLabel')}
                </Text>
              </View>
              <ThinkingDots color={theme.colors.primary} />
              <Text
                style={[
                  styles.thinkingCaption,
                  { fontFamily: theme.fonts.body, color: theme.colors.textTertiary, fontSize: isLarge ? 13 : 12 },
                ]}
              >
                {t('senseAi.thinking')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Input bar ───────────────────────────────────────── */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: theme.colors.backgroundCard,
            borderTopColor:  theme.colors.border,
            paddingBottom:   Math.max(insets.bottom, 12),
          },
        ]}
      >
        {/* In-conversation suggestion strip (appears after first message, not thinking) */}
        {hasMessages && !isChatThinking && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.inlineChipsRow}
            style={styles.inlineChipsScroll}
          >
            {suggestions.slice(0, 3).map((sug, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleSend(sug)}
                activeOpacity={0.75}
                style={[styles.inlineChip, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary + '40' }]}
              >
                <Text style={[styles.inlineChipText, { fontFamily: theme.fonts.bodyMedium, color: theme.colors.primaryDark, fontSize: isLarge ? 13 : 12 }]}>
                  {sug}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Voice state: live transcript / error */}
        {voiceState === 'listening' && recognizedText ? (
          <View style={[styles.voicePreviewBox, { backgroundColor: theme.colors.backgroundMuted }]}>
            <Text style={[styles.voicePreviewLabel, { fontFamily: theme.fonts.bodyMedium, color: theme.colors.textTertiary, fontSize: isLarge ? 12 : 11 }]}>
              {t('senseAi.hearing')}
            </Text>
            <Text
              style={[styles.voicePreviewText, { fontFamily: theme.fonts.body, color: theme.colors.textPrimary, fontSize: isLarge ? 15 : 14 }]}
              numberOfLines={2}
            >
              {recognizedText}
            </Text>
          </View>
        ) : null}

        {voiceState === 'error' && errorMessage ? (
          <View style={[styles.voicePreviewBox, { backgroundColor: theme.colors.backgroundMuted }]}>
            <Ionicons name="information-circle-outline" size={14} color="#E07B20" />
            <Text style={[styles.voiceErrorText, { fontFamily: theme.fonts.body, color: '#E07B20', fontSize: isLarge ? 13 : 12 }]}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* Input field + mic + send button */}
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: theme.colors.backgroundMuted,
              borderColor:     isFocused ? theme.colors.primary : theme.colors.border,
              borderWidth:     isFocused ? 2 : 1.5,
              ...(isFocused
                ? shadow('sm', { color: theme.colors.primary, opacity: 0.14, radius: 8, offsetY: 2, elevation: 4 })
                : {}),
            },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            onFocus={() => setIsFocused(true)}
            onBlur={()  => setIsFocused(false)}
            placeholder={t('senseAi.placeholder')}
            placeholderTextColor={theme.colors.textTertiary}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            multiline
            style={[
              styles.textInput,
              {
                color:      theme.colors.textPrimary,
                fontFamily: theme.fonts.body,
                fontSize:   isLarge ? 16 : 15,
              },
            ]}
            accessibilityLabel={t('senseAi.placeholder')}
          />

          {/* Voice input button */}
          {isAvailable && (
            <TouchableOpacity
              onPress={() => {
                if (voiceState === 'listening')     stopListening();
                else if (voiceState === 'speaking')  stopSpeaking();
                else if (voiceState === 'error' || voiceState === 'result' || voiceState === 'processing') resetVoice();
                else                                  startListening();
              }}
              disabled={isChatThinking}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={
                voiceState === 'listening' ? t('senseAi.stopVoiceInput')
                : voiceState === 'speaking' ? t('senseAi.stopSpeaking')
                : t('senseAi.askByVoice')
              }
              accessibilityState={{ disabled: isChatThinking }}
              style={[
                styles.micBtn,
                {
                  backgroundColor:
                    voiceState === 'listening' ? '#EF4444'
                    : voiceState === 'speaking' ? '#3B82F6'
                    : voiceState === 'error'    ? '#FFF3E0'
                    : voiceState === 'result'   ? '#E8F5EE'
                    : theme.colors.primary,
                },
              ]}
            >
              <Ionicons
                name={
                  voiceState === 'listening'     ? ('mic' as const)
                  : voiceState === 'speaking'    ? ('volume-high' as const)
                  : voiceState === 'processing'  ? ('hourglass-outline' as const)
                  : voiceState === 'result'      ? ('checkmark-circle' as const)
                  : voiceState === 'error'       ? ('warning' as const)
                  : ('mic' as const)
                }
                size={IS_WEB ? 18 : 20}
                color={
                  voiceState === 'listening' ? '#FFFFFF'
                  : voiceState === 'speaking' ? '#FFFFFF'
                  : voiceState === 'error'    ? '#E07B20'
                  : voiceState === 'result'   ? '#2E7D55'
                  : '#FFFFFF'
                }
              />
            </TouchableOpacity>
          )}

          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!input.trim() || isChatThinking}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={t('senseAi.send')}
              accessibilityState={{ disabled: !input.trim() || isChatThinking }}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: input.trim() && !isChatThinking ? theme.colors.primary : theme.colors.border,
                  ...(input.trim() && !isChatThinking
                    ? shadow('sm', { color: theme.colors.primary, opacity: 0.38, radius: 10, offsetY: 3, elevation: 4 })
                    : {}),
                },
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={IS_WEB ? 17 : 20}
                color={input.trim() && !isChatThinking ? '#FFFFFF' : theme.colors.textDisabled}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Safety note */}
        <Text
          style={[
            styles.privacyNote,
            { fontFamily: theme.fonts.body, color: theme.colors.textTertiary, fontSize: isLarge ? 11 : 10 },
          ]}
        >
          {t('senseAi.privacyNote')}
        </Text>
      </View>

    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Header ────────────────────────────────────────────────
  header: {
    paddingHorizontal: IS_WEB ? 14 : 20,
    paddingBottom:     14,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
  },
  headerOrbWrap: {
    width:        IS_WEB ? 40 : 48,
    height:       IS_WEB ? 40 : 48,
    borderRadius: IS_WEB ? 20 : 24,
    borderWidth:  1,
    alignItems:   'center',
    justifyContent: 'center',
    flexShrink:   0,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    letterSpacing: -0.3,
    marginBottom:  2,
  },
  headerSub: {
    letterSpacing: 0.1,
  },
  clearBtn: {
    width:        IS_WEB ? 28 : 36,
    height:       IS_WEB ? 28 : 36,
    borderRadius: IS_WEB ? 14 : 18,
    alignItems:   'center',
    justifyContent: 'center',
  },

  // ── Chat scroll area ──────────────────────────────────────
  chatContent: {
    paddingHorizontal: IS_WEB ? 12 : 16,
    paddingTop:        20,
  },

  // ── Empty / Welcome ───────────────────────────────────────
  welcomeWrap: {
    alignItems:    'center',
    paddingBottom: 8,
  },
  welcomeOrbStage: {
    width:         IS_WEB ? 110 : 140,
    height:        IS_WEB ? 110 : 140,
    borderRadius:  IS_WEB ? 55 : 70,
    alignItems:    'center',
    justifyContent:'center',
    marginBottom:  20,
  },
  welcomeTitle: {
    letterSpacing: -0.5,
    marginBottom:  8,
    textAlign:     'center',
  },
  welcomeSub: {
    textAlign:   'center',
    lineHeight:  22,
    marginBottom: 20,
    paddingHorizontal: IS_WEB ? 12 : 16,
  },
  trustRow: {
    flexDirection:  'row',
    gap:            8,
    marginBottom:   28,
  },
  trustBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             5,
    paddingVertical:  6,
    paddingHorizontal: 10,
    borderRadius:    999,
    borderWidth:     1,
  },
  trustLabel: {},

  suggestSection: {
    width:     '100%',
    marginTop: 0,
  },
  suggestHeading: {
    letterSpacing:  1.2,
    marginBottom:   12,
    textAlign:      'center',
  },
  suggestChip: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              IS_WEB ? 8 : 10,
    borderRadius:     IS_WEB ? 14 : 16,
    borderWidth:      1.5,
    paddingVertical:  IS_WEB ? 10 : 14,
    paddingHorizontal: IS_WEB ? 12 : 16,
    marginBottom:     10,
  },
  suggestIconWrap: {
    width:        28,
    height:       28,
    borderRadius: 14,
    alignItems:   'center',
    justifyContent: 'center',
    flexShrink:   0,
  },
  suggestText: {
    flex: 1,
    lineHeight: 20,
  },

  // ── Messages ──────────────────────────────────────────────
  msgRow: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap:           8,
    marginBottom:  16,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  aiAvatarWrap: {
    width:        IS_WEB ? 28 : 36,
    height:       IS_WEB ? 28 : 36,
    borderRadius: IS_WEB ? 14 : 18,
    borderWidth:  1,
    alignItems:   'center',
    justifyContent: 'center',
    flexShrink:   0,
    marginBottom: 2,
  },
  bubble: {
    maxWidth:         '78%',
    paddingVertical:  IS_WEB ? 10 : 13,
    paddingHorizontal: IS_WEB ? 12 : 16,
    borderRadius:     IS_WEB ? 16 : 20,
  },
  aiLabelRow: {
    marginBottom: 6,
  },
  aiLabel: {
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bubbleText: {
    letterSpacing: 0.1,
  },
  thinkingCaption: {
    marginTop:   6,
    fontStyle:   'italic',
  },

  // ── Input bar ─────────────────────────────────────────────
  inputBar: {
    paddingHorizontal: IS_WEB ? 12 : 16,
    paddingTop:        10,
    borderTopWidth:    1,
  },
  inlineChipsScroll: {
    marginBottom: 8,
  },
  inlineChipsRow: {
    gap:           8,
    paddingRight:  8,
  },
  inlineChip: {
    paddingVertical:   7,
    paddingHorizontal: 14,
    borderRadius:      999,
    borderWidth:       1,
  },
  inlineChipText: {
    letterSpacing: 0.1,
  },
  inputRow: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    gap:            10,
    borderRadius:   24,
    paddingHorizontal: IS_WEB ? 12 : 16,
    paddingVertical: 8,
    minHeight:      IS_WEB ? 44 : 52,
  },
  textInput: {
    flex:         1,
    maxHeight:    100,
    lineHeight:   22,
    paddingTop:   Platform.OS === 'ios' ? 4 : 2,
    ...Platform.select({ android: { textAlignVertical: 'center' } }),
  },
  sendBtn: {
    width:        44,
    height:       44,
    borderRadius: 22,
    alignItems:   'center',
    justifyContent: 'center',
    flexShrink:   0,
  },
  micBtn: {
    width:        IS_WEB ? 36 : 44,
    height:       IS_WEB ? 36 : 44,
    borderRadius: IS_WEB ? 18 : 22,
    alignItems:   'center',
    justifyContent: 'center',
    flexShrink:   0,
  },
  voicePreviewBox: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           8,
    borderRadius:  14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom:  8,
  },
  voicePreviewLabel: {
    letterSpacing: 0.3,
    marginBottom:  2,
  },
  voicePreviewText: {
    lineHeight: 21,
    flex:       1,
  },
  voiceErrorText: {
    lineHeight: 18,
    flex:       1,
  },
  privacyNote: {
    textAlign:   'center',
    marginTop:   8,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
});

