// ─────────────────────────────────────────────────────────────
//  Client-Side Privacy Redaction
//
//  Masks sensitive data BEFORE content is sent to any external
//  service (backend API → LLM).  Deterministic, pure-function,
//  independently testable.
//
//  Design notes
//  ─────────────
//  • Regex is intentionally conservative — it catches the
//    common patterns scammers exploit without pretending to
//    identify every possible secret.
//  • Original values are NEVER stored, logged, or forwarded.
//  • Enough surrounding context is preserved so the rule engine
//    and LLM can still analyse scam intent.
// ─────────────────────────────────────────────────────────────

/** Mask token used in place of redacted values. */
const MASK = '******';

// ── Pattern definitions ─────────────────────────────────────
// Each pattern is a [regex, replacement] pair applied in order.

/**
 * OTP / PIN / verification code patterns.
 * Matches keyword + optional separator + 3-8 digit number.
 * Examples:
 *   "OTP: 839201"     → "OTP: ******"
 *   "pin = 4321"      → "pin = ******"
 *   "code is 998877"  → "code is ******"
 *   "Your OTP is 123456" → "Your OTP is ******"
 */
const OTP_PIN_RE =
  /\b(otp|pin|code|password|passwd|pass|cvv|cvc|verification|verify|token|one[\s-]?time)\s*[:=]?\s*(?:is|your|the|was)?\s*\d{3,8}\b/gi;

/**
 * Standalone 4–8 digit numbers that follow OTP-like context
 * words (lookbehind assertion).
 */
const CONTEXTUAL_DIGITS_RE =
  /(?<=\b(?:otp|pin|code|verification|verify|one[\s-]?time|token)\s*[:=]?\s*(?:is|your|the|was)?\s*)\d{4,8}\b/gi;

/**
 * Generic "password: xxx" or "pwd=xxx" — catches non-numeric
 * password values.
 */
const PASSWORD_KV_RE =
  /\b(password|passwd|pwd|secret|passcode)\s*[:=]\s*\S+/gi;

/**
 * Pakistani CNIC format: XXXXX-XXXXXXX-X
 */
const CNIC_RE = /\b\d{5}-\d{7}-\d\b/g;

/**
 * Credit-card-like 16-digit sequences (with optional spaces/dashes).
 */
const CARD_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

/**
 * Authorization / reference codes: alphanumeric strings
 * explicitly labelled as "auth code", "ref code", etc.
 */
const AUTH_CODE_RE =
  /\b(auth(?:orization)?|reference|ref|confirmation|booking)\s*(?:code|number|no\.?|#)?\s*[:=]?\s*[A-Z0-9]{4,16}\b/gi;

// ── Public API ──────────────────────────────────────────────

/**
 * Redact sensitive data from text before external submission.
 *
 * This is a **pure function** — same input always produces the
 * same output.  It never throws on any input type.
 *
 * @param text  The raw user-supplied text.
 * @returns     Sanitised text with secrets replaced by MASK.
 */
export function redactSensitive(text: string): string {
  if (typeof text !== 'string' || text.length === 0) return '';

  let clean = text;

  // 1. OTP / PIN / code keywords + digits
  clean = clean.replace(OTP_PIN_RE, (match) => {
    // Keep the keyword prefix, mask only the numeric tail
    return match.replace(/\d{3,8}/, MASK);
  });

  // 2. Contextual digits (standalone numbers after OTP keywords)
  clean = clean.replace(CONTEXTUAL_DIGITS_RE, MASK);

  // 3. Password key-value pairs (non-numeric values)
  clean = clean.replace(PASSWORD_KV_RE, (match) => {
    const colonIdx = match.search(/[:=]/);
    return match.slice(0, colonIdx + 1) + ' ' + MASK;
  });

  // 4. CNIC numbers
  clean = clean.replace(CNIC_RE, `[CNIC-${MASK}]`);

  // 5. Credit card numbers
  clean = clean.replace(CARD_RE, `[CARD-${MASK}]`);

  // 6. Authorisation / reference codes
  clean = clean.replace(AUTH_CODE_RE, (match) => {
    // Keep the label, mask the code value
    return match.replace(/[A-Z0-9]{4,16}$/i, MASK);
  });

  return clean;
}

/**
 * Quick boolean check: does the input contain OTP/PIN-like content?
 * Used as a signal for the scanner and rule engine.
 */
export function containsSensitiveData(text: string): boolean {
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

/**
 * Infer the content type from text for the scanner pipeline.
 * Returns the most likely input type without making network calls.
 */
export function inferContentType(
  text: string
): 'url' | 'email' | 'phone' | 'sms' {
  if (typeof text !== 'string') return 'sms';
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    /^[\w-]+\.[a-z]{2,}/i.test(lower)
  ) {
    return 'url';
  }
  if (lower.includes('@') && !lower.startsWith('http')) return 'email';
  if (/^\+?[\d\s\-()]+$/.test(trimmed)) return 'phone';
  return 'sms';
}
