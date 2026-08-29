import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/theme/ThemeContext';
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
          height: Platform.OS === 'ios' ? (isLarge ? 94 : 86) : (isLarge ? 74 : 66),
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          elevation: 8,
          shadowColor: '#9FA1FF',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
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
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons
                name={focused ? 'shield' : 'shield-outline'}
                size={isLarge ? 24 : 22}
                color={focused ? theme.colors.primaryDark : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('scan.title'),
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons
                name={focused ? 'scan-circle' : 'scan-circle-outline'}
                size={isLarge ? 24 : 22}
                color={focused ? theme.colors.primaryDark : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="sense-ai"
        options={{
          title: t('senseAi.title'),
          tabBarLabel: 'Sense AI',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons
                name={focused ? 'sparkles' : 'sparkles-outline'}
                size={isLarge ? 24 : 22}
                color={focused ? theme.colors.primaryDark : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={isLarge ? 24 : 22}
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
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
