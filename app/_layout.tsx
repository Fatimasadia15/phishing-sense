import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { I18nManager, View, StyleSheet } from 'react-native';

import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { LanguageProvider }        from '../src/i18n/LanguageContext';
import { AuthProvider }            from '../src/store/AppContext';
import { AppProvider }             from '../src/store/AppContext';
import { initI18n, getSavedLanguage, RTL_LANGUAGES } from '../src/i18n/index';
import { IS_WEB, MAX_CONTENT_WIDTH } from '../src/theme/responsive';
import type { SupportedLanguage }  from '../src/i18n/index';

// Keep native splash visible until we're ready
SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady]         = useState(false);
  const [initialLang, setInitialLang]   = useState<SupportedLanguage>('en');

  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        const lang = await getSavedLanguage();
        setInitialLang(lang);
        await initI18n(lang);

        // Set RTL direction based on saved language
        const isRTL = RTL_LANGUAGES.includes(lang);
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
      } catch (e) {
        console.warn('App prepare error:', e);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && appReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, appReady]);

  if ((!fontsLoaded && !fontError) || !appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={IS_WEB ? rootStyles.webColumn : undefined}>
          <ThemeProvider>
            <LanguageProvider initialLanguage={initialLang}>
              <AuthProvider>
                <AppProvider>
                  <InnerLayout />
                </AppProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const rootStyles = StyleSheet.create({
  webColumn: {
    flex: 1,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: '#D8D8EA',
    backgroundColor: '#F8F9FE',
  },
});
