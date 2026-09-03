import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/theme/ThemeContext';
import { shadow } from '../../src/theme/tokens';
import { IS_WEB } from '../../src/theme/responsive';
import { useApp } from '../../src/store/AppContext';

export default function AppLayout() {
  const { theme }    = useTheme();
  const { t }        = useTranslation();
  const { textSize } = useApp();
  const isLarge      = textSize === 'large';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   theme.colors.primaryDark,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundCard,
          borderTopColor:  theme.colors.border,
          borderTopWidth:  1,
          height: IS_WEB ? (isLarge ? 60 : 54) : (Platform.OS === 'ios' ? (isLarge ? 94 : 86) : (isLarge ? 74 : 66)),
          paddingTop: IS_WEB ? 4 : 8,
          paddingBottom: IS_WEB ? 6 : (Platform.OS === 'ios' ? 24 : 10),
          ...shadow('md', {
            color: '#9FA1FF',
            offsetY: -3,
            opacity: 0.08,
            radius: 12,
            elevation: 8,
          }),
        },
        tabBarLabelStyle: {
          fontFamily: theme.fonts.bodyMedium,
          fontSize: isLarge ? 13 : 11,
          marginTop: 2,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons
                name={focused ? 'shield' : 'shield-outline'}
                size={IS_WEB ? (isLarge ? 20 : 18) : (isLarge ? 24 : 22)}
                color={focused ? theme.colors.primaryDark : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('tabs.scan'),
          tabBarLabel: t('tabs.scan'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons
                name={focused ? 'scan-circle' : 'scan-circle-outline'}
                size={IS_WEB ? (isLarge ? 20 : 18) : (isLarge ? 24 : 22)}
                color={focused ? theme.colors.primaryDark : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="sense-ai"
        options={{
          title: t('tabs.senseAi'),
          tabBarLabel: t('tabs.senseAi'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons
                name={focused ? 'sparkles' : 'sparkles-outline'}
                size={IS_WEB ? (isLarge ? 20 : 18) : (isLarge ? 24 : 22)}
                color={focused ? theme.colors.primaryDark : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={IS_WEB ? (isLarge ? 20 : 18) : (isLarge ? 24 : 22)}
                color={focused ? theme.colors.primaryDark : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="panic"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: IS_WEB ? 36 : 44,
    height: IS_WEB ? 24 : 28,
    borderRadius: IS_WEB ? 12 : 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
