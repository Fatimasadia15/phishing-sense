// ─────────────────────────────────────────────────────────────
//  Rule-Based Heuristic Engine
//  Deterministic checks that run even when the LLM is offline.
// ─────────────────────────────────────────────────────────────

// ── URL Shorteners ───────────────────────────────────────────
const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
  'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly', 'shorturl.at',
  'rb.gy', 'short.io', 'tiny.cc', 'v.gd', 'j.mp',
];

// ── Suspicious TLDs ─────────────────────────────────────────
const SUSPICIOUS_TLDS = [
  '.xyz', '.tk', '.ml', '.ga', '.cf', '.gq', '.top',
  '.buzz', '.club', '.work', '.click', '.link', '.icu',
];

// ── Trusted domains (well-known, long-established) ──────────
const TRUSTED_DOMAINS = [
  'google.com', 'youtube.com', 'facebook.com', 'amazon.com',
  'microsoft.com', 'apple.com', 'wikipedia.org', 'twitter.com',
  'x.com', 'linkedin.com', 'github.com', 'reddit.com',
  'netflix.com', 'whatsapp.com', 'instagram.com',
  // Pakistani banks & services
  'hbl.com', 'meezanbank.com', 'ublbank.com', 'mcb.com.pk',
  'abpl.com.pk', 'bankalfalah.com', 'faysalbank.com',
  'jazz.com.pk', 'zong.com.pk', 'telenor.com.pk', 'ufone.com',
  'fbr.gov.pk', 'nadra.gov.pk', 'sbp.org.pk',
];

// ── Lookalike brand targets ─────────────────────────────────
const LOOKALIKE_TARGETS = [
  'paypal', 'amazon', 'apple', 'google', 'microsoft',
  'facebook', 'netflix', 'instagram', 'whatsapp',
  'hbl', 'meezan', 'ublb', 'mcb', 'jazz', 'zong', 'telenor',
  'easypaisa', 'jazzcash', 'nayapay', 'sadaapay',
  'fbr', 'nadra', 'sbp',
];

// ── Urgent / panic language ─────────────────────────────────
const URGENCY_PATTERNS = [
  /\burgent(ly)?\b/i,
  /\bimmediate(ly)?\b/i,
  /\bact\s+now\b/i,
  /\bright\s+now\b/i,
  /\b(asap|at\s+once)\b/i,
  /\bexpires?\s+(soon|today|in\s+\d)/i,
  /\blimited\s+time\b/i,
  /\bfinal\s+(warning|notice|alert)\b/i,
  /\byour\s+account\s+(has\s+been|will\s+be|is)\s+(suspended|blocked|locked|restricted|disabled)/i,
  /\bverify\s+(your|now|immediately)/i,
  /\bconfirm\s+(your|now|immediately)/i,
  /\bunauthorized\s+(activity|transaction|login|access)/i,
  // Urdu / Roman Urdu urgency
  /\bفوراً\b/,           // "immediately"
  /\bجلدی\b/,            // "quickly"
  /\bابھی\b/,            // "right now"
  /\bفورن\b/i,           // Roman Urdu "immediately"
  /\babi\b/i,            // Roman Urdu "now"
  /\bjaldi\b/i,          // Roman Urdu "quickly"
  /\bsuspended\b.*\baccount\b/i,
];

// ── OTP / PIN / password request patterns ────────────────────
const CREDENTIAL_REQUEST_PATTERNS = [
  /\b(send|share|give|provide|enter|type|reply\s+with)\b.*\b(otp|pin|password|passcode|cvv|cvc)\b/i,
  /\b(otp|pin|password|passcode)\b.*\b(send|share|give|provide|enter|type|reply)\b/i,
  /\byour\s+(otp|pin|password|verification\s+code)\s+is\b/i,
  /\benter\s+(the\s+)?(otp|pin|code|password)\b/i,
  // Urdu
  /\bاو\s*ٹی\s*پی\b/i,   // OTP in Urdu script
  /\bپن\b/,              // PIN in Urdu
  /\bپاس\s*ورڈ\b/,       // password in Urdu
];

