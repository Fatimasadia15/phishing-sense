# Phishing Sense — Working Flow / LLM Handoff

Last updated: 2026-09-03
Project path: `C:\Users\LENOVO\OneDrive\Desktop\phishing-sense`
Repo status: active development, pre-launch polish phase

---

## 1. What This App Is

Phishing Sense is an Expo React Native app for Android/iOS/Web that helps users in Pakistan (especially seniors and low-digital-literacy users) identify scams, phishing links, suspicious messages, and unknown phone numbers.

Core features:
- Scan URLs, emails/SMS text, and phone numbers for phishing/scam risk
- AI safety assistant (Sense AI) that answers safety questions in English, Urdu, or Roman Urdu
- Panic Mode with emergency helpline guidance
- Community reporting for scam numbers/links
- Bilingual UI (English / Urdu) with RTL support
- Text-size accessibility setting for older adults

---

## 2. Architecture

### Frontend
- **Framework:** Expo SDK ~52 + React Native 0.76.9 + TypeScript
- **Router:** `expo-router` with `(auth)` and `(app)` route groups
- **State:**
  - `src/store/AppContext.tsx` — scan history, chat messages, stats, text size, notifications
  - `src/store/AuthContext.tsx` — Supabase Auth session, sign in/up/out, OAuth, password reset
- **Theme:** `src/theme/ThemeContext.tsx` + token system in `src/theme/tokens.ts`
- **i18n:** `react-i18next` with `src/i18n/en.json`, `src/i18n/ur.json`, `src/i18n/index.ts`
- **API client:** `src/services/api.ts` (backend + Supabase calls)
- **Voice:** `src/services/voice.ts` + `expo-speech-recognition` (native build required)

### Backend
- **Runtime:** Node.js + Express
- **Path:** `server/`
- **Entry:** `server/src/server.js`
- **Engine:** deterministic rule-based phishing analysis in `server/src/engine/rules.js`
- **Optional LLM:** OpenAI-compatible client in `server/src/engine/llm.js`; controlled by `LLM_PROVIDER`
- **Database:** Supabase PostgreSQL
- **Auth verification:** Supabase JWT middleware `server/src/middleware/auth.js`
- **Tests:** Node built-in test runner, `server/__tests__/analyze.test.js`

### External Services
- **Supabase Auth + DB:** `https://ccacfjqkuiklwsjufrii.supabase.co`
- **Google OAuth:** enabled in Supabase Auth providers
- **Facebook OAuth:** app created under `ayesha8906195@gmail.com`; enable in Supabase Auth providers and configure redirect URLs

---

## 3. Current Implementation Status

### Done
- Backend rule engine + LLM layer + combination logic
- `POST /api/analyze`, `GET /api/health`, `/api/check-number`, `/api/report`, `/api/history`, `/api/chat`
- Backend JWT auth middleware + request validation
- Frontend API client with offline fallback
- Supabase AuthContext with email/password, Google OAuth, password reset
- Scan history persisted to Supabase; Home/Profile read real data
- Phone number lookup + community reporting
- Voice input for Scan and Sense AI (requires native build)
- Panic Mode with configurable helplines
- i18n for all major feature strings
- Removed most `MOCK_*` data; only `mockScanContent` remains as an explicitly labeled offline fallback

### Pending / In Progress
- **Phase 6 UI/UX polish** — minor screen-level fixes
- **Supabase service-role key rotation** — leaked key must be rotated in Dashboard
- **Facebook OAuth provider config** in Supabase Auth (app exists, needs credentials + redirect URLs)
- Final device QA on Android/iOS

---

## 4. Key Files and Responsibilities

| File | What it does |
|------|--------------|
| `app.json` | Expo config, scheme `phishingsense`, plugins, `extra.apiBaseUrl` / `extra.supabaseUrl` / `extra.supabaseAnonKey` |
| `app/_layout.tsx` | Root layout, auth gate, i18n init, deep-link OAuth handling |
| `app/(app)/_layout.tsx` | Tab bar layout; tab labels should be i18n (pending) |
| `app/(app)/home.tsx` | Home dashboard, quick actions, recent scans, panic shortcut |
| `app/(app)/scan.tsx` | Scan screen with type tabs, input, results, share, community report |
| `app/(app)/sense-ai.tsx` | Sense AI chat screen |
| `app/(app)/panic.tsx` | Panic mode step-by-step guidance |
| `app/(app)/profile.tsx` | User profile, stats, menu, sign out |
| `app/(app)/settings.tsx` | Theme, text size, language, notifications |
| `src/store/AuthContext.tsx` | Supabase auth state and methods |
| `src/store/AppContext.tsx` | App state, history fetch, scan submission |
| `src/services/api.ts` | All backend/API calls |
| `src/services/supabase.ts` | Supabase client init with `AsyncStorage` |
| `src/services/voice.ts` | Speech recognition + TTS helpers |
| `src/i18n/en.json` / `ur.json` | Translation strings |
| `server/src/server.js` | Express server, routes, middleware wiring |
| `server/src/routes/analyze.js` | Scan analysis endpoint |
| `server/src/routes/history.js` | Authenticated scan history endpoints |
| `server/src/routes/chat.js` | Sense AI chat endpoint |
| `server/src/middleware/auth.js` | Supabase JWT verification |
| `server/scripts/schema.sql` | Database schema + RLS policies |

