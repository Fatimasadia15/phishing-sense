# Phishing Sense

Phishing Sense is a cross-platform Expo app that helps people identify phishing links, scam messages, suspicious emails, and unknown phone numbers. It is designed with accessibility and local context in mind, including English, Urdu, and Roman Urdu support.

## Features

- Scan URLs, SMS/messages, emails, and phone numbers
- Rule-based phishing and scam risk analysis
- Optional OpenAI-compatible LLM analysis with safe fallback behavior
- English and Urdu interface with RTL support
- Sense AI safety assistant
- Panic Mode with emergency guidance
- Community scam reports and scan history
- Voice input on native Android/iOS builds
- Light, dark, and system themes
- Supabase authentication and PostgreSQL persistence
- Web, Android, and iOS support

## Tech Stack

- Expo SDK 52
- React Native 0.76
- TypeScript
- Expo Router
- Node.js and Express
- Supabase Auth and PostgreSQL
- Optional OpenAI-compatible LLM provider

## Project Structure

```text
app/                 Expo Router screens and layouts
assets/              App icons, logos, and splash assets
src/components/      Shared React Native components
src/i18n/             English and Urdu translations
src/services/         API, Supabase, redaction, and voice services
src/store/            Authentication and application state
src/theme/            Themes, tokens, and responsive helpers
server/src/           Express API and phishing analysis engine
server/__tests__/     Backend tests
server/scripts/       Database schema and migration scripts
```

## Requirements

- Node.js 18 or newer
- npm
- Android Studio for Android builds
- Xcode on macOS for iOS builds
- A Supabase project for authentication and persistence

## Installation

Clone the repository and install both frontend and backend dependencies:

```bash
git clone <your-repository-url>
cd phishing-sense
npm install

cd server
npm install
cd ..
```

 Environment Variables
 Running Locally

Start the backend:

```bash
cd server
npm start
```

The API runs on `http://localhost:3000` by default.

In a second terminal, start the Expo app:

```bash
npm start
```

Then choose a target from the Expo CLI:

```bash
npm run web       # Web
npm run android   # Android native build
npm run ios       # iOS native build, macOS only
```

For a physical device, set `EXPO_PUBLIC_API_BASE_URL` to an address reachable from that device. Android emulators commonly use `http://10.0.2.2:3000` for a host-local backend.

## Backend API

The Express server exposes the following main routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/analyze` | Analyze a URL, message, email, or phone number |
| `GET` | `/api/check-number` | Check a phone number and community reports |
| `POST` | `/api/report` | Submit a community scam report |
| `GET` | `/api/history` | Read authenticated scan history |
| `POST` | `/api/chat` | Ask the Sense AI safety assistant |

The analysis pipeline validates input, runs deterministic rules, optionally calls an LLM with sensitive values redacted, and combines the results using a safety-biased risk policy.

## Testing and Type Checking

Run backend tests:

```bash
cd server
npm test
```

Run the frontend TypeScript check from the repository root:

```bash
npx tsc --noEmit
```

## Security Notes

- Sensitive OTP, PIN, CNIC, and card-like values are redacted before optional LLM processing.
- The API uses Helmet, CORS controls, request validation, body-size limits, rate limiting, and generic error responses.
- Rotate any Supabase service-role key that has ever been exposed in source control or logs.
- Do not use a service-role key in the mobile app or web client.

## License

See [LICENSE](LICENSE) for license information.