// ── Scam / fraud wording ─────────────────────────────────────
const SCAM_KEYWORDS = [
  /\byou('ve|\s+have)\s+won\b/i,
  /\bcongratulations\b.*\b(winner|prize|selected|chosen)\b/i,
  /\bfree\s+(money|cash|gift|iphone|laptop)\b/i,
  /\bclaim\s+(your|now|free|prize)\b/i,
  /\blottery\b/i,
  /\bjackpot\b/i,
  /\bbenazir\s+(income|kafaalat)\b/i,     // Pakistani welfare scam impersonation
  /\behsaas\b.*\b(program|payment|fund)/i, // Ehsaas program scam
  /\bpm\s+(kissan|youth)\s+(loan|scheme)/i,
  /\binheritance\b.*\b(million|dollar|usd|pkr)\b/i,
  /\b(nigerian|foreign)\s+(prince|benefactor)\b/i,
  /\bwire\s+transfer\b.*\b(western\s+union|money\s*gram)\b/i,
  /\bclick\s+here\b.*\b(free|win|claim|now)\b/i,
];

// ── Government / bank impersonation ─────────────────────────
const IMPERSONATION_PATTERNS = [
  /\b(from|by)\b.*\b(government|govt|state\s+bank|sbp|fbr|nadra|fbr|pta)\b/i,
  /\b(hbl|meezan|ublb|mcb|allied|faysal|jazz|zong|telenor|easypaisa|jazzcash)\b.*\b(suspended|blocked|verify|update|confirm)/i,
  /\b(dear\s+customer|dear\s+user|dear\s+account\s+holder)\b/i,
  // Urdu impersonation
  /\bحکومت\b.*\bبینک\b/i,       // "government bank"
  /\bاسٹیٹ\s+بینک\b/i,           // "State Bank"
  /\bنوٹی فکیشن\b/i,             // "notification" in Urdu
];

// ── Pakistani phone-number patterns ──────────────────────────
const PK_PHONE_REGEX = /(?:\+92|0092|0)?3\d{2}[\s-]?\d{7}/;

const PK_PHONE_PREFIXES = {
  '0300': 'Jazz', '0301': 'Jazz', '0302': 'Jazz', '0303': 'Jazz',
  '0304': 'Jazz', '0305': 'Jazz', '0306': 'Jazz', '0307': 'Jazz',
  '0308': 'Jazz', '0309': 'Jazz',
  '0310': 'Zong', '0311': 'Zong', '0312': 'Zong', '0313': 'Zong',
  '0314': 'Zong', '0315': 'Zong', '0316': 'Zong', '0317': 'Zong',
  '0318': 'Zong', '0319': 'Zong',
  '0320': 'Ufone', '0321': 'Ufone', '0322': 'Ufone', '0323': 'Ufone',
  '0324': 'Ufone', '0325': 'Ufone', '0326': 'Ufone',
  '0330': 'Ufone', '0331': 'Ufone', '0332': 'Ufone', '0333': 'Ufone',
  '0340': 'Telenor', '0341': 'Telenor', '0342': 'Telenor', '0343': 'Telenor',
  '0344': 'Telenor', '0345': 'Telenor', '0346': 'Telenor', '0347': 'Telenor',
  '0348': 'Telenor', '0349': 'Telenor',
  '0355': 'Scom', '0356': 'Scom',
};

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

/** Extract domain from a URL string */
function extractDomain(input) {
  try {
    // Add scheme if missing for URL parsing
    const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const url = new URL(normalized);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Check if a domain is a URL shortener */
function isUrlShortener(domain) {
  if (!domain) return false;
  return URL_SHORTENERS.some(s => domain === s || domain.endsWith('.' + s));
}

/** Check for lookalike domains (typosquatting, impersonation) */
function checkLookalike(domain) {
  if (!domain) return null;
  // Strip TLD and check the name part
  const namePart = domain.replace(/\.[^.]+$/, '').replace(/^www\./, '');

  for (const target of LOOKALIKE_TARGETS) {
    if (namePart === target) continue; // exact match is not lookalike

    // Levenshtein-like: check for close matches
    // Simple heuristic: contains target + extra chars, or target with digit substitutions
    const withDigits = namePart.replace(/[0-9]/g, (d) => {
      const map = { '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b' };
      return map[d] || d;
    });

    if (namePart.includes(target) && namePart !== target) {
      return { target, reason: `Domain contains "${target}" with extra characters` };
    }
    if (withDigits.includes(target) && namePart !== target) {
      return { target, reason: `Domain uses digit substitutions to mimic "${target}"` };
    }
  }
  return null;
}

/** Check if domain uses a suspicious TLD */
function hasSuspiciousTld(domain) {
  if (!domain) return false;
  return SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld));
}

/** Check if domain is in the trusted list */
function isTrustedDomain(domain) {
  if (!domain) return false;
  return TRUSTED_DOMAINS.some(td => domain === td || domain.endsWith('.' + td));
}

/** Normalize input for analysis */
function normalize(input) {
  return input.trim().replace(/\s+/g, ' ');
}

// ─────────────────────────────────────────────────────────────
//  Main rule analysis function
// ─────────────────────────────────────────────────────────────

/**
 * Run all deterministic heuristic checks on user input.
 *
 * @param {string} input     - Raw user input
 * @param {string} inputType - "text" | "link" | "message"
 * @returns {{
 *   ruleScore: number,          // 0-100 risk score from rules alone
 *   verdict: string,            // "SAFE" | "SUSPICIOUS" | "DANGEROUS"
 *   indicators: string[],       // human-readable threat indicators
 *   redactedInput: string       // input with sensitive data redacted
 * }}
 */
function analyzeWithRules(input, inputType) {
  const text = normalize(input);
  const lower = text.toLowerCase();
  const indicators = [];
  let riskPoints = 0; // accumulate risk; mapped to 0-100 at the end

  // ── 1. URL analysis ──────────────────────────────────────
  const urlMatch = text.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/i) ||
                   (inputType === 'link' ? text.match(/[a-z0-9-]+\.[a-z]{2,}(?:\/\S*)?/i) : null);
  let domain = null;

  if (urlMatch) {
    domain = extractDomain(urlMatch[0]);

    if (domain) {
      // URL shortener
      if (isUrlShortener(domain)) {
        indicators.push(`URL uses a link shortener (${domain}) — hides the real destination`);
        riskPoints += 15;
      }

      // Suspicious TLD
      if (hasSuspiciousTld(domain)) {
        const tld = SUSPICIOUS_TLDS.find(t => domain.endsWith(t));
        indicators.push(`Domain uses a suspicious TLD (${tld})`);
        riskPoints += 15;
      }

      // Lookalike
      const lookalike = checkLookalike(domain);
      if (lookalike) {
        indicators.push(`Domain mimics "${lookalike.target}": ${lookalike.reason}`);
        riskPoints += 25;
      }

      // Trusted domain (reduces risk)
      if (isTrustedDomain(domain)) {
        riskPoints -= 20;
      }

      // No HTTPS
      if (urlMatch[0].startsWith('http://') && !urlMatch[0].startsWith('https://')) {
        indicators.push('Link uses HTTP instead of HTTPS (not encrypted)');
        riskPoints += 8;
      }

      // Excessive subdomains
      const subdomains = domain.split('.');
      if (subdomains.length > 4) {
        indicators.push('URL has an unusually high number of subdomains');
        riskPoints += 10;
      }

      // IP address as domain
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
        indicators.push('Link points to a raw IP address instead of a domain name');
        riskPoints += 20;
      }
    }
  }

  // ── 2. Urgent / panic language ───────────────────────────
  const urgencyHits = URGENCY_PATTERNS.filter(p => p.test(text));
  if (urgencyHits.length > 0) {
    indicators.push(`Message uses urgent/panic language (${urgencyHits.length} instance${urgencyHits.length > 1 ? 's' : ''})`);
    riskPoints += Math.min(20, urgencyHits.length * 8);
  }

  // ── 3. Credential / OTP requests ─────────────────────────
  const credHits = CREDENTIAL_REQUEST_PATTERNS.filter(p => p.test(text));
  if (credHits.length > 0) {
    indicators.push('Message asks for sensitive credentials (OTP/PIN/password)');
    riskPoints += 25;
  }

  // ── 4. Scam wording ──────────────────────────────────────
  const scamHits = SCAM_KEYWORDS.filter(p => p.test(text));
  if (scamHits.length > 0) {
    indicators.push(`Contains known scam/phrasing patterns (${scamHits.length} match${scamHits.length > 1 ? 'es' : ''})`);
    riskPoints += Math.min(25, scamHits.length * 10);
  }

  // ── 5. Government / bank impersonation ───────────────────
  const impHits = IMPERSONATION_PATTERNS.filter(p => p.test(text));
  if (impHits.length > 0) {
    indicators.push('Message may impersonate a government body or bank');
    riskPoints += 20;
  }

  // ── 6. Pakistani phone-number analysis ───────────────────
  if (inputType === 'text' || PK_PHONE_REGEX.test(text)) {
    const phoneMatch = text.match(PK_PHONE_REGEX);
    if (phoneMatch) {
      const rawPhone = phoneMatch[0].replace(/[\s-]/g, '');
      // Normalize to 03XX format
      let normalized = rawPhone;
      if (rawPhone.startsWith('+92')) normalized = '0' + rawPhone.slice(3);
      else if (rawPhone.startsWith('0092')) normalized = '0' + rawPhone.slice(4);

      const prefix = normalized.slice(0, 4);
      const carrier = PK_PHONE_PREFIXES[prefix];

      if (carrier) {
        indicators.push(`Pakistani mobile number detected (${carrier} network) — heuristic only, not a verified scam report`);
      } else {
        indicators.push('Pakistani mobile number detected — unable to identify carrier');
      }
      // Phone number alone is weak evidence
      riskPoints += 5;
    }
  }

  // ── 7. Suspicious link patterns in the URL path ──────────
  if (urlMatch) {
    const urlPath = urlMatch[0].toLowerCase();
    if (/(?:login|verify|secure|update|confirm|account|banking)/i.test(urlPath) && domain && !isTrustedDomain(domain)) {
      indicators.push('URL path contains sensitive action keywords on an untrusted domain');
      riskPoints += 12;
    }
  }

  // ── 8. Excessive punctuation / ALL CAPS ──────────────────
  const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(text.length, 1);
  if (capsRatio > 0.5 && text.length > 20) {
    indicators.push('Message uses excessive capital letters (shouting)');
    riskPoints += 5;
  }

  // ── Map accumulated points to 0-100 scale ────────────────
  const ruleScore = Math.max(0, Math.min(100, riskPoints * 1.2));

  let verdict;
  if (ruleScore <= 30) verdict = 'SAFE';
  else if (ruleScore <= 70) verdict = 'SUSPICIOUS';
  else verdict = 'DANGEROUS';

  // Build a redacted version for LLM use
  const { redactSensitive } = require('./redact');
  const redactedInput = redactSensitive(text);

  return {
    ruleScore: Math.round(ruleScore),
    verdict,
    indicators,
    redactedInput,
  };
}

