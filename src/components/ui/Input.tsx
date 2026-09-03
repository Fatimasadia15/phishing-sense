import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { USE_NATIVE_DRIVER } from '../../theme/responsive';
import { useApp } from '../../store/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';

// ─────────────────────────────────────────────────────────────
//  Input Component
//  Floating label, password toggle, error shake
//  Min 52px height for elderly-friendly tapping
// ─────────────────────────────────────────────────────────────

interface InputProps {
  label:          string;
  value:          string;
  onChangeText:   (text: string) => void;
  placeholder?:   string;
  secureEntry?:   boolean;
  keyboardType?:  KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?:  string;
  error?:         string;
  disabled?:      boolean;
  multiline?:     boolean;
  numberOfLines?: number;
  maxLength?:     number;
  returnKeyType?: 'done' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  inputRef?:      React.RefObject<TextInput>;
  style?:         ViewStyle;
  inputStyle?:    TextStyle;
  accessibilityLabel?: string;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureEntry    = false,
  keyboardType   = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  error,
  disabled       = false,
  multiline      = false,
  numberOfLines  = 1,
  maxLength,
  returnKeyType  = 'done',
  onSubmitEditing,
  inputRef,
  style,
  inputStyle,
  accessibilityLabel,
}: InputProps) {
  const { theme }    = useTheme();
  const { textSize } = useApp();
  const { isRTL }    = useLanguage();
  const isLarge      = textSize === 'large';

  const [isFocused,   setFocused]   = useState(false);
  const [showPassword, setShowPwd]  = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Shake animation on error
  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  }, [shakeAnim]);

  React.useEffect(() => {
    if (error) shake();
  }, [error]);

  const inputHeight   = isLarge ? 68 : 58;
  const fontSize      = isLarge ? 17 : 15;
  const labelFontSize = isLarge ? 14 : 12;

  const borderColor = error
    ? theme.colors.dangerDark
    : isFocused
    ? theme.colors.borderFocus
    : theme.colors.border;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { transform: [{ translateX: shakeAnim }] },
        style,
      ]}
    >
      <View
        style={[
          styles.container,
          {
            height:          multiline ? undefined : inputHeight,
            minHeight:       multiline ? inputHeight : undefined,
            borderColor:     borderColor,
            borderWidth:     isFocused ? 2 : 1.5,
            borderRadius:    theme.radius.md,
            backgroundColor: disabled
              ? theme.colors.surfaceSunken
              : theme.colors.backgroundCard,
            paddingTop:    multiline ? (isLarge ? 20 : 16) : 0,
            paddingBottom: multiline ? 8 : 0,
          },
        ]}
      >
        {/* Floating label */}
        <Text
          style={[
            styles.label,
            {
              color:      error ? theme.colors.dangerDark : isFocused ? theme.colors.primary : theme.colors.textTertiary,
              fontSize:   labelFontSize,
              fontFamily: theme.fonts.bodyMedium,
              textAlign:  isRTL ? 'right' : 'left',
            },
          ]}
        >
          {label}
        </Text>

        <View style={styles.row}>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={isFocused ? (placeholder ?? '') : ''}
            placeholderTextColor={theme.colors.textDisabled}
            secureTextEntry={secureEntry && !showPassword}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete as any}
            editable={!disabled}
            multiline={multiline}
            numberOfLines={multiline ? numberOfLines : 1}
            maxLength={maxLength}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            accessibilityLabel={accessibilityLabel || label}
            style={[
              styles.input,
              {
                fontSize,
                fontFamily:    theme.fonts.body,
                color:         theme.colors.textPrimary,
                textAlign:     isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              },
              inputStyle,
            ]}
          />

          {secureEntry && (
            <TouchableOpacity
              onPress={() => setShowPwd(v => !v)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Error message */}
      {error ? (
        <Text
          style={[
            styles.error,
            {
              color:      theme.colors.dangerDark,
              fontFamily: theme.fonts.body,
              fontSize:   isLarge ? 13 : 12,
              textAlign:  isRTL ? 'right' : 'left',
            },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper:   { width: '100%' },
  container: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    marginBottom: 2,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    flex:           1,
  },
  input: {
    flex:           1,
    padding:        0,
    margin:         0,
  },
  error: {
    marginTop:  6,
    marginStart: 4,
  },
});
