// ─────────────────────────────────────────────────────────────
//  OTP / PIN / Password Redaction
//  Strips sensitive patterns BEFORE any external LLM call.
// ─────────────────────────────────────────────────────────────

/**
 * Redact OTP, PIN, and password-like values from user input.
 * Returns the sanitized string.
 *
 * Patterns handled:
 *  - 4–8 digit standalone numbers (OTPs, PINs)
 *  - "OTP: 123456", "pin = 4321", "code is 998877"
 *  - Password-like key:value pairs
 *  - CNIC numbers (XXXXX-XXXXXXX-X)
 *  - Credit-card-like 16-digit sequences
 */
function redactSensitive(text) {
  let clean = text;

  // OTP / PIN / code / password followed by digits (with optional words like "is", "your" between)
  clean = clean.replace(
    /\b(otp|pin|code|password|passwd|pass|cvv|cvc)\s*[:=]?\s*(?:is|your|the)?\s*\d{3,8}\b/gi,
    '$1: [REDACTED]'
  );

  // Standalone 4–8 digit numbers that look like OTPs
  // (only when preceded by OTP-like context words)
  clean = clean.replace(
    /(?<=otp|pin|code|verification|verify|one.time|token)\s*[:=]?\s*(?:is|your|the)?\s*\d{4,8}/gi,
    ': [REDACTED]'
  );

  // CNIC format: 12345-1234567-1
  clean = clean.replace(
    /\b\d{5}-\d{7}-\d\b/g,
    '[CNIC-REDACTED]'
  );

  // 16-digit credit card numbers (with optional spaces/dashes)
  clean = clean.replace(
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    '[CARD-REDACTED]'
  );

  // Generic "password: xxx" or "pwd=xxx"
  clean = clean.replace(
    /\b(password|passwd|pwd|secret)\s*[:=]\s*\S+/gi,
    '$1: [REDACTED]'
  );

  return clean;
}

/**
 * Quick check: does the input contain OTP/PIN-like content?
 * Used as a signal for the rule engine.
 */
function containsSensitiveData(text) {
  return /\b(otp|pin|code|password|passwd|cvv)\s*[:=]?\s*(?:is|your|the)?\s*\d{3,8}\b/i.test(text) ||
    /\b\d{5}-\d{7}-\d\b/.test(text) ||
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text);
}

module.exports = { redactSensitive, containsSensitiveData };
