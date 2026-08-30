// ─────────────────────────────────────────────────────────────
//  Voice Service — Multilingual STT + TTS pipeline
//
//  Coordinates the full voice flow:
//    Mic tap → STT → recognised text → redaction → analysis
//    → verdict → TTS spoken response
//
//  Supports: English, Urdu, Roman Urdu / code-switched speech
//
//  Safety:
//    • Microphone auto-stops after LISTEN_TIMEOUT_MS (never
//      left active indefinitely).
//    • Permissions requested only when user taps the mic.
//    • STT failure → manual text entry (never blocks scanner).
//    • TTS failure → written result shown (voice is not the
//      only output path).
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

// ── Configuration ────────────────────────────────────────────

/** Maximum time the mic stays open (ms). Prevents indefinite listening. */
const LISTEN_TIMEOUT_MS = 15_000;

/** Language codes for speech recognition & TTS. */
const LANG_MAP: Record<string, { stt: string; tts: string }> = {
  en: { stt: 'en-US', tts: 'en-US' },
  ur: { stt: 'en-US', tts: 'ur-PK' },
};

/** Fallback when app language isn't in the map. */
const DEFAULT_LANG = LANG_MAP.en;

/**
 * Roman Urdu contextual strings — common words/phrases Pakistani users
 * speak when describing suspicious messages. These help the English STT
 * engine correctly transcribe Roman Urdu phonetics.
 */
const ROMAN_URDU_CONTEXT: string[] = [
  // Banking / finance
  'OTP', 'PIN', 'password', 'CNIC', 'bank account', 'paisa', 'paise',
  'JazzCash', 'EasyPaisa', 'HBL', 'Meezan', 'UBL', 'MCB', 'Allied Bank',
  'Faysal Bank', 'SadaPay', 'NayaPay', 'account suspend', 'account blocked',
  'verification code', 'one time password',
  // Government / welfare scams
  'BISP', 'Ehsaas', 'Kafaalat', 'Benazir', '8171', 'Kissan', 'PM youth loan',
  'government grant', 'NADRA', 'FBR', 'State Bank',
  // Common Roman Urdu words in scam messages
  'bhejo', 'bhejein', 'share karein', 'fori', 'jaldi', 'abhi', 'turant',
  'khatra', 'khatarnaak', 'mashkook', 'dhoka', 'fraud', 'scam',
  'raabta karein', 'call karein', 'reply karein', 'message bhejein',
  'account verify', 'suspend ho gaya', 'block ho gaya', 'frozen',
  'zaroori', 'lazmi', 'intezaar', 'mutaliqa', 'marja',
  // Telco
  'Jazz', 'Zong', 'Telenor', 'Ufone', 'SIM', 'number band',
  // Delivery scams
  'parcel', 'TCS', 'Leopards', 'courier', 'delivery',
];

// ── Types ────────────────────────────────────────────────────

export type VoiceState =
  | 'ready'
  | 'listening'
  | 'processing'
  | 'result'
  | 'speaking'
  | 'error';

export interface VoiceHookResult {
  /** Current voice pipeline state. */
  voiceState:      VoiceState;
  /** Recognised text from STT (empty when not yet recognised). */
  recognizedText:  string;
  /** Human-readable error message (empty when no error). */
  errorMessage:    string;
  /** Whether speech recognition is available on this device. */
  isAvailable:     boolean;
  /** Start listening (requests permissions on first use). */
  startListening:  () => void;
  /** Stop listening manually (auto-stops on timeout/silence). */
  stopListening:   () => void;
  /** Speak the given text aloud. */
  speakResult:     (text: string, language?: string) => void;
  /** Stop any currently playing speech. */
  stopSpeaking:    () => void;
  /** Reset voice state back to 'ready'. */
  reset:           () => void;
}

/**
 * Callback invoked when STT produces a final result.
 * Receives the recognised text and may return a string to be spoken aloud.
 * Can be sync or async (e.g. when it performs analysis before returning).
 */
export type OnTextReadyCallback = (text: string) => string | void | Promise<string | void>;

// ── Hook ─────────────────────────────────────────────────────

/**
 * Voice assistant hook — manages the full STT → analysis → TTS pipeline.
 *
 * @param appLanguage  The app's current language ('en' | 'ur').
 * @param onTextReady  Callback invoked when STT produces a final result.
 *                     May return a string to auto-speak (e.g. a verdict summary).
 *                     Can be async — the hook awaits the result before speaking.
 */
