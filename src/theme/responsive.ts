// ─────────────────────────────────────────────────────────────
//  Responsive helpers for web vs native.
//  The app is designed for mobile (~390px); on web the viewport
//  can be much wider, making buttons/cards feel oversized.
//  `webScale` tightens heights, paddings and font sizes on web.
// ─────────────────────────────────────────────────────────────
import { Platform, useWindowDimensions } from 'react-native';

/** True when running as a web app. */
export const IS_WEB = Platform.OS === 'web';

/**
 * Scale factor: 1 on native, ~0.82 on web.
 * Multiply heights, paddings, fontSizes by this on web to keep
 * the mobile-tuned design proportional in a wider desktop viewport.
 */
export const WEB_SCALE = IS_WEB ? 0.82 : 1;

/** Compact scale for especially chunky elements (big CTAs, orb stage). */
export const WEB_SCALE_COMPACT = IS_WEB ? 0.75 : 1;

/**
 * Max content width on web. The root layout constrains the app
 * column to this so a wide desktop browser doesn't stretch mobile UI.
 * On native this is unused (returns Infinity).
 */
export const MAX_CONTENT_WIDTH = IS_WEB ? 520 : Infinity;

/**
 * Hook returning the current window width (useful for breakpoints).
 */
export function useViewport() {
  const { width, height } = useWindowDimensions();
  return { width, height, isWide: width >= 768 };
}

/** Clamp a value so web renders smaller but native is untouched. */
export function webShrink(value: number, scale: number = WEB_SCALE): number {
  return IS_WEB ? value * scale : value;
}