/**
 * Normalize a Pakistani phone number to 03XX format.
 * Accepts: 03001234567, +923001234567, 00923001234567, with spaces/dashes.
 *
 * @param {string} raw
 * @returns {{ normalized: string|null, international: string|null, valid: boolean }}
 */
function normalizePhoneNumber(raw) {
  if (!raw || typeof raw !== 'string') return { normalized: null, international: null, valid: false };

  const stripped = raw.replace(/[\s\-()]/g, '');

  let local = null;
  if (/^\+92\d{10}$/.test(stripped)) {
    local = '0' + stripped.slice(3);
  } else if (/^0092\d{10}$/.test(stripped)) {
    local = '0' + stripped.slice(4);
  } else if (/^0\d{10}$/.test(stripped)) {
    local = stripped;
  } else if (/^92\d{10}$/.test(stripped)) {
    local = '0' + stripped.slice(2);
  } else if (/^3\d{9}$/.test(stripped)) {
    local = '0' + stripped;
  }

  if (!local || !/^03\d{9}$/.test(local)) {
    return { normalized: null, international: null, valid: false };
  }

  return {
    normalized: local,
    international: '+92' + local.slice(1),
    valid: true,
  };
}

/**
 * Analyze a Pakistani phone number for risk.
 *
 * @param {string} phoneNumber - Raw phone input
 * @returns {{
 *   normalized_number: string|null,
 *   international: string|null,
 *   valid: boolean,
 *   carrier: string|null,
 *   risk_score: number,
 *   verdict: string,
 *   reason: string,
 *   reason_roman_urdu: string,
 *   community_reports: number,
 * }}
 */
