import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { IS_WEB } from '../../theme/responsive';
import { shadow } from '../../theme/tokens';
import type { VoiceState } from '../../services/voice';

// ─────────────────────────────────────────────────────────────
//  VoiceButton — Animated Microphone Button for Voice Scan
//
//  States:
//    ready      → calm violet mic icon
//    listening  → pulsing red ring with live waveform
//    processing → spinning loader
//    result     → green checkmark
//    speaking   → blue sound waves
//    error      → amber warning (tappable to retry)
// ─────────────────────────────────────────────────────────────

interface VoiceButtonProps {
  voiceState:  VoiceState;
  isAvailable: boolean;
  onStart:     () => void;
  onStop:      () => void;
  onReset:     () => void;
  /** Optional caption text shown below the button. */
  caption?:    string;
  /** If true, the button is disabled (e.g. during analysis). */
  disabled?:   boolean;
}

const BUTTON_SIZE = IS_WEB ? 52 : 72;

const STATE_CONFIG: Record<
  VoiceState,
  { icon: string; color: string; ringColor: string; label: string }
> = {
  ready:      { icon: 'mic',                 color: '#9FA1FF', ringColor: 'rgba(159,161,255,0.2)',  label: 'Tap to speak' },
  listening:  { icon: 'mic',                 color: '#EF4444', ringColor: 'rgba(239,68,68,0.25)',   label: 'Listening…' },
  processing: { icon: 'hourglass-outline',   color: '#F59E0B', ringColor: 'rgba(245,158,11,0.2)',   label: 'Processing…' },
  result:     { icon: 'checkmark-circle',    color: '#2E7D55', ringColor: 'rgba(46,125,85,0.15)',   label: 'Done' },
  speaking:   { icon: 'volume-high',         color: '#3B82F6', ringColor: 'rgba(59,130,246,0.2)',   label: 'Speaking…' },
  error:      { icon: 'warning',             color: '#E07B20', ringColor: 'rgba(224,123,32,0.2)',    label: 'Try again' },
};

export function VoiceButton({
  voiceState,
  isAvailable,
  onStart,
  onStop,
  onReset,
  caption,
  disabled = false,
}: VoiceButtonProps) {
  const { theme } = useTheme();

  // ── Animation refs ─────────────────────────────────────────
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const ringAnim   = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const config = STATE_CONFIG[voiceState];

  // ── Pulse animation for listening state ────────────────────
  useEffect(() => {
    if (voiceState === 'listening') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
  }, [voiceState]);

  // ── Ring expand animation for listening ─────────────────────
  useEffect(() => {
    if (voiceState === 'listening') {
      const ring = Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      ring.start();
      return () => ring.stop();
    }
    ringAnim.setValue(0);
  }, [voiceState]);

  // ── Spin animation for processing ──────────────────────────
  useEffect(() => {
    if (voiceState === 'processing') {
      const spin = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spin.start();
      return () => spin.stop();
    }
    rotateAnim.setValue(0);
  }, [voiceState]);

  // ── Press handler ──────────────────────────────────────────
  const handlePress = () => {
    if (disabled) return;
    switch (voiceState) {
      case 'ready':
        onStart();
        break;
      case 'listening':
        onStop();
        break;
      case 'speaking':
        onStop();  // Stop speaking
        break;
      case 'error':
      case 'result':
        onReset();
        break;
    }
  };

  // ── Not available: show disabled state ─────────────────────
  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <View style={[styles.buttonWrap, { backgroundColor: theme.colors.backgroundMuted, opacity: 0.5 }]}>
          <Ionicons name="mic-off" size={28} color={theme.colors.textDisabled} />
        </View>
        <Text style={[styles.captionText, { color: theme.colors.textTertiary, fontFamily: theme.fonts.body }]}>
          Voice not available
        </Text>
      </View>
    );
  }

  const ringScale    = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity  = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
  const spinRotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      {/* Expanding ring (listening state) */}
      <Animated.View
        style={[
          styles.ring,
          {
            backgroundColor: config.ringColor,
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />

      {/* Main button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          disabled={disabled && voiceState !== 'error'}
          accessibilityRole="button"
          accessibilityLabel={config.label}
          accessibilityState={{ disabled: disabled && voiceState !== 'error' }}
          style={[
            styles.buttonWrap,
            {
              backgroundColor: voiceState === 'ready' ? theme.colors.primary : config.ringColor,
              borderColor:     config.color,
              borderWidth:     voiceState === 'ready' ? 0 : 2,
              ...shadow('md', {
                color: config.color,
                opacity: voiceState === 'listening' ? 0.5 : 0.2,
                radius: voiceState === 'listening' ? 16 : 8,
                offsetY: 4,
                elevation: voiceState === 'listening' ? 8 : 4,
              }),
            },
          ]}
        >
          <Animated.View style={voiceState === 'processing' ? { transform: [{ rotate: spinRotation }] } : undefined}>
            <Ionicons
              name={config.icon as any}
              size={30}
              color={voiceState === 'ready' ? '#FFFFFF' : config.color}
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Caption */}
      <Text style={[styles.captionText, { color: theme.colors.textTertiary, fontFamily: theme.fonts.bodyMedium }]}>
        {caption ?? config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width:  BUTTON_SIZE + 24,
    height: BUTTON_SIZE + 24,
    borderRadius: (BUTTON_SIZE + 24) / 2,
  },
  buttonWrap: {
    width:          BUTTON_SIZE,
    height:         BUTTON_SIZE,
    borderRadius:   BUTTON_SIZE / 2,
    alignItems:     'center',
    justifyContent: 'center',
  },
  captionText: {
    marginTop: 8,
    fontSize:  12,
    letterSpacing: 0.2,
  },
});
