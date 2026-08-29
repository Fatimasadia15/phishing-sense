import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useApp } from '../../store/AppContext';

// ─────────────────────────────────────────────────────────────
//  Header Component
//  RTL-aware: back arrow flips automatically
// ─────────────────────────────────────────────────────────────

interface HeaderProps {
  title:          string;
  subtitle?:      string;
  showBack?:      boolean;
  onBack?:        () => void;
  right?:         React.ReactNode;
  transparent?:   boolean;
  style?:         ViewStyle;
}

export function Header({
  title,
  subtitle,
  showBack    = true,
  onBack,
  right,
  transparent = false,
  style,
}: HeaderProps) {
  const { theme } = useTheme();
  const { textSize } = useApp();
  const insets    = useSafeAreaInsets();
  const isLarge   = textSize === 'large';

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    if (router.canGoBack()) router.back();
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop:        insets.top + 8,
          backgroundColor:   transparent ? 'transparent' : theme.colors.background,
          borderBottomColor: transparent ? 'transparent' : theme.colors.border,
          borderBottomWidth: transparent ? 0 : 1,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {/* Back button — always 44x44 touch target */}
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.backBtn,
              {
                backgroundColor: theme.colors.backgroundMuted,
                borderRadius:    theme.radius.pill,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        {/* Title */}
        <View style={styles.titleWrap}>
          <Text
            style={[
              styles.title,
              {
                fontFamily: theme.fonts.heading,
                color:      theme.colors.textPrimary,
                fontSize:   isLarge ? 20 : 18,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                {
                  fontFamily: theme.fonts.body,
                  color:      theme.colors.textSecondary,
                  fontSize:   isLarge ? 14 : 13,
                },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Right action */}
        {right ? (
          <View style={styles.right}>{right}</View>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom:    12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width:          44,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex:      1,
    alignItems: 'center',
  },
  title: {
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 2,
  },
  right: {
    width:          44,
    alignItems:     'flex-end',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
  },
});
