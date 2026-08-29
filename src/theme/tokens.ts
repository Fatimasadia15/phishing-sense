// ─────────────────────────────────────────────────────────────
//  Phishing Sense — Design Tokens
//  Single source of truth for all visual primitives.
//  Brand palette: #9FA1FF · #B5BAFF · #AEE2FF · #D9F9DF
// ─────────────────────────────────────────────────────────────

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

export interface ShadowStyle {
  shadowColor?:   string;
  shadowOffset?:  { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?:  number;
  elevation?:     number;
}

// Shadows — soft, layered, neutral
export const Shadows: Record<'none' | 'sm' | 'md' | 'lg' | 'orb', ShadowStyle> = {
  none: {},
  sm: {
    shadowColor:   '#9FA1FF',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  4,
    elevation: 2,
  },
  md: {
    shadowColor:   '#9FA1FF',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius:  8,
    elevation: 4,
  },
  lg: {
    shadowColor:   '#9FA1FF',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius:  16,
    elevation: 8,
  },
  orb: {
    shadowColor:   '#9FA1FF',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius:  24,
    elevation: 12,
  },
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