export function useVoiceAssistant(
  appLanguage: string,
  onTextReady?: OnTextReadyCallback
): VoiceHookResult {
  const [voiceState, setVoiceState]           = useState<VoiceState>('ready');
  const [recognizedText, setRecognizedText]   = useState('');
  const [errorMessage, setErrorMessage]       = useState('');
  const [isAvailable, setIsAvailable]         = useState(true);

  const timeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTextRef = useRef('');

  // ── Check availability on mount ────────────────────────────
  useEffect(() => {
    const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
    setIsAvailable(available);
    return () => {
      clearListenTimeout();
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  // ── STT event listeners ────────────────────────────────────
  useSpeechRecognitionEvent('start', () => {
    setVoiceState('listening');
    setErrorMessage('');
    startListenTimeout();
  });

  useSpeechRecognitionEvent('end', () => {
    clearListenTimeout();
    const text = finalTextRef.current.trim();
    if (text && onTextReady) {
      setVoiceState('processing');
      // Await the callback — it may return text to auto-speak
      Promise.resolve(onTextReady(text))
        .then((speakText) => {
          if (speakText) {
            // Auto-speak the returned text
            const lang = LANG_MAP[appLanguage] ?? DEFAULT_LANG;
            setVoiceState('speaking');
            Speech.speak(speakText, {
              language: lang.tts,
              rate:     appLanguage === 'ur' ? 0.85 : 0.95,
              pitch:    1.0,
              volume:   1.0,
              onDone: () => setVoiceState('result'),
              onError: () => setVoiceState('result'),
            });
          } else {
            setVoiceState('result');
          }
        })
        .catch(() => {
          setVoiceState('result');
        });
    } else if (voiceState === 'listening') {
      // Ended without result (silence)
      setVoiceState('ready');
    }
  });

  useSpeechRecognitionEvent('result', (event: any) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    if (transcript) {
      setRecognizedText(transcript);
      if (event.isFinal) {
        finalTextRef.current = transcript;
      }
    }
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    clearListenTimeout();
    const code = event.error ?? 'unknown';
    let msg: string;

    switch (code) {
      case 'not-allowed':
      case 'service-not-allowed':
        msg = 'Microphone permission is needed to use voice input. You can still type or paste text manually.';
        break;
      case 'no-speech':
        msg = 'No speech detected. Try speaking closer to the microphone, or type the text manually.';
        break;
      case 'audio-capture':
        msg = 'Could not access the microphone. Please check your device settings.';
        break;
      case 'network':
        msg = 'Speech recognition needs internet. Please check your connection or type the text.';
        break;
      default:
        msg = 'Voice input is not available right now. You can type or paste the text instead.';
    }

    setErrorMessage(msg);
    setVoiceState('error');
  });

  // ── Timeout helpers ────────────────────────────────────────

  function startListenTimeout() {
    clearListenTimeout();
    timeoutRef.current = setTimeout(() => {
      ExpoSpeechRecognitionModule.stop();
    }, LISTEN_TIMEOUT_MS);
  }

  function clearListenTimeout() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  // ── Public methods ─────────────────────────────────────────

  const startListening = useCallback(async () => {
    // Reset state
    setRecognizedText('');
    setErrorMessage('');
    finalTextRef.current = '';

    // Check availability
    const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
    if (!available) {
      setErrorMessage('Speech recognition is not available on this device. Please type or paste the text instead.');
      setVoiceState('error');
      return;
    }

    // Request permissions (only shown on first use)
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        setErrorMessage('Microphone permission is needed to use voice input. You can still type or paste text manually.');
        setVoiceState('error');
        return;
      }
    } catch {
      setErrorMessage('Could not request microphone permission. You can type or paste the text instead.');
      setVoiceState('error');
      return;
    }

    // Stop any playing TTS before starting STT
    await Speech.stop();

    // Determine language
    const lang = LANG_MAP[appLanguage] ?? DEFAULT_LANG;

    // Start recognition
    try {
      ExpoSpeechRecognitionModule.start({
        lang:         lang.stt,
        interimResults: true,
        continuous:   false,
        contextualStrings: ROMAN_URDU_CONTEXT,
        iosTaskHint: 'dictation',
      });
    } catch (err: any) {
      setErrorMessage('Could not start voice input. Please type or paste the text instead.');
      setVoiceState('error');
    }
  }, [appLanguage]);

  const stopListening = useCallback(() => {
    clearListenTimeout();
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const speakResult = useCallback(async (text: string, language?: string) => {
    if (!text) return;
    setVoiceState('speaking');

    const lang = language
      ? (LANG_MAP[language] ?? DEFAULT_LANG)
      : (LANG_MAP[appLanguage] ?? DEFAULT_LANG);

    try {
      Speech.speak(text, {
        language: lang.tts,
        rate:     appLanguage === 'ur' ? 0.85 : 0.95, // Slightly slower for Urdu
        pitch:    1.0,
        volume:   1.0,
        onDone: () => {
          setVoiceState('result');
        },
        onError: () => {
          // TTS failure: show written result, don't block
          setVoiceState('result');
        },
      });
    } catch {
      // TTS completely unavailable: show written result
      setVoiceState('result');
    }
  }, [appLanguage]);

  const stopSpeaking = useCallback(async () => {
    await Speech.stop();
    setVoiceState('result');
  }, []);

  const reset = useCallback(() => {
    clearListenTimeout();
    ExpoSpeechRecognitionModule.abort();
    Speech.stop();
    setVoiceState('ready');
    setRecognizedText('');
    setErrorMessage('');
    finalTextRef.current = '';
  }, []);

  return {
    voiceState,
    recognizedText,
    errorMessage,
    isAvailable,
    startListening,
    stopListening,
    speakResult,
    stopSpeaking,
    reset,
  };
}

// ── Utility: pick TTS language based on detected text ────────

/**
 * Detect whether recognised text is primarily Roman Urdu / Urdu.
 * Returns the best TTS language code.
 */
export function detectLanguageForTTS(text: string): string {
  if (!text) return 'en-US';

  // Urdu script detection (Unicode range for Arabic/Urdu script)
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(text)) {
    return 'ur-PK';
  }

  // Roman Urdu indicators (common Urdu words written in Latin script)
  const romanUrduWords = [
    'apna', 'apni', 'kya', 'hai', 'hain', 'nahi', 'nahin',
    'karo', 'karein', 'bhej', 'bhejein', 'paisa', 'paise',
    'account', 'suspend', 'ho gaya', 'ho gayi', 'mat karo',
    'rabta', 'call', 'karein', 'den', 'do', 'lagta', 'lagti',
    'kabhi', 'mat', 'zaroor', 'fori', 'abhi', 'jaldi',
    'khatra', 'mashkook', 'dhoka', 'fraud', 'bhejo',
    'share karein', 'raabta', 'band', 'number',
  ];

  const words = text.toLowerCase().split(/\s+/);
  const matchCount = romanUrduWords.filter(w =>
    words.some(tw => tw === w || tw.includes(w))
  ).length;

  // 2+ Roman Urdu words → Urdu TTS for better pronunciation
  if (matchCount >= 2) return 'ur-PK';

  return 'en-US';
}

/**
 * Detect whether text is primarily Roman Urdu (Latin-script Urdu).
 * Used to route analysis and explanations appropriately.
 */
export function isRomanUrdu(text: string): boolean {
  if (!text) return false;
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(text)) return false;

  const romanUrduMarkers = [
    'hai', 'hain', 'kya', 'karo', 'karein', 'nahi', 'nahin',
    'bhej', 'bhejein', 'ho gaya', 'ho gayi', 'paisa', 'paise',
    'rabta', 'lagta', 'lagti', 'khatra', 'mashkook', 'dhoka',
    'fori', 'jaldi', 'abhi', 'zaroor', 'mat', 'kabhi',
    'suspend', 'block', 'verify', 'account',
  ];

  const lower = text.toLowerCase();
  const hits = romanUrduMarkers.filter(w => lower.includes(w)).length;
  return hits >= 2;
}

/**
 * Build a concise TTS-friendly summary from scan results.
 * Keeps it short and clear for voice output.
 */
export function buildVoiceSummary(
  verdict: 'safe' | 'suspicious' | 'dangerous',
  details: string | undefined,
  language: string
): string {
  const isUrdu = language === 'ur';

  if (verdict === 'safe') {
    return isUrdu
      ? 'یہ محفوظ لگتا ہے۔ کوئی خطرے کی نشانی نہیں ملی۔'
      : 'This looks safe. No phishing signs were found.';
  }

  if (verdict === 'suspicious') {
    return isUrdu
      ? 'محتاط رہیں۔ یہ مشکوک لگتا ہے۔ کوئی لنک کلک نہ کریں اور تصدیق کریں۔'
      : 'Be careful. This looks suspicious. Do not click any links and verify through official channels.';
  }

  // dangerous
  return isUrdu
    ? 'خطرہ! یہ فشنگ یا دھوکہ لگتا ہے۔ کوئی لنک کلک نہ کریں، کوئی معلومات شیئر نہ کریں۔ بھیجنے والے کو بلاک کریں۔'
    : 'Danger! This looks like phishing or a scam. Do not click any links, do not share any information. Block the sender immediately.';
}
