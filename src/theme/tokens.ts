// ─────────────────────────────────────────────────────────────
//  Phishing Sense — Design Tokens
//  Single source of truth for all visual primitives.
//  Brand palette: #9FA1FF · #B5BAFF · #AEE2FF · #D9F9DF
// ─────────────────────────────────────────────────────────────
import { Platform } from 'react-native';

export const Colors = {
  // ── Brand ──────────────────────────────────────────────────
  primary:   '#9FA1FF',   // Soft violet  – primary actions, orb idle
  secondary: '#B5BAFF',   // Lavender     – secondary elements
  sky:       '#AEE2FF',   // Sky blue     – listening state, accents
  mint:      '#D9F9DF',   // Mint green   – safe results, success

  // ── Brand tints (for backgrounds / fills) ──────────────────
  primaryLight:   '#E8E8FF',
  secondaryLight: '#ECEEFF',
  skyLight:       '#E8F6FF',
  mintLight:      '#F0FDF4',

  // ── Brand darks (for text on light bg) ─────────────────────
  primaryDark:    '#6B6EE8',
  secondaryDark:  '#8085D6',
  skyDark:        '#5BA8D4',
  mintDark:       '#4CAF82',

  // ── Semantic ────────────────────────────────────────────────
  safe:        '#D9F9DF',
  safeText:    '#1B6B3A',
  safeDark:    '#2E7D55',

  suspicious:     '#FFF3CD',
  suspiciousText: '#92540A',
  suspiciousDark: '#E07B20',

  danger:     '#FFE4E4',
  dangerText: '#991B1B',
  dangerDark: '#DC2626',

  // ── Neutral scale ───────────────────────────────────────────
  white:    '#FFFFFF',
  gray50:   '#F8F9FA',
  gray100:  '#F1F3F5',
  gray200:  '#E9ECEF',
  gray300:  '#DEE2E6',
  gray400:  '#CED4DA',
  gray500:  '#ADB5BD',
  gray600:  '#6C757D',
  gray700:  '#495057',
  gray800:  '#343A40',
  gray900:  '#212529',
  black:    '#000000',
} as const;

export const Spacing = {
  xxs: 2,
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
} as const;

export const Radius = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   18,
  xl:   24,
  xxl:  32,
  pill: 999,
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   19,
  xl:   22,
  xxl:  26,
  xxxl: 32,
  display: 40,
} as const;

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
} as const;

export const LineHeight = {
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.7,
} as const;

// ─────────────────────────────────────────────────────────────
//  Shadow helpers — web expects `boxShadow`, native expects
//  `shadowColor` / `shadowOffset` / `shadowOpacity` / `shadowRadius`.
//  Using the raw `shadow*` props triggers a deprecation warning on web.
// ─────────────────────────────────────────────────────────────
export interface ShadowStyle {
  shadowColor?:   string;
  shadowOffset?:  { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?:  number;
  elevation?:     number;
  boxShadow?:     string;
}

export type ShadowName = 'none' | 'sm' | 'md' | 'lg' | 'orb';

export interface ShadowOverrides {
  color?:    string;
  offsetX?:  number;
  offsetY?:  number;
  opacity?:  number;
  radius?:   number;
  elevation?: number;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const SHADOW_DEFS: Record<ShadowName, {
  color: string; offsetX: number; offsetY: number; opacity: number; radius: number; elevation: number;
}> = {
  none: { color: '#000000', offsetX: 0, offsetY: 0, opacity: 0,    radius: 0,  elevation: 0 },
  sm:   { color: '#9FA1FF', offsetX: 0, offsetY: 2, opacity: 0.08, radius: 4,  elevation: 2 },
  md:   { color: '#9FA1FF', offsetX: 0, offsetY: 4, opacity: 0.12, radius: 8,  elevation: 4 },
  lg:   { color: '#9FA1FF', offsetX: 0, offsetY: 8, opacity: 0.16, radius: 16, elevation: 8 },
  orb:  { color: '#9FA1FF', offsetX: 0, offsetY: 0, opacity: 0.35, radius: 24, elevation: 12 },
};

/**
 * Returns a platform-appropriate shadow style.
 * On web → `{ boxShadow }` (CSS string). On native → `{ shadowColor, shadowOffset, ... }`.
 * Pass a base preset name plus optional overrides.
 */
export function shadow(base: ShadowName, overrides: ShadowOverrides = {}): ShadowStyle {
  const def = SHADOW_DEFS[base];
  const color    = overrides.color    ?? def.color;
  const offsetX  = overrides.offsetX  ?? def.offsetX;
  const offsetY  = overrides.offsetY  ?? def.offsetY;
  const opacity  = overrides.opacity  ?? def.opacity;
  const radius   = overrides.radius   ?? def.radius;
  const elevation = overrides.elevation ?? def.elevation;

  if (Platform.OS === 'web') {
    if (opacity === 0 || radius === 0) return { boxShadow: 'none' };
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px 0px ${hexToRgba(color, opacity)}`,
    };
  }
  return {
    shadowColor:   color,
    shadowOffset:  { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius:  radius,
    elevation,
  };
}

// Shadows — static tokens (kept for backward compat; prefer `shadow()` helper)
export const Shadows: Record<ShadowName, ShadowStyle> = {
  none: shadow('none'),
  sm:   shadow('sm'),
  md:   shadow('md'),
  lg:   shadow('lg'),
  orb:  shadow('orb'),
};

export const Duration = {
  instant:  100,
  fast:     200,
  normal:   300,
  slow:     500,
  slower:   800,
  slowest: 1200,
} as const;

// Orb animation config
export const OrbConfig = {
  idleScale:     { min: 0.97, max: 1.03 },
  idleDuration:  3000,
  listenScale:   { min: 0.95, max: 1.06 },
  listenDuration: 1400,
  analyzeScale:  { min: 0.96, max: 1.05 },
  analyzeDuration: 900,
} as const;
