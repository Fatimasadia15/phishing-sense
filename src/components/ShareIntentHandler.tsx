import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';

/**
 * ShareIntentHandler
 *
 * Listens for incoming OS native share sheet events (Android Intent / iOS Share Extension)
 * and safely forwards valid shared text/URLs into the existing Phishing Sense scanner flow.
 *
 * Edge cases handled:
 * - Empty content: displays user-friendly alert without crashing.
 * - Unsupported content (images/files): displays informative message.
 * - Long content: safely caps input length to prevent memory issues.
 * - App state: works on both cold launch (app closed) and warm launch (app open).
 * - Duplicate processing: immediately resets intent state after capture.
 */
export function ShareIntentHandler() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntent();
  const processingRef = useRef(false);

  useEffect(() => {
    if (error) {
      console.warn('[ShareIntent] Error receiving share intent:', error);
      return;
    }

    if (hasShareIntent && shareIntent && !processingRef.current) {
      processingRef.current = true;

      const { type, webUrl, text } = shareIntent;
      const extractedContent = (typeof webUrl === 'string' && webUrl.length > 0)
        ? webUrl
        : (typeof text === 'string' && text.length > 0 ? text : '');

      // 1. Check for unsupported content types (e.g. media, files)
      if (type === 'media' || type === 'file') {
        Alert.alert(
          'Unsupported Content',
          'Phishing Sense can currently analyze shared text and links.',
          [{ text: 'OK', onPress: () => resetShareIntent() }]
        );
        processingRef.current = false;
        return;
      }

      // 2. Check for empty content
      if (!extractedContent || !extractedContent.trim()) {
        Alert.alert(
          'Empty Share',
          'No text or link content was received from the shared item.',
          [{ text: 'OK', onPress: () => resetShareIntent() }]
        );
        processingRef.current = false;
        return;
      }

      // 3. Valid content — cap length safely (max 10,000 chars)
      const cleanContent = extractedContent.trim().slice(0, 10000);

      // Reset the native intent state before navigation to prevent duplicate triggers
      resetShareIntent();

      // Navigate to scanner screen with autoScan payload
      router.replace({
        pathname: '/(app)/scan',
        params: {
          sharedText: cleanContent,
          autoScan: 'true',
          ts: Date.now().toString(),
        },
      });

      // Reset ref after a short delay
      setTimeout(() => {
        processingRef.current = false;
      }, 500);
    }
  }, [hasShareIntent, shareIntent, error, resetShareIntent, router]);

  return null;
}
