---
kind: logging_system
name: Console-Based Logging with Tagged Prefixes (No Central Logger)
category: logging_system
scope:
    - '**'
source_files:
    - server/src/server.js
    - server/src/routes/analyze.js
    - server/src/engine/llm.js
    - server/src/db/supabase.js
    - server/scripts/migrate.js
    - app/(auth)/login.tsx
    - app/(auth)/signup.tsx
    - app/(auth)/forgot-password.tsx
    - app/_layout.tsx
---

## What system/approach is used

The repository has **no dedicated logging framework or library**. Both the Express backend and the React Native/Expo mobile app log exclusively via the runtime's built-in `console` methods (`console.log`, `console.warn`, `console.error`). There are no imports of Winston, Pino, Bunyan, Morgan, debug, pino-http, or any other logger. No central logger module exists under `server/src/` or `src/`.

## Key files and packages

- `server/src/server.js` — global error handler and server startup messages; uses `console.error` for unhandled errors and `console.log` for startup diagnostics.
- `server/src/routes/analyze.js` — route-level logging via `console.error('[analyze] ...')` for LLM call failures and unexpected errors.
- `server/src/engine/llm.js` — logs LLM provider status and failures with `[LLM]` tags using `console.warn` and `console.error`.
- `server/src/db/supabase.js` — logs database connection status and missing env vars with `[supabase]` tags.
- `server/scripts/migrate.js` — migration script uses plain `console.log`/`console.error` for progress and failure output.
- Mobile app files under `app/` (e.g. `app/(auth)/login.tsx`, `app/(auth)/signup.tsx`, `app/(auth)/forgot-password.tsx`, `app/_layout.tsx`) use `console.warn` for error handling in UI flows.

## Architecture and conventions

1. **Tagged prefix convention** — Server-side logs consistently start with a square-bracketed tag identifying the subsystem: `[Phishing Sense]`, `[server]`, `[analyze]`, `[LLM]`, `[supabase]`. This is the only structural convention observed and is enforced by developer habit rather than code enforcement.
2. **Level usage** — The codebase loosely maps severity to console level:
   - `console.log` for informational/startup/status messages.
   - `console.warn` for recoverable issues (missing API keys, optional features disabled).
   - `console.error` for failures and exceptions.
3. **No structured fields** — Logs are plain strings; there are no JSON log objects, no request IDs, no correlation IDs, and no timestamp injection beyond what the runtime adds.
4. **No sinks or rotation** — All output goes to stdout/stderr. There is no middleware to capture logs, no file sink, no external log shipper, and no log level configuration.
5. **Error propagation vs logging** — Route handlers catch errors, log them with `console.error`, and return generic user-facing JSON responses without leaking internals (see `server/src/routes/analyze.js` line 51–57). The global error handler in `server.js` follows the same pattern.
6. **Mobile app logging** — The Expo/React Native side mirrors the backend's approach: ad-hoc `console.warn` calls inside try/catch blocks around network/auth operations. No shared logging utility exists in `src/services/`, `src/store/`, or `src/components/`.

## Conventions and constraints

- **Observed convention**: Every server-side log message begins with a `[tag]` prefix so that logs can be visually filtered by component (analyze, LLM, supabase, server).
- **Observed constraint**: Error responses never echo internal error details to the client; they always return a sanitized message such as `'Analysis failed. Please try again.'` or `'Internal server error.'` while the full stack is emitted to stderr via `console.error`.
- **No enforceable rule**: There is no lint rule, package configuration, or test that enforces the tagged-prefix convention or forbids raw `console.log` outside these patterns. It is purely a developer-driven style.
- **Environment-driven behavior**: Log verbosity is not configurable at runtime; the only environment-sensitive behavior is that missing `LLM_PROVIDER` / `SUPABASE_*` variables produce warning logs instead of fatal crashes, allowing the service to fall back to rules-only mode.