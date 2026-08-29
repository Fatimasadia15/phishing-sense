// ─────────────────────────────────────────────────────────────
//  i18n — i18next initialization
//  Supports English (LTR) and Urdu (RTL)
// ─────────────────────────────────────────────────────────────
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import ur from './ur.json';

export const SUPPORTED_LANGUAGES = ['en', 'ur'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const RTL_LANGUAGES: SupportedLanguage[] = ['ur'];

export const LANGUAGE_STORAGE_KEY = '@phishing_sense/language';

export async function getSavedLanguage(): Promise<SupportedLanguage> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'ur') return saved;
  } catch (_) {}
  return 'en';
}

export async function initI18n(initialLanguage: SupportedLanguage = 'en') {
  if (i18n.isInitialized) return;

  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ur: { translation: ur },
      },
      lng:        initialLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
    });
}

export default i18n;