---

## 5. Environment Setup

### Root `.env` (frontend)
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.106:3000
EXPO_PUBLIC_SUPABASE_URL=https://ccacfjqkuiklwsjufrii.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### `server/.env`
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=
MAX_BODY_SIZE=5000
LOG_LEVEL=info
LLM_PROVIDER=none
LLM_API_KEY=
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-4o-mini
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=20
MAX_INPUT_LENGTH=5000
SUPABASE_URL=https://ccacfjqkuiklwsjufrii.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<rotated-service-role-key>
SUPABASE_ANON_KEY=<anon-key>
```

> **CRITICAL:** Rotate `SUPABASE_SERVICE_ROLE_KEY` in Supabase Dashboard → Project Settings → API → Service Role Key. The previous key was leaked in git history.

---

## 6. How to Run

### Install dependencies
```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### Start backend
```bash
cd server
npm start
# or
node src/server.js
```
Backend runs on `http://localhost:3000`.

### Start frontend
```bash
# Web
npm start
# then press w

# Android (native build required for voice)
npm run android

# iOS (macOS only)
npm run ios
```

### Run backend tests
```bash
cd server
node --test __tests__/analyze.test.js
```

### TypeScript check
```bash
npx tsc --noEmit
```

---

## 7. Feature Flows

### Sign up / Log in
1. `app/(auth)/login.tsx` or `app/(auth)/signup.tsx` calls methods from `AuthContext`.
2. `AuthContext` uses `src/services/supabase.ts` client.
3. On success, `_layout.tsx` detects session and routes to `(app)/home`.
4. OAuth deep links use scheme `phishingsense://`.

### Scan flow
1. User selects type (URL / message / email / phone) or uses voice/paste.
2. `scan.tsx` calls `addScan(content, type)` from `AppContext`.
3. `AppContext` sends to backend `POST /api/analyze` (authenticated) or falls back to `mockScanContent`.
4. Backend persists result to `scan_history` if DB is connected.
5. Result is shown; user can share or report to community.

### Phone number check
1. `scan.tsx` detects `phone` type.
2. Calls `checkPhoneNumber()` → `GET /api/check-number?number=...`.
3. Backend uses libphonenumber-style validation + community report count.

### Sense AI chat
1. `sense-ai.tsx` calls `sendChatMessage(query, language)` from `AppContext`.
2. Appends to `chatMessages`, calls backend `POST /api/chat`.
3. Backend uses LLM if configured, otherwise returns helpful rule-based fallback answers.
4. Voice-initiated questions are auto-spoken in the detected language.

### Panic Mode
1. `app/(app)/panic.tsx` shows 4 action steps.
2. `callForHelp` uses configurable helpline numbers from backend env / constants.
3. Falls back to alert if `Linking.canOpenURL('tel:...')` is false.

---

## 8. Remaining Tasks (File-Level)

### Phase 6 UI/UX polish
- [ ] `app/(app)/_layout.tsx` — replace hard-coded tab labels with i18n keys (`tabs.home`, `tabs.scan`, `tabs.senseAi`, `tabs.profile`). Add those keys to `en.json` / `ur.json`.
- [ ] `app/(app)/home.tsx` — quick-action cards should pass the scan type:
  ```ts
  router.push({ pathname: '/(app)/scan', params: { type: action.key } })
  ```
  Map `url`→`'url'`, `email`→`'email'`, `sms`→`'message'`, `call`→`'phone'`.
