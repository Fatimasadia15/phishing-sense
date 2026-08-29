---
kind: configuration_system
name: Environment-Based Configuration via dotenv for Backend; Expo Config JSON for Mobile App
category: configuration_system
scope:
    - '**'
source_files:
    - server/.env.example
    - server/src/server.js
    - server/src/engine/llm.js
    - server/src/middleware/validate.js
    - app.json
---

## What system/approach is used

The repository uses a simple, file-based configuration approach split between the backend and the mobile app:

- **Backend (Express server)**: Uses `dotenv` to load key-value pairs from a `.env` file at startup. There is no schema validation, config object abstraction, or runtime config API — every module reads directly from `process.env`.
- **Mobile app (Expo/React Native)**: Uses Expo's declarative `app.json` manifest for build-time configuration (bundle identifiers, splash screen, platform-specific settings). No runtime environment variable loading was found in the React Native codebase.

## Key files and packages

- `server/.env.example` — template documenting all supported environment variables with comments explaining each one.
- `server/src/server.js` — bootstraps Express, loads `.env` via `require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })`, and consumes `PORT`, `LLM_PROVIDER`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`.
- `server/src/engine/llm.js` — reads `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_API_URL`, `LLM_MODEL` to gate and configure the optional LLM analysis pipeline.
- `server/src/middleware/validate.js` — reads `MAX_INPUT_LENGTH` to enforce request body size limits.
- `app.json` — Expo manifest declaring app name, slug, version, scheme, splash, iOS/Android bundle IDs, and web bundler.

## Architecture and conventions

1. **Single source of truth per process**: The `.env` file is the only configuration input for the backend. It is loaded once at the top of `server.js` before any other module runs.
2. **Direct `process.env` access**: Modules read configuration inline where needed rather than through a centralized config module. This keeps dependencies minimal but scatters configuration knowledge across `server.js`, `engine/llm.js`, and `middleware/validate.js`.
3. **Default values everywhere**: Every `process.env` read supplies a sensible default (e.g. `LLM_PROVIDER || 'none'`, `LLM_API_URL || 'https://api.openai.com/v1/chat/completions'`, `LLM_MODEL || 'gpt-4o-mini'`, `PORT || '3000'`). This makes the server runnable without any `.env` file.
4. **Feature flags via env vars**: `LLM_PROVIDER=none` disables the LLM entirely and falls back to the deterministic rule engine. Setting it to `openai` enables the optional AI layer.
5. **Secrets are separate from defaults**: `LLM_API_KEY` has no default — if missing, the LLM layer logs a warning and returns null, gracefully degrading to rules-only mode.
6. **Declarative app metadata**: The mobile app's `app.json` is the single place for Expo build-time configuration (bundle IDs, splash colors, platform toggles). No runtime config loading was observed in the TypeScript/React Native source.

## Conventions and constraints

- **`.env` must be copied from `.env.example`** — the example file explicitly instructs users to copy it to `.env` and fill in real values.
- **All configurable keys are documented in `.env.example`** with type hints and allowed values (e.g. `LLM_PROVIDER= "openai" | "none"`).
- **No schema validation**: The codebase does not validate that required env vars exist or have correct types beyond `parseInt` casts. Invalid values will produce runtime errors or unexpected behavior.
- **Environment variables are consumed as strings then cast**: Numbers are parsed with `parseInt(..., 10)` at the point of use (`PORT`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `MAX_INPUT_LENGTH`).
- **Production guidance is embedded in code comments**: CORS origins list includes dev URLs and a comment directing developers to add production domains; the health endpoint exposes `llm_provider` so deployments can self-report their configured provider.
- **Mobile app configuration is static**: Unlike the backend, the Expo app does not appear to load runtime environment variables in the scanned source files — configuration is baked into `app.json` at build time.