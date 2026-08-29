# Phishing Sense — Build Steps Log

This document records every step taken to build the backend and connect it to the existing frontend.

---

## 1. Repository Inspection (Complete)

**What was done:**
- Read all files in `app/`, `src/`, and root configuration
- Mapped the entire frontend architecture:
  - **Screens**: home, scan, sense-ai, panic, profile, settings (tabs)
  - **Auth screens**: splash, onboarding, login, signup, forgot-password
  - **Navigation**: expo-router with `(app)` and `(auth)` groups
  - **State**: `AppContext` (scan history, chat, stats, preferences) + `AuthContext` (mock auth)
  - **i18n**: English + Urdu with RTL support via i18next
  - **Theme**: Light/Dark/System with full design token system
  - **Scan logic**: Client-side `mockScanContent()` with keyword matching
  - **AI chat**: Regex pattern-matched Q&A pairs (mock)
- Confirmed: no backend existed, all data was mock/demo

**Files inspected:** All 30+ source files across `app/`, `src/`, root config

---

## 2. Backend Server Created

**What was done:**
- Created `server/` directory with standalone Node.js + Express backend
- Separate `package.json` with backend-specific dependencies
- `.env.example` for environment configuration

**Files created:**
| File | Purpose |
|------|---------|
| `server/package.json` | Backend dependencies (express, cors, helmet, rate-limit, dotenv) |
| `server/.env.example` | Environment variable template |

---

## 3. Rule-Based Heuristic Engine

**What was done:**
- Implemented comprehensive deterministic checks for:
  - URL shorteners (15+ services: bit.ly, tinyurl, etc.)
  - Lookalike/typosquatting domains (Levenshtein-like digit substitution detection)
  - Suspicious TLDs (.xyz, .tk, .ml, .ga, etc.)
  - Trusted domain allowlist (Google, Pakistani banks, NADRA, etc.)
  - Urgent/panic language (English + Urdu/Roman Urdu)
  - OTP/PIN/password request patterns
  - Pakistani phone number detection (carrier identification by prefix)
  - Scam wording (prize scams, Benazir/Ehsaas impersonation)
  - Government/bank impersonation patterns
  - Excessive caps, IP address domains, excessive subdomains
  - Suspicious URL path keywords on untrusted domains

**Files created:**
| File | Purpose |
|------|---------|
| `server/src/engine/rules.js` | 360+ lines of heuristic analysis logic |
| `server/src/engine/redact.js` | OTP/PIN/CNIC/credit card redaction before LLM |

---

## 4. LLM Integration Layer

**What was done:**
- Built OpenAI-compatible API client (works with any provider)
- System prompt enforces:
  - English + Urdu + Roman Urdu understanding
  - Structured JSON output
  - Never asks for credentials
  - Plain language for non-technical users
- Strict output validation (score range, verdict alignment, field types)
- 15-second timeout with graceful fallback
- Falls back to rule-only when LLM is unavailable or `LLM_PROVIDER=none`

**Files created:**
| File | Purpose |
|------|---------|
| `server/src/engine/llm.js` | LLM API client + validation |

---

## 5. Risk Score Combination

**What was done:**
- Safety-biased policy: always takes the higher (more cautious) score
- If rule engine says DANGEROUS, LLM cannot downgrade below SUSPICIOUS
- Merges threat indicators from both sources (deduplicated)
- LLM explanations preferred when available (richer, multilingual)
- Roman Urdu explanations auto-generated from rule indicators when LLM is unavailable

**Files created:**
| File | Purpose |
|------|---------|
| `server/src/engine/combine.js` | Risk combination + explanation generation |

---

## 6. API Endpoint + Security

**What was done:**
- `POST /api/analyze` endpoint with full pipeline:
  1. Request validation (input type, length)
  2. Rule engine analysis
  3. LLM analysis (with redacted input)
  4. Result combination
  5. Response sanitization
- `GET /api/health` health check endpoint
- Security measures:
  - Helmet.js headers
  - CORS configuration (Expo-compatible)
  - Rate limiting (20 req/min default, configurable)
  - Request body size limits (10kb)
  - Input validation middleware
  - Generic error responses (no internal leaks)
  - 404 handler for unknown routes

**Files created:**
| File | Purpose |
|------|---------|
| `server/src/server.js` | Express server entry point |
| `server/src/routes/analyze.js` | POST /api/analyze handler |
| `server/src/middleware/validate.js` | Request validation middleware |

---

## 7. Backend Tests

**What was done:**
- 42 tests using Node.js built-in test runner (no extra deps)
- Test coverage:
  - OTP/PIN redaction (5 tests)
  - Sensitive data detection (3 tests)
  - Domain extraction (4 tests)
  - URL shortener detection (3 tests)
  - Lookalike domain detection (3 tests)
  - Suspicious TLD detection (3 tests)
  - Trusted domain checks (3 tests)
  - Full analysis pipeline (8 tests)
  - LLM output validation (5 tests)
  - Risk combination logic (5 tests)
- **All 42 tests pass**

**Files created:**
| File | Purpose |
|------|---------|
| `server/__tests__/analyze.test.js` | 271 lines of comprehensive tests |

**How to run:**
```bash
cd server
node --test __tests__/analyze.test.js
```

---

## 8. Frontend API Service

**What was done:**
- Created TypeScript API client in `src/services/api.ts`
- Platform-aware base URL (Android emulator uses 10.0.2.2, iOS uses localhost)
- 10-second request timeout with AbortController
- Health check function for backend availability detection
- Response mapping: converts backend verdict → frontend ScanResult type
- Input type inference (URL/email/phone/SMS)

**Files created:**
| File | Purpose |
|------|---------|
| `src/services/api.ts` | Frontend API client with fallback support |

---

## 9. Frontend-Backend Wiring

**What was done:**
- Updated `AppContext.tsx`:
  - `addScan()` now tries the backend API first
  - Falls back to local `mockScanContent()` if backend is unavailable
  - Changed signature from sync to async (returns Promise)
- Updated `scan.tsx`:
  - `handleScan` now awaits the async `addScan()`
  - The existing 1.8s animation delay naturally covers API call time

**Files modified:**
| File | Change |
|------|--------|
| `src/store/AppContext.tsx` | `addScan` now async, uses API with mock fallback |
| `app/(app)/scan.tsx` | `handleScan` awaits async `addScan` |

---

## 10. Summary of All New Files

```
server/
├── __tests__/
│   └── analyze.test.js       # 42 passing tests
├── src/
│   ├── engine/
│   │   ├── combine.js        # Risk score combination
│   │   ├── llm.js            # LLM integration layer
│   │   ├── redact.js         # OTP/PIN redaction
│   │   └── rules.js          # Rule-based heuristic engine
│   ├── middleware/
│   │   └── validate.js       # Request validation
│   ├── routes/
│   │   └── analyze.js        # POST /api/analyze handler
│   └── server.js             # Express server entry
├── .env.example              # Environment template
└── package.json              # Backend dependencies

src/services/
└── api.ts                    # Frontend API client
```

---

## How to Run

### Start the backend:
```bash
cd server
cp .env.example .env      # Configure your .env
npm install
npm start                  # Starts on http://localhost:3000
```

### Start the frontend:
```bash
npm start                  # From root directory (Expo)
```

### Run backend tests:
```bash
cd server
node --test __tests__/analyze.test.js
```

### Test the API manually:
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"input":"Your HBL account has been suspended. Verify now at bit.ly/h8l-update","input_type":"message"}'
```

---

## Answers to Your Questions

### Q: How do I add files from Qoder/QMind to this project?
You cannot directly use a `/` prefix to add external files. Instead:
1. Copy the file content and paste it into a new file in this project
2. Or drag and drop files from your file explorer into the workspace
3. Or use the terminal: `copy source_file destination_folder` (Windows)

### Q: Is there an app icon?
Yes! The project already has icon assets:
- `assets/icon.png` — Main app icon
- `assets/favicon.png` — Web favicon
- `assets/splash-icon.png` — Splash screen icon
- `assets/android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png` — Android adaptive icon layers
- `assets/images/logo.png` — Logo image

The `app.json` configures these for both iOS and Android builds.

### Q: Can I run the app without the backend?
**Yes!** The frontend has full offline/demo fallback. When the backend is not running, `addScan()` automatically falls back to the local `mockScanContent()` function, which does basic client-side heuristic analysis. The app works completely standalone.