- [ ] `app/(app)/profile.tsx` — top bar screen label currently uses `t('scan.screenLabel')`. Add a profile-specific key (e.g., `profile.screenLabel`) and use it.
- [ ] `app/(app)/scan.tsx` — remove artificial `setTimeout(..., 1800)` delays in `handleScan` and `handleVoiceTextReady`. Ensure chips, paste button, mic button, and send button are at least 44×44 touch targets (add `minWidth`/`minHeight` or `hitSlop`).
- [ ] `app/(app)/sense-ai.tsx` — replace uncleaned `setTimeout(() => scrollRef.current?.scrollToEnd(...), 150)` with a cleanup ref. Ensure mic/send touch targets are 44×44.
- [ ] `app/(app)/settings.tsx` — move hard-coded version string `Phishing Sense • v1.0.0 (Build 100)` into i18n/config. Add key like `settings.about.versionFull`.
- [ ] Auth screens (`login.tsx`, `signup.tsx`, `forgot-password.tsx`) — remove any `console.warn` debug logs; localize remaining hard-coded strings.
- [ ] Shared components (`Button.tsx`, `VoiceButton.tsx`, `Input.tsx`, `Header.tsx`, `LanguageToggle.tsx`, `BrandLogo.tsx`) — audit for hard-coded accessibility labels or captions; ensure 44×44 touch targets.

### Supabase / security
- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY` in Supabase Dashboard; update `server/.env`.
- [ ] Confirm `server/.env` is in `.gitignore` and no secrets exist in git history:
  ```bash
  git log --all --source --remotes -- server/.env
  grep -R "eyJ" . --exclude-dir=node_modules
  ```
- [ ] Enable Facebook OAuth provider in Supabase Auth and add redirect URLs:
  - `https://ccacfjqkuiklwsjufrii.supabase.co/auth/v1/callback`
  - `phishingsense://`
- [ ] Apply `server/scripts/schema.sql` in Supabase SQL Editor (already partially done; fix any missing `user_id` columns if errors occur).

### Production config
- [ ] Update `app.json` `extra.apiBaseUrl` to production backend URL.
- [ ] Verify `app.json` `extra.supabaseAnonKey` is the non-secret anon key.
- [ ] Set `LLM_PROVIDER` and `LLM_API_KEY` in production if using a real LLM.

### QA
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `cd server && node --test __tests__/analyze.test.js`.
- [ ] Run Expo web smoke test (`npm start` → `w`).
- [ ] Test email/password sign up creates `auth.users` + `profiles` row.
- [ ] Test Google OAuth returns session on Android/iOS.
- [ ] Test Facebook OAuth returns session on Android/iOS (after provider config).
- [ ] Test scan result appears in Home recent scans and Profile stats.
- [ ] Test session restore after app restart.
- [ ] Test offline fallback (backend stopped) still returns local scan result.

---

## 9. Common Issues and Fixes

### “column user_id does not exist”
The `scan_history` table was likely created earlier without the `user_id` column. Run:
```sql
ALTER TABLE scan_history
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_scan_user ON scan_history (user_id, created_at DESC);
```

### Voice input not working
Voice requires a native development build. It does not work in Expo Go or web. Build with:
```bash
npx expo prebuild
npx expo run:android   # or run:ios
```

### Backend returns CORS error
Set `CORS_ORIGIN` in `server/.env` to your frontend origin, e.g.:
```env
CORS_ORIGIN=http://localhost:8081
```

### OAuth redirect not working
- Confirm `scheme: "phishingsense"` in `app.json`.
- Confirm redirect URL in Supabase Auth providers matches `phishingsense://`.
- For web, use the Supabase project URL callback.

---

## 10. Design Constraints

- **Risk bands:** SAFE 0–30, SUSPICIOUS 31–70, DANGEROUS 71–100.
- **No demo buttons / broken ends:** every user-facing feature must be real or clearly labeled as offline fallback.
- **Touch targets:** minimum 44×44 dp.
- **Languages:** English (`en`) and Urdu (`ur`); Urdu layout should be RTL.
- **Text size:** `normal` and `large` modes must both be usable.
- **Privacy:** user input is redacted on the client before backend analysis (OTP/PIN/password/CNIC patterns).

---

## 11. Quick Commands Reference

```bash
# Full check before committing
cd server && node --test __tests__/analyze.test.js && cd ..
npx tsc --noEmit

# Start both frontend and backend (two terminals)
# Terminal 1
cd server && npm start
# Terminal 2
npm start

# Reset Expo cache
npx expo start --clear
```

---

## 12. Notes for the Next LLM

- If the user asks about Facebook OAuth, the app exists under `ayesha8906195@gmail.com`.
- The service-role key rotation is the highest-priority security blocker.
- Phase 6 is mostly small UI fixes; no architecture changes needed.
- Always prefer real backend calls over mock data, and keep `mockScanContent` only as the explicitly labeled offline fallback.
- Voice is a native-build-only feature; do not debug it in Expo Go or web.
