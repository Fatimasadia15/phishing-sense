import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import { I18nManager, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, {
  type SupportedLanguage,
  RTL_LANGUAGES,
  LANGUAGE_STORAGE_KEY,
} from './index';

// ─────────────────────────────────────────────────────────────
//  Language Context
//  Controls i18n language and RTL layout direction.
//  RTL change requires an app restart (RN limitation).
// ─────────────────────────────────────────────────────────────

interface LanguageContextValue {
  language:       SupportedLanguage;
  isRTL:          boolean;
  changeLanguage: (lang: SupportedLanguage, onRestart?: () => void) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: SupportedLanguage;
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const isRTL = RTL_LANGUAGES.includes(language);

  const changeLanguage = useCallback(
    async (lang: SupportedLanguage, onRestart?: () => void) => {
      const newIsRTL  = RTL_LANGUAGES.includes(lang);
      const needsFlip = I18nManager.isRTL !== newIsRTL;

      // Persist + switch i18next strings immediately
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      await i18n.changeLanguage(lang);
      setLanguage(lang);

      if (needsFlip) {
        // Layout direction change requires native restart
        I18nManager.allowRTL(newIsRTL);
        I18nManager.forceRTL(newIsRTL);

        Alert.alert(
          lang === 'ur' ? 'براہ کرم ایپ دوبارہ شروع کریں' : 'Restart Required',
          lang === 'ur'
            ? 'اردو لے آؤٹ لاگو کرنے کے لیے ایپ کو بند کر کے دوبارہ کھولیں۔'
            : 'Please close and reopen the app to apply the Urdu layout.',
          [
            {
              text: lang === 'ur' ? 'ٹھیک ہے' : 'OK',
              onPress: () => onRestart?.(),
            },
          ]
        );
      }
    },
    []
  );

  return (
    <LanguageContext.Provider value={{ language, isRTL, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
