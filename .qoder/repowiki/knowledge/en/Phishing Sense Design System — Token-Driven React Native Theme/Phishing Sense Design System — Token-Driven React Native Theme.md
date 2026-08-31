---
kind: frontend_style
name: Phishing Sense Design System — Token-Driven React Native Theme
category: frontend_style
scope:
    - '**'
source_files:
    - src/theme/tokens.ts
    - src/theme/lightTheme.ts
    - src/theme/darkTheme.ts
    - src/theme/ThemeContext.tsx
    - src/theme/responsive.ts
    - src/components/ui/Button.tsx
    - src/components/ui/Card.tsx
    - src/components/ui/Input.tsx
    - src/components/ui/Badge.tsx
    - app.json
---

## What system/approach is used

The app uses a **token-driven design system** built on top of React Native / Expo. There is no CSS framework, Tailwind, or SCSS; styling is entirely done via `react-native` `StyleSheet` objects and inline style objects that consume a centralized theme. The theme is composed from three layers:

1. **Design tokens** (`src/theme/tokens.ts`) — primitive values for colors, spacing, radius, font sizes, font weights, line heights, durations, and shadows.
2. **Themed palettes** (`src/theme/lightTheme.ts`, `src/theme/darkTheme.ts`) — semantic color maps (backgrounds, surfaces, text, borders, semantic states like safe/suspicious/danger) plus typography families and shadow sets, one per mode.
3. **Runtime context** (`src/theme/ThemeContext.tsx`) — exposes `{ theme, mode, setMode, isDark }` via React Context, persisted to `AsyncStorage` under `@phishing_sense/theme_mode`, with support for `light | dark | system` modes driven by `useColorScheme()`.

Components in `src/components/ui/*` are the only place where visual styles are applied; they read from `useTheme()` rather than hardcoding values.

## Key files and packages

- `src/theme/tokens.ts` — single source of truth for all primitives: brand palette (`#9FA1FF`, `#B5BAFF`, `#AEE2FF`, `#D9F9DF`), neutral scale (`gray50..gray900`), semantic colors, spacing scale (`xxs..massive`), radius scale (`xs..pill`), font size/weight scales, animation durations, orb animation config, and a cross-platform `shadow()` helper that emits `boxShadow` on web and native `shadow*` props on iOS/Android.
- `src/theme/lightTheme.ts` — light-mode `Theme` object mapping semantic keys (`background`, `surfaceElevated`, `textPrimary`, `borderFocus`, `safe`, etc.) to concrete token values; defines font family names (`SpaceGrotesk_600SemiBold`, `Inter_400Regular`).
- `src/theme/darkTheme.ts` — parallel dark-mode theme with adjusted brand brightness, deep navy backgrounds (`#0F0F1A`), and re-tuned shadow opacities.
- `src/theme/ThemeContext.tsx` — `ThemeProvider` + `useTheme()` hook, persists mode to AsyncStorage, resolves `isDark` based on explicit selection or system preference.
- `src/theme/responsive.ts` — web vs native helpers: `IS_WEB`, `WEB_SCALE` (~0.82), `WEB_SCALE_COMPACT` (0.75), `MAX_CONTENT_WIDTH` (520px), `useViewport()`, and `webShrink()` to proportionally shrink dimensions on web.
- `src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `Badge.tsx`, `Header.tsx`, `VoiceButton.tsx`, `SenseOrb.tsx`, `BrandLogo.tsx`, `LanguageToggle.tsx` — reusable UI components that consume `useTheme()` and apply tokens consistently.
- `app.json` — declares `userInterfaceStyle: automatic`, splash background `#F8F8FF`, adaptive icon background `#9FA1FF`.

## Architecture and conventions

### Token layering
Primitives live in `tokens.ts` and are never referenced directly by components. Components go through the `theme` object exposed by `ThemeContext`, which composes primitives into semantic tokens (`colors.backgroundCard`, `colors.borderFocus`, `shadows.md`, `fonts.bodySemibold`). This two-layer approach lets light/dark variants swap without touching component code.

### Shadow strategy
The `shadow()` helper centralizes platform differences: on web it returns a CSS `boxShadow` string; on native it returns `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius`/`elevation`. A comment explicitly notes that raw `shadow*` props trigger deprecation warnings on web, so the helper must be used.

### Component styling pattern
Each UI component follows the same shape:
- Props define behavior and variant (`variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'`, `size?: 'sm' | 'md' | 'lg'`).
- Visual values are resolved inside the component via `useTheme()` and small lookup tables keyed by variant/size.
- Styles are composed as arrays of `StyleSheet.create(...)` base styles merged with inline token-driven overrides.
- Typography uses `theme.fonts.*` families and `theme.fontSize.*` scales; sizing adapts to `useApp().textSize` for accessibility (large text mode).

### Responsive strategy
The app is designed for mobile (~390px). On web, `responsive.ts` provides scale factors (`WEB_SCALE = 0.82`, `WEB_SCALE_COMPACT = 0.75`) and a `MAX_CONTENT_WIDTH` of 520px so desktop browsers don't stretch the mobile layout. Components like `Button` use `IS_WEB` to pick different heights/paddings/font sizes per platform.

### Accessibility and elderly-friendly defaults
Component comments state minimum touch targets: buttons default to ≥52px height, inputs to ≥52px, with larger sizes in "large" text mode. Components expose `accessibilityLabel`, `accessibilityRole`, and `accessibilityState` props. RTL support is wired through `useLanguage()` (`isRTL`) affecting `textAlign` and `writingDirection` in `Input`.

### Semantic color model
Colors are split into three groups in `tokens.ts`: brand (`primary`, `secondary`, `sky`, `mint` with `Light`/`Dark` tints), semantic status (`safe`, `suspicious`, `danger` with text and dark variants), and neutrals (`white`..`black`). Themes map these to surface/background/text roles, so components always reference semantic keys like `colors.safeText` rather than raw hex values.

## Conventions and constraints

- **All visual values come from the theme.** Components do not hardcode colors, radii, or font families; they read `theme.colors.*`, `theme.radius.*`, `theme.fonts.*`, and `theme.shadows.*`.
- **New tokens belong in `tokens.ts`.** Primitives (colors, spacing, radius, font sizes, durations) are defined once and reused by both themes.
- **Light and dark themes must implement the full `Theme` interface** from `lightTheme.ts` (backgrounds, surfaces, brand, text, borders, semantic, tabs, orb states, fonts, shadows).
- **Use the `shadow()` helper instead of raw `shadow*` props** to avoid web deprecation warnings and get correct `boxShadow` output.
- **Web sizing is scaled down** via `IS_WEB` checks and `WEB_SCALE`/`WEB_SCALE_COMPACT`; native sizing stays at the mobile baseline.
- **Touch targets must meet the elderly-friendly minimums** documented in component comments (≥52px height for buttons/inputs).
- **Theme mode is persisted** to AsyncStorage under `@phishing_sense/theme_mode` and supports `light | dark | system`.
- **Typography families** are declared in theme `fonts` and consumed via `theme.fonts.*`; the project uses `SpaceGrotesk` for headings and `Inter` for body text (loaded via Expo font loading, not shown here but referenced by name).
- **No CSS-in-JS library beyond React Native StyleSheet** is used; styling is purely programmatic via RN style objects.