function analyzePhoneNumber(phoneNumber) {
  const { normalized, international, valid } = normalizePhoneNumber(phoneNumber);

  if (!valid) {
    return {
      normalized_number: null,
      international: null,
      valid: false,
      carrier: null,
      risk_score: 0,
      verdict: 'SAFE',
      reason: 'This does not match a valid Pakistani mobile number format.',
      reason_roman_urdu: 'Yeh Pakistani mobile number ke format se match nahi karta.',
      community_reports: 0,
    };
  }

  const prefix = normalized.slice(0, 4);
  const carrier = PK_PHONE_PREFIXES[prefix] || null;

  let riskPoints = 0;
  const reasons = [];
  const reasonsUr = [];

  if (carrier) {
    reasons.push(`Valid Pakistani mobile number on the ${carrier} network.`);
    reasonsUr.push(`Yeh ${carrier} network ka valid Pakistani number hai.`);
  } else {
    reasons.push('Valid Pakistani mobile number format, but carrier could not be identified.');
    reasonsUr.push('Format valid hai lekin carrier ki shanakht nahi ho saki.');
    riskPoints += 5;
  }

  // Known demo/scam numbers for testing
  const KNOWN_SCAM_NUMBERS = ['03001234567', '03119876543'];
  if (KNOWN_SCAM_NUMBERS.includes(normalized)) {
    riskPoints += 40;
    reasons.push('This number matches a known demo scam number.');
    reasonsUr.push('Yeh number mashhoor demo scam number se match karta hai.');
  }

  const score = Math.max(0, Math.min(100, Math.round(riskPoints * 1.2)));
  let verdict;
  if (score <= 30) verdict = 'SAFE';
  else if (score <= 70) verdict = 'SUSPICIOUS';
  else verdict = 'DANGEROUS';

  let reason, reasonUr;
  if (score === 0) {
    reason = 'No known risk found for this number.';
    reasonUr = 'Is number ka koi mashhoor khatra nahi mila.';
  } else {
    reason = reasons.join(' ');
    reasonUr = reasonsUr.join(' ');
  }

  return {
    normalized_number: normalized,
    international,
    valid: true,
    carrier,
    risk_score: score,
    verdict,
    reason,
    reason_roman_urdu: reasonUr,
    community_reports: 0,
  };
}

module.exports = {
  analyzeWithRules,
  analyzePhoneNumber,
  normalizePhoneNumber,
  extractDomain,
  isUrlShortener,
  checkLookalike,
  hasSuspiciousTld,
  isTrustedDomain,
  PK_PHONE_REGEX,
  PK_PHONE_PREFIXES,
};
