---
kind: error_handling
name: 'Express.js Error Handling: Validation Middleware, Global Error Handler, and Graceful Degradation'
category: error_handling
scope:
    - '**'
source_files:
    - server/src/server.js
    - server/src/middleware/validate.js
    - server/src/routes/analyze.js
    - src/services/api.ts
---

## System Overview

The Phishing Sense monorepo uses a two-tier error handling strategy across its Express.js backend (`server/src/`) and React Native frontend (`src/services/api.ts`). The server relies on Express middleware for input validation and a global error handler, while the mobile app handles network failures gracefully by falling back to local demo data.

## Backend (Express.js)

### Input Validation via Middleware
All request validation is centralized in `server/src/middleware/validate.js`. Each route has a dedicated validator function (`validateAnalyzeRequest`, `validateCheckNumberRequest`, `validateCommunityReportRequest`) that checks field presence, type, length, and allowed enum values. Validation errors return HTTP 400 with a structured `{ error: "..." }` JSON body — no exceptions are thrown; validation failures short-circuit via `res.status(400).json(...)` before reaching route handlers.

### Route-Level Try/Catch
Route handlers wrap their logic in try/catch blocks. In `server/src/routes/analyze.js`, the LLM call is wrapped in an inner try/catch so that an LLM failure does not abort the entire analysis — the system falls back to rule-only results. A surrounding outer try/catch catches unexpected errors and returns a generic 500 response with `{ error: "Analysis failed. Please try again." }`, deliberately omitting stack traces or internal details from the client response.

### Global Error Handler
`server/src/server.js` defines a standard Express error-handling middleware at the bottom of the stack:
```js
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});
```
This catches any unhandled exceptions, logs them to stdout, and returns a uniform 500 JSON response. It is placed after all routes and the 404 handler, ensuring it only runs when no other handler responds.

### Rate Limiting Errors
The `express-rate-limit` middleware is configured with a custom message: `{ error: 'Too many requests. Please wait a moment and try again.' }`, returning 429 responses with this body when rate limits are exceeded.

### 404 Handling
A catch-all `app.use((_req, res) => { res.status(404).json({ error: 'Endpoint not found.' }); })` ensures unknown routes return a consistent 404 JSON response.

## Frontend (React Native / Expo)

### Network Error Handling
In `src/services/api.ts`, every API call wraps `fetch` in try/catch and uses `AbortController` with a timeout (10s for most calls, 3s for health checks, 5s for community count). On network failure, timeout (`AbortError`), or non-OK HTTP status, each function returns a safe sentinel value instead of throwing: `null` for mutation/query functions, `0` for counts, and `false` for availability checks. This allows UI components to degrade gracefully without crashing.

### Verdict Mapping
Frontend code maps backend verdict strings (`SAFE`, `SUSPICIOUS`, `DANGEROUS`) to local risk levels via a `mapVerdict` switch, defaulting to `suspicious` for unknown values — a defensive fallback.

## Conventions and Constraints

- **Validation errors** always use HTTP 400 with a human-readable `{ error }` string — never throw exceptions.
- **Unexpected server errors** are caught by the global Express error handler and returned as HTTP 500 with a sanitized `{ error }` message; internal details are logged but never sent to clients.
- **Optional external dependencies** (LLM calls) are wrapped in isolated try/catch blocks so failures degrade gracefully rather than failing the whole request.
- **Client-side API calls** never propagate errors upward — they return `null`, `0`, or `false` sentinel values, letting callers decide how to present fallback behavior.
- **Rate limiting** produces a user-friendly 429 JSON response via `express-rate-limit` configuration.
- **No custom error classes** are defined; errors are represented as plain JavaScript `Error` objects or structured JSON payloads.