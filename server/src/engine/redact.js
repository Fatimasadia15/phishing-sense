// ─────────────────────────────────────────────────────────────
//  Privacy Redaction Engine (server-side)
//
//  Strips sensitive patterns BEFORE any external LLM call.
//  Mirrors the patterns in src/services/redact.ts so the same
//  deterministic redaction runs on both client and server.
//
//  Design notes
//  ─────────────
//  • Regex is intentionally conservative — catches common
//    scam-exploited patterns without pretending to identify
//    every possible secret.
//  • Original values are NEVER logged or forwarded.
//  • Enough context is preserved for scam analysis.
// ─────────────────────────────────────────────────────────────

const MASK = '******';

// ── Pattern definitions (mirrors src/services/redact.ts) ────

const OTP_PIN_RE =
  /\b(otp|pin|code|password|passwd|pass|cvv|cvc|verification|verify|token|one[\s-]?time)\s*[:=]?\s*(?:is|your|the|was)?\s*\d{3,8}\b/gi;

const CONTEXTUAL_DIGITS_RE =
  /(?<=\b(?:otp|pin|code|verification|verify|one[\s-]?time|token)\s*[:=]?\s*(?:is|your|the|was)?\s*)\d{4,8}\b/gi;

const PASSWORD_KV_RE =
  /\b(password|passwd|pwd|secret|passcode)\s*[:=]\s*\S+/gi;

const CNIC_RE = /\b\d{5}-\d{7}-\d\b/g;

const CARD_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

const AUTH_CODE_RE =
  /\b(auth(?:orization)?|reference|ref|confirmation|booking)\s*(?:code|number|no\.?|#)?\s*[:=]?\s*[A-Z0-9]{4,16}\b/gi;

// ── Public functions ────────────────────────────────────────

/**
 * Redact OTP, PIN, password, CNIC, credit card, and auth code
 * values from user input.  Returns the sanitised string.
 */
function redactSensitive(text) {
  if (typeof text !== 'string' || text.length === 0) return '';

  let clean = text;

  // 1. OTP / PIN / code keywords + digits
  clean = clean.replace(OTP_PIN_RE, (match) => {
    return match.replace(/\d{3,8}/, MASK);
  });

  // 2. Contextual digits (standalone numbers after OTP keywords)
  clean = clean.replace(CONTEXTUAL_DIGITS_RE, MASK);

  // 3. Password key-value pairs (non-numeric values)
  clean = clean.replace(PASSWORD_KV_RE, (match) => {
    const colonIdx = match.search(/[:=]/);
    return match.slice(0, colonIdx + 1) + ' ' + MASK;
  });

  // 4. CNIC format: 12345-1234567-1
  clean = clean.replace(CNIC_RE, `[CNIC-${MASK}]`);

  // 5. 16-digit credit card numbers (with optional spaces/dashes)
  clean = clean.replace(CARD_RE, `[CARD-${MASK}]`);

  // 6. Authorization / reference codes
  clean = clean.replace(AUTH_CODE_RE, (match) => {
    return match.replace(/[A-Z0-9]{4,16}$/i, MASK);
  });

  return clean;
}

/**
 * Quick boolean check: does the input contain OTP/PIN-like content?
 * Used as a signal for the rule engine.
 */
function containsSensitiveData(text) {
  if (typeof text !== 'string' || text.length === 0) return false;

  // Reset lastIndex on global regexes to avoid stateful .test() pitfalls
  OTP_PIN_RE.lastIndex = 0;
  CNIC_RE.lastIndex = 0;
  CARD_RE.lastIndex = 0;
  PASSWORD_KV_RE.lastIndex = 0;

  return (
    OTP_PIN_RE.test(text) ||
    CNIC_RE.test(text) ||
    CARD_RE.test(text) ||
    PASSWORD_KV_RE.test(text)
  );
}

module.exports = { redactSensitive, containsSensitiveData, MASK };
