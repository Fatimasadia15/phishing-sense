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

// Safe import: expo-speech-recognition requires native code that isn't
// available in Expo Go.  Wrapping in try/catch allows the app to load
// with voice features gracefully disabled.
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = () => {};
try {
  const mod = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch {
  console.warn('[Voice] expo-speech-recognition not available (Expo Go or missing native module). Voice input disabled.');
}

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
 * Safe wrapper for useSpeechRecognitionEvent.
 * Does nothing when the native module isn't loaded (e.g. Expo Go).
 * Must be called unconditionally at the top of the hook to satisfy
 * React's Rules of Hooks.
 */
function useSafeSpeechRecognitionEvent(event: string, handler: (...args: any[]) => void) {
  if (ExpoSpeechRecognitionModule) {
    useSpeechRecognitionEvent(event, handler);
  }
}

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
  // Final + latest interim text. On web/Android the last spoken segment is
  // often still interim when the session ends, so this is the fallback.
  const anyTextRef = useRef('');
  // Keep the callback fresh without depending on event re-registration
  const onTextReadyRef = useRef(onTextReady);
  onTextReadyRef.current = onTextReady;
  // Only one mounted hook instance may own an STT session (tabs stay
  // mounted, so events would otherwise cross-talk between screens).
  const activeSessionRef = useRef(false);

  // ── Check availability on mount ────────────────────────────
  useEffect(() => {
    if (!ExpoSpeechRecognitionModule) {
      setIsAvailable(false);
      return;
    }
    const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
    setIsAvailable(available);
    return () => {
      clearListenTimeout();
      activeSessionRef.current = false;
      if (ExpoSpeechRecognitionModule) ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  // ── STT event listeners ────────────────────────────────────
  useSafeSpeechRecognitionEvent('start', () => {
    if (!activeSessionRef.current) return;
    setVoiceState('listening');
    setErrorMessage('');
    startListenTimeout();
  });

  useSafeSpeechRecognitionEvent('end', () => {
    if (!activeSessionRef.current) return;
    activeSessionRef.current = false;
    clearListenTimeout();
    // Prefer final results; fall back to interim — the last segment is
    // frequently still interim when the session ends.
    const text = finalTextRef.current.trim() || anyTextRef.current.trim();
    if (text && onTextReadyRef.current) {
      setVoiceState('processing');
      // Await the callback — it may return text to auto-speak
      Promise.resolve(onTextReadyRef.current(text))
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
    } else {
      // Ended without any captured text (silence)
      setVoiceState('ready');
    }
  });

  useSafeSpeechRecognitionEvent('result', (event: any) => {
    if (!activeSessionRef.current) return;
    const results = event.results;
    if (!results || results.length === 0) return;

    // isFinal lives on the event itself (both native and web adapters)
    const isFinal = event.isFinal === true;
    const transcripts = (results as any[])
      .map(r => (r.transcript || '').trim())
      .filter(Boolean);
    if (transcripts.length === 0) return;
    const text = transcripts.join(' ');

    if (isFinal) {
      // Final segments arrive one utterance at a time — accumulate
      finalTextRef.current = finalTextRef.current
        ? finalTextRef.current + ' ' + text
        : text;
      anyTextRef.current = finalTextRef.current;
      setRecognizedText(finalTextRef.current);
    } else {
      // Interim: finals so far + the live partial of the current utterance
      anyTextRef.current = finalTextRef.current
        ? finalTextRef.current + ' ' + text
        : text;
      setRecognizedText(anyTextRef.current);
    }
  });

  useSafeSpeechRecognitionEvent('error', (event: any) => {
    if (!activeSessionRef.current) return;
    activeSessionRef.current = false;
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
      if (ExpoSpeechRecognitionModule) ExpoSpeechRecognitionModule.stop();
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
    anyTextRef.current = '';

    // Check availability
    if (!ExpoSpeechRecognitionModule) {
      setErrorMessage('Speech recognition is not available on this device. Please type or paste the text instead.');
      setVoiceState('error');
      return;
    }
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
      activeSessionRef.current = true;
      ExpoSpeechRecognitionModule.start({
        lang:         lang.stt,
        interimResults: true,
        continuous:   true,
        contextualStrings: ROMAN_URDU_CONTEXT,
        iosTaskHint: 'dictation',
      });
    } catch (err: any) {
      activeSessionRef.current = false;
      setErrorMessage('Could not start voice input. Please type or paste the text instead.');
      setVoiceState('error');
    }
  }, [appLanguage]);

  const stopListening = useCallback(() => {
    clearListenTimeout();
    if (ExpoSpeechRecognitionModule) ExpoSpeechRecognitionModule.stop();
  }, []);

  const speakResult = useCallback(async (text: string, language?: string) => {
    if (!text) return;

    try {
      await Speech.stop();
    } catch {}

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
    activeSessionRef.current = false;
    if (ExpoSpeechRecognitionModule) ExpoSpeechRecognitionModule.abort();
    Speech.stop();
    setVoiceState('ready');
    setRecognizedText('');
    setErrorMessage('');
    finalTextRef.current = '';
    anyTextRef.current = '';
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
