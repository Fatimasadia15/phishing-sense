import { Colors, Spacing, Radius, FontSize, FontWeight, shadow } from './tokens';
import type { Theme } from './lightTheme';

// ─────────────────────────────────────────────────────────────
//  Dark Theme
// ─────────────────────────────────────────────────────────────
export const darkTheme: Theme = {
  dark: true,

  colors: {
    // Backgrounds — deep navy/indigo, NOT pure black
    background:        '#0F0F1A',
    backgroundAlt:     '#13131F',
    backgroundCard:    '#1A1A2E',
    backgroundSheet:   '#16162A',
    backgroundMuted:   '#12121F',
    backgroundOverlay: 'rgba(0,0,0,0.65)',

    // Surfaces
    surface:         '#1A1A2E',
    surfaceElevated: '#20203A',
    surfaceSunken:   '#0A0A15',

    // Brand — slightly brighter for dark backgrounds
    primary:        '#ADB0FF',
    primaryLight:   '#1E1E3F',
    primaryDark:    '#8080FF',
    secondary:      '#C4C8FF',
    secondaryLight: '#1C1C38',
    secondaryDark:  '#9FA4F5',
    sky:            '#C2EEFF',
    skyLight:       '#0D1E2E',
    skyDark:        '#7EC7F0',
    mint:           '#E2FDE8',
    mintLight:      '#0D1F12',
    mintDark:       '#5CCF8E',

    // Text
    textPrimary:   '#EEEEF8',
    textSecondary: '#A8A8C8',
    textTertiary:  '#6868A0',
    textDisabled:  '#40405A',
    textInverse:   '#1A1A2E',
    textOnPrimary: '#FFFFFF',

    // Borders
    border:       '#252540',
    borderFocus:  '#ADB0FF',
    borderStrong: '#383858',

    // Semantic
    safe:           '#0F2E1A',
    safeText:       '#6EE8A0',
    safeDark:       '#4CAF82',
    suspicious:     '#2E1E08',
    suspiciousText: '#FFB84D',
    suspiciousDark: '#E07B20',
    danger:         '#2E0A0A',
    dangerText:     '#FF7070',
    dangerDark:     '#DC2626',

    // Tab bar
    tabActive:   '#ADB0FF',
    tabInactive: '#505070',
    tabBg:       '#1A1A2E',

    // Orb states
    orbIdle:    '#ADB0FF',
    orbListen:  '#C2EEFF',
    orbAnalyze: '#C4C8FF',
    orbResult:  '#E2FDE8',
  },

  spacing: Spacing,
  radius:  Radius,
  fontSize: FontSize,
  fontWeight: FontWeight,
  shadows: {
    none: shadow('none'),
    sm:   shadow('sm', { color: '#ADB0FF', opacity: 0.12 }),
    md:   shadow('md', { color: '#ADB0FF', opacity: 0.18 }),
    lg:   shadow('lg', { color: '#ADB0FF', opacity: 0.24 }),
    orb:  shadow('orb', { color: '#ADB0FF', opacity: 0.45 }),
  },

  fonts: {
    heading:      'SpaceGrotesk_600SemiBold',
    headingBold:  'SpaceGrotesk_700Bold',
    body:         'Inter_400Regular',
    bodyMedium:   'Inter_500Medium',
    bodySemibold: 'Inter_600SemiBold',
  },
};
