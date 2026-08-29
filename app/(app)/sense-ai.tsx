import React, { useState, useRef, useEffect } from 'react';
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
import { useApp } from '../../src/store/AppContext';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { SenseOrb } from '../../src/components/ui/SenseOrb';
import { AI_SUGGESTIONS_EN, AI_SUGGESTIONS_UR } from '../../src/constants/mockData';

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
          Animated.timing(val, { toValue: 1,   duration: 350, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 350, useNativeDriver: true }),
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

  const suggestions = language === 'ur' ? AI_SUGGESTIONS_UR : AI_SUGGESTIONS_EN;
  const hasMessages = chatMessages.length > 0;

  // ── Existing logic (unchanged) ────────────────────────────
  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isChatThinking) return;

    // Press animation
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.88, duration: 80,  useNativeDriver: true }),
      Animated.timing(sendScale, { toValue: 1,    duration: 150, useNativeDriver: true }),
    ]).start();

    sendChatMessage(query);
    setInput('');
  };

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
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
              Sense AI
            </Text>
            <Text
              style={[
                styles.headerSub,
                { fontFamily: theme.fonts.body, color: isChatThinking ? theme.colors.primary : theme.colors.textSecondary, fontSize: isLarge ? 13 : 12 },
              ]}
            >
              {isChatThinking ? '● Sense is thinking…' : 'Your safety companion'}
            </Text>
          </View>

          {/* Right: Clear button if messages exist */}
          {hasMessages && (
            <TouchableOpacity
              onPress={clearChat}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.clearBtn, { backgroundColor: theme.colors.backgroundMuted }]}
              accessibilityLabel="Clear conversation"
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
              Hi, I'm Sense 👋
            </Text>
            <Text
              style={[
                styles.welcomeSub,
                { fontFamily: theme.fonts.body, color: theme.colors.textSecondary, fontSize: isLarge ? 16 : 14 },
              ]}
            >
              Not sure about a message, link, call, or online request?{'\n'}Ask me — I'll help you understand.
            </Text>

            {/* Trust badges */}
            <View style={styles.trustRow}>
              {[
                { icon: 'shield-checkmark-outline', label: 'Private' },
                { icon: 'eye-off-outline',          label: 'Safe' },
                { icon: 'heart-outline',            label: 'Friendly' },
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
                TRY ASKING
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
                      shadowColor:     '#9FA1FF',
                      shadowOpacity:   0.07,
                      shadowRadius:    6,
                      shadowOffset:    { width: 0, height: 2 },
                      elevation:       2,
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
                        shadowColor: theme.colors.primary,
                        shadowOpacity: 0.28,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 4,
                      }
                    : {
                        backgroundColor: theme.colors.backgroundCard,
                        borderColor: theme.colors.border,
                        borderWidth: 1.5,
                        borderBottomStartRadius: 4,
                        shadowColor: '#9FA1FF',
                        shadowOpacity: 0.06,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2,
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
                      SENSE
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
                  SENSE
                </Text>
              </View>
              <ThinkingDots color={theme.colors.primary} />
              <Text
                style={[
                  styles.thinkingCaption,
                  { fontFamily: theme.fonts.body, color: theme.colors.textTertiary, fontSize: isLarge ? 13 : 12 },
                ]}
              >
                Thinking…
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

        {/* Input field + send button */}
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: theme.colors.backgroundMuted,
              borderColor:     isFocused ? theme.colors.primary : theme.colors.border,
              borderWidth:     isFocused ? 2 : 1.5,
              shadowColor:     theme.colors.primary,
              shadowOpacity:   isFocused ? 0.14 : 0,
              shadowRadius:    8,
              shadowOffset:    { width: 0, height: 2 },
              elevation:       isFocused ? 4 : 0,
            },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            onFocus={() => setIsFocused(true)}
            onBlur={()  => setIsFocused(false)}
            placeholder="Ask Sense anything about a suspicious message…"
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
            accessibilityLabel="Ask Sense AI a question"
          />

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
                  shadowColor:     theme.colors.primary,
                  shadowOpacity:   input.trim() && !isChatThinking ? 0.38 : 0,
                  shadowRadius:    10,
                  shadowOffset:    { width: 0, height: 3 },
                  elevation:       input.trim() && !isChatThinking ? 4 : 0,
                },
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={20}
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
          🔒 Ask Sense whenever you're unsure about digital safety
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
    paddingHorizontal: 20,
    paddingBottom:     14,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
  },
  headerOrbWrap: {
    width:        48,
    height:       48,
    borderRadius: 24,
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
    width:        36,
    height:       36,
    borderRadius: 18,
    alignItems:   'center',
    justifyContent: 'center',
  },

  // ── Chat scroll area ──────────────────────────────────────
  chatContent: {
    paddingHorizontal: 16,
    paddingTop:        20,
  },

  // ── Empty / Welcome ───────────────────────────────────────
  welcomeWrap: {
    alignItems:    'center',
    paddingBottom: 8,
  },
  welcomeOrbStage: {
    width:         140,
    height:        140,
    borderRadius:  70,
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
    paddingHorizontal: 16,
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
    gap:              10,
    borderRadius:     16,
    borderWidth:      1.5,
    paddingVertical:  14,
    paddingHorizontal: 16,
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
    width:        36,
    height:       36,
    borderRadius: 18,
    borderWidth:  1,
    alignItems:   'center',
    justifyContent: 'center',
    flexShrink:   0,
    marginBottom: 2,
  },
  bubble: {
    maxWidth:         '78%',
    paddingVertical:  13,
    paddingHorizontal: 16,
    borderRadius:     20,
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight:      52,
  },
  textInput: {
    flex:         1,
    maxHeight:    100,
    lineHeight:   22,
    paddingTop:   Platform.OS === 'ios' ? 4 : 2,
    ...Platform.select({ android: { textAlignVertical: 'center' } }),
  },
  sendBtn: {
    width:        42,
    height:       42,
    borderRadius: 21,
    alignItems:   'center',
    justifyContent: 'center',
    flexShrink:   0,
  },
  privacyNote: {
    textAlign:   'center',
    marginTop:   8,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
});

