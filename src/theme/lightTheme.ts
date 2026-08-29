import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from './tokens';

export interface ThemeColors {
  background:        string;
  backgroundAlt:     string;
  backgroundCard:    string;
  backgroundSheet:   string;
  backgroundMuted:   string;
  backgroundOverlay: string;

  surface:         string;
  surfaceElevated: string;
  surfaceSunken:   string;

  primary:        string;
  primaryLight:   string;
  primaryDark:    string;
  secondary:      string;
  secondaryLight: string;
  secondaryDark:  string;
  sky:            string;
  skyLight:       string;
  skyDark:        string;
  mint:           string;
  mintLight:      string;
  mintDark:       string;

  textPrimary:   string;
  textSecondary: string;
  textTertiary:  string;
  textDisabled:  string;
  textInverse:   string;
  textOnPrimary: string;

  border:       string;
  borderFocus:  string;
  borderStrong: string;

  safe:           string;
  safeText:       string;
  safeDark:       string;
  suspicious:     string;
  suspiciousText: string;
  suspiciousDark: string;
  danger:         string;
  dangerText:     string;
  dangerDark:     string;

  tabActive:   string;
  tabInactive: string;
  tabBg:       string;

  orbIdle:    string;
  orbListen:  string;
  orbAnalyze: string;
  orbResult:  string;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  spacing: typeof Spacing;
  radius: typeof Radius;
  fontSize: typeof FontSize;
  fontWeight: typeof FontWeight;
  shadows: typeof Shadows;
  fonts: {
    heading: string;
    headingBold: string;
    body: string;
    bodyMedium: string;
    bodySemibold: string;
  };
}

// ─────────────────────────────────────────────────────────────
//  Light Theme
// ─────────────────────────────────────────────────────────────
export const lightTheme: Theme = {
  dark: false,

  colors: {
    // Backgrounds
    background:        '#F8F9FE',
    backgroundAlt:     '#FFFFFF',
    backgroundCard:    '#FFFFFF',
    backgroundSheet:   '#FFFFFF',
    backgroundMuted:   '#F1F3FD',
    backgroundOverlay: 'rgba(15,15,26,0.4)',

    // Surfaces
    surface:         '#FFFFFF',
    surfaceElevated: '#FAFAFF',
    surfaceSunken:   '#F0F0FF',

    // Brand
    primary:        Colors.primary,
    primaryLight:   Colors.primaryLight,
    primaryDark:    Colors.primaryDark,
    secondary:      Colors.secondary,
    secondaryLight: Colors.secondaryLight,
    secondaryDark:  Colors.secondaryDark,
    sky:            Colors.sky,
    skyLight:       Colors.skyLight,
    skyDark:        Colors.skyDark,
    mint:           Colors.mint,
    mintLight:      Colors.mintLight,
    mintDark:       Colors.mintDark,

    // Text
    textPrimary:   '#1A1A2E',
    textSecondary: '#4A4A6A',
    textTertiary:  '#8585A8',
    textDisabled:  '#B0B0C8',
    textInverse:   '#FFFFFF',
    textOnPrimary: '#FFFFFF',

    // Borders
    border:       '#E8E8F5',
    borderFocus:  Colors.primary,
    borderStrong: '#C8C8E5',

    // Semantic
    safe:           Colors.safe,
    safeText:       Colors.safeText,
    safeDark:       Colors.safeDark,
    suspicious:     Colors.suspicious,
    suspiciousText: Colors.suspiciousText,
    suspiciousDark: Colors.suspiciousDark,
    danger:         Colors.danger,
    dangerText:     Colors.dangerText,
    dangerDark:     Colors.dangerDark,

    // Tab bar
    tabActive:   Colors.primary,
    tabInactive: '#A0A0C0',
    tabBg:       '#FFFFFF',

    // Orb states
    orbIdle:     Colors.primary,
    orbListen:   Colors.sky,
    orbAnalyze:  Colors.secondary,
    orbResult:   Colors.mint,
  },

  spacing: Spacing,
  radius:  Radius,
  fontSize: FontSize,
  fontWeight: FontWeight,
  shadows: Shadows,

  // Typography families
  fonts: {
    heading: 'SpaceGrotesk_600SemiBold',
    headingBold: 'SpaceGrotesk_700Bold',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemibold: 'Inter_600SemiBold',
  },
};
