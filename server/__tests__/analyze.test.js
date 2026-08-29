// ─────────────────────────────────────────────────────────────
//  Backend Tests — Node.js built-in test runner
//  Run with: node --test __tests__/analyze.test.js
// ─────────────────────────────────────────────────────────────

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { analyzeWithRules, extractDomain, isUrlShortener, checkLookalike, hasSuspiciousTld, isTrustedDomain } = require('../src/engine/rules');
const { redactSensitive, containsSensitiveData, MASK } = require('../src/engine/redact');
const { validateLlmOutput } = require('../src/engine/llm');
const { combineResults } = require('../src/engine/combine');

// ═════════════════════════════════════════════════════════════
//  1. OTP masking
// ═════════════════════════════════════════════════════════════

describe('redactSensitive — OTP masking', () => {
  it('masks "OTP: 839201" → "OTP: ******"', () => {
    const result = redactSensitive('OTP: 839201');
    assert.ok(!result.includes('839201'), `Original OTP still present: ${result}`);
    assert.ok(result.includes(MASK), `Mask not found in: ${result}`);
    assert.ok(result.toLowerCase().includes('otp'), 'Keyword lost');
  });

  it('masks "Your OTP is 123456"', () => {
    const result = redactSensitive('Your OTP is 123456');
    assert.ok(!result.includes('123456'));
    assert.ok(result.includes(MASK));
  });

  it('masks "OTP = 9944" with equals separator', () => {
    const result = redactSensitive('OTP = 9944');
    assert.ok(!result.includes('9944'));
  });

  it('masks "verification code is 556677"', () => {
    const result = redactSensitive('Your verification code is 556677');
    assert.ok(!result.includes('556677'));
    assert.ok(result.includes(MASK));
  });

  it('masks "one-time code: 482910"', () => {
    const result = redactSensitive('Your one-time code: 482910');
    assert.ok(!result.includes('482910'));
  });

  it('masks case-insensitive "otp: 1234"', () => {
    const result = redactSensitive('otp: 1234');
    assert.ok(!result.includes('1234'));
  });
});

// ═════════════════════════════════════════════════════════════
//  2. PIN masking
// ═════════════════════════════════════════════════════════════

describe('redactSensitive — PIN masking', () => {
  it('masks "pin: 4321"', () => {
    const result = redactSensitive('Enter your pin: 4321');
    assert.ok(!result.includes('4321'));
    assert.ok(result.includes(MASK));
  });

  it('masks "PIN is 0000"', () => {
    const result = redactSensitive('Your PIN is 0000');
    assert.ok(!result.includes('0000'));
  });

  it('masks "passcode: ab12cd" (non-numeric password)', () => {
    const result = redactSensitive('passcode: ab12cd');
    assert.ok(!result.includes('ab12cd'));
    assert.ok(result.includes(MASK));
  });

  it('masks CVV "cvv: 321"', () => {
    const result = redactSensitive('Enter cvv: 321');
    assert.ok(!result.includes('321'));
  });
});

// ═════════════════════════════════════════════════════════════
//  3. Multiple sensitive values
// ═════════════════════════════════════════════════════════════

describe('redactSensitive — multiple sensitive values', () => {
  it('masks both OTP and PIN in the same text', () => {
    const result = redactSensitive('Your OTP is 839201 and your PIN is 4321');
    assert.ok(!result.includes('839201'), 'OTP not masked');
    assert.ok(!result.includes('4321'), 'PIN not masked');
  });

  it('masks OTP and CNIC together', () => {
    const result = redactSensitive('OTP: 123456, CNIC: 35202-1234567-1');
    assert.ok(!result.includes('123456'), 'OTP not masked');
    assert.ok(!result.includes('35202-1234567-1'), 'CNIC not masked');
    assert.ok(result.includes(MASK));
  });

  it('masks credit card and password together', () => {
    const result = redactSensitive('Card: 4111 1111 1111 1111, password: hunter2');
    assert.ok(!result.includes('4111'));
    assert.ok(!result.includes('hunter2'));
  });

  it('masks three OTP values in one message', () => {
    const text = 'OTP: 111111. Another code: 222222. Verify token: 333333';
    const result = redactSensitive(text);
    assert.ok(!result.includes('111111'));
    assert.ok(!result.includes('222222'));
    assert.ok(!result.includes('333333'));
  });
});

// ═════════════════════════════════════════════════════════════
//  4. URLs (should NOT be redacted)
// ═════════════════════════════════════════════════════════════

describe('redactSensitive — URLs', () => {
  it('does not redact a plain URL', () => {
    const result = redactSensitive('Check this link https://google.com');
    assert.ok(result.includes('google.com'));
  });

  it('does not redact a suspicious URL', () => {
    const url = 'https://paypal-secure-login.xyz/verify';
    const result = redactSensitive(url);
    assert.ok(result.includes(url), 'URL was incorrectly modified');
  });

  it('does not redact URL shortener links', () => {
    const result = redactSensitive('Click here: https://bit.ly/h8l-update');
    assert.ok(result.includes('bit.ly'));
  });

  it('preserves URL alongside masked OTP', () => {
    const text = 'Visit https://fake-bank.xyz/login and enter OTP: 123456';
    const result = redactSensitive(text);
    assert.ok(result.includes('fake-bank.xyz'), 'URL lost');
    assert.ok(!result.includes('123456'), 'OTP not masked');
  });
});

// ═════════════════════════════════════════════════════════════
//  5. Roman Urdu scam text
// ═════════════════════════════════════════════════════════════

describe('redactSensitive — Roman Urdu scam text', () => {
  it('preserves Roman Urdu scam message (no OTP)', () => {
    const text = 'Ap ko lottery nikli hai! Abhi rabta karein aur inaam hasil karein.';
    const result = redactSensitive(text);
    assert.equal(result, text, 'Non-sensitive text was modified');
  });

  it('masks OTP in Roman Urdu context', () => {
    const text = 'Apna OTP 567890 share karein verification ke liye';
    const result = redactSensitive(text);
    assert.ok(!result.includes('567890'), 'OTP not masked in Urdu text');
    assert.ok(result.includes('OTP'));
  });

  it('preserves BISP scam text without sensitive data', () => {
    const text = 'Benazir Income Support Programme se apki qist aa gayi hai. 8171 par SMS karein.';
    const result = redactSensitive(text);
    assert.equal(result, text);
  });

  it('masks CNIC in Urdu/Roman context', () => {
    const text = 'Apna CNIC 42101-7654321-0 bhejain';
    const result = redactSensitive(text);
    assert.ok(!result.includes('42101-7654321-0'));
    assert.ok(result.includes(MASK));
  });
});

// ═════════════════════════════════════════════════════════════
//  6. Ordinary safe messages
// ═════════════════════════════════════════════════════════════

describe('redactSensitive — ordinary safe messages', () => {
  it('does not modify "Hello, how are you?"', () => {
    const text = 'Hello, how are you?';
    assert.equal(redactSensitive(text), text);
  });

  it('does not modify a plain URL', () => {
    const text = 'https://www.google.com/search?q=weather';
    assert.equal(redactSensitive(text), text);
  });

  it('does not modify a short safe sentence', () => {
    const text = 'The meeting is at 3pm tomorrow.';
    assert.equal(redactSensitive(text), text);
  });

  it('does not flag short numbers without keywords', () => {
    const text = 'Call me at 555-1234';
    const result = redactSensitive(text);
    assert.ok(result.includes('555-1234'), 'Non-sensitive number was masked');
  });
});

// ═════════════════════════════════════════════════════════════
//  7. Malformed input
// ═════════════════════════════════════════════════════════════

describe('redactSensitive — malformed input', () => {
  it('handles null gracefully', () => {
    assert.equal(redactSensitive(null), '');
  });

  it('handles undefined gracefully', () => {
    assert.equal(redactSensitive(undefined), '');
  });

  it('handles number input gracefully', () => {
    assert.equal(redactSensitive(42), '');
  });

  it('handles object input gracefully', () => {
    assert.equal(redactSensitive({ otp: '123' }), '');
  });

  it('handles text with only digits (no keyword)', () => {
    const result = redactSensitive('123456');
    // No keyword context → digits stay (conservative approach)
    assert.equal(result, '123456');
  });

  it('handles text with special characters', () => {
    const text = 'OTP: 123456 <script>alert("xss")</script>';
    const result = redactSensitive(text);
    assert.ok(!result.includes('123456'));
    // Script tag is preserved (redaction is not sanitization)
    assert.ok(result.includes('<script>'));
  });
});

// ═════════════════════════════════════════════════════════════
//  8. Empty input
// ═════════════════════════════════════════════════════════════

describe('redactSensitive — empty input', () => {
  it('returns empty string for empty string input', () => {
    assert.equal(redactSensitive(''), '');
  });

  it('returns empty string for whitespace-only input', () => {
    const result = redactSensitive('   ');
    assert.equal(result, '   ');
  });
});

// ═════════════════════════════════════════════════════════════
//  9. containsSensitiveData detection
// ═════════════════════════════════════════════════════════════

describe('containsSensitiveData', () => {
  it('detects OTP patterns', () => {
    assert.ok(containsSensitiveData('Your OTP is 123456'));
  });

  it('detects CNIC', () => {
    assert.ok(containsSensitiveData('CNIC 35202-1234567-1'));
  });

  it('detects credit card numbers', () => {
    assert.ok(containsSensitiveData('Card: 4111 1111 1111 1111'));
  });

  it('detects password key-value pairs', () => {
    assert.ok(containsSensitiveData('password: mySecret123'));
  });

  it('returns false for safe text', () => {
    assert.ok(!containsSensitiveData('Hello world'));
  });

  it('returns false for empty input', () => {
    assert.ok(!containsSensitiveData(''));
  });

  it('returns false for null', () => {
    assert.ok(!containsSensitiveData(null));
  });

  it('is deterministic — same result on repeated calls', () => {
    const text = 'Your OTP is 998877';
    const r1 = containsSensitiveData(text);
    const r2 = containsSensitiveData(text);
    const r3 = containsSensitiveData(text);
    assert.equal(r1, r2);
    assert.equal(r2, r3);
    assert.ok(r1);
  });

  it('returns false for URL without secrets', () => {
    assert.ok(!containsSensitiveData('https://google.com'));
  });
});

// ═════════════════════════════════════════════════════════════
//  10. Redaction determinism
// ═════════════════════════════════════════════════════════════

describe('redactSensitive — determinism', () => {
  it('produces identical output for same input (idempotent)', () => {
    const text = 'OTP: 839201, PIN: 4321, CNIC: 35202-1234567-1';
    const r1 = redactSensitive(text);
    const r2 = redactSensitive(text);
    assert.equal(r1, r2);
  });

  it('double-redaction does not change already-redacted text', () => {
    const text = 'OTP: 839201';
    const once = redactSensitive(text);
    const twice = redactSensitive(once);
    assert.equal(once, twice, `Double redaction changed output: "${once}" → "${twice}"`);
  });
});

// ═════════════════════════════════════════════════════════════
//  11. Rule engine tests
// ═════════════════════════════════════════════════════════════

describe('extractDomain', () => {
  it('extracts domain from https URL', () => {
    assert.equal(extractDomain('https://paypal-secure.xyz/login'), 'paypal-secure.xyz');
  });

  it('extracts domain from http URL', () => {
    assert.equal(extractDomain('http://bit.ly/abc'), 'bit.ly');
  });

  it('handles bare domain', () => {
    assert.equal(extractDomain('google.com/path'), 'google.com');
  });

  it('returns null for invalid input', () => {
    assert.equal(extractDomain('not a url at all with no dots'), null);
  });
});

describe('isUrlShortener', () => {
  it('detects bit.ly', () => {
    assert.ok(isUrlShortener('bit.ly'));
  });

  it('detects tinyurl.com', () => {
    assert.ok(isUrlShortener('tinyurl.com'));
  });

  it('rejects normal domains', () => {
    assert.ok(!isUrlShortener('google.com'));
  });
});

describe('checkLookalike', () => {
  it('detects paypal with extra chars', () => {
    const result = checkLookalike('paypal-secure-login.xyz');
    assert.ok(result !== null);
    assert.equal(result.target, 'paypal');
  });

  it('detects digit substitution', () => {
    const result = checkLookalike('paypa1.com');
    assert.ok(result !== null);
  });

  it('does not flag exact brand match', () => {
    const result = checkLookalike('paypal.com');
    assert.equal(result, null);
  });
});

describe('hasSuspiciousTld', () => {
  it('detects .xyz', () => {
    assert.ok(hasSuspiciousTld('example.xyz'));
  });

  it('detects .tk', () => {
    assert.ok(hasSuspiciousTld('free.tk'));
  });

  it('rejects .com', () => {
    assert.ok(!hasSuspiciousTld('example.com'));
  });
});

describe('isTrustedDomain', () => {
  it('trusts google.com', () => {
    assert.ok(isTrustedDomain('google.com'));
  });

  it('trusts hbl.com', () => {
    assert.ok(isTrustedDomain('hbl.com'));
  });

  it('rejects paypal-secure.xyz', () => {
    assert.ok(!isTrustedDomain('paypal-secure.xyz'));
  });
});

describe('analyzeWithRules — full analysis', () => {
  it('flags a phishing URL as dangerous', () => {
    const result = analyzeWithRules('Your account has been suspended. Verify now at https://paypal-secure-login.xyz/verify', 'message');
    assert.ok(result.ruleScore > 30, `Expected risk > 30, got ${result.ruleScore}`);
    assert.ok(result.indicators.length > 0);
  });

  it('flags a trusted URL as safe', () => {
    const result = analyzeWithRules('https://www.google.com', 'link');
    assert.equal(result.verdict, 'SAFE');
  });

  it('detects urgency language', () => {
    const result = analyzeWithRules('URGENT: Your account will be suspended immediately. Act now!', 'message');
    assert.ok(result.indicators.some(i => i.includes('urgent/panic')));
  });

  it('detects OTP request', () => {
    const result = analyzeWithRules('Please send your OTP code to verify your account', 'message');
    assert.ok(result.indicators.some(i => i.includes('credentials') || i.includes('OTP')));
  });

  it('detects Pakistani phone number', () => {
    const result = analyzeWithRules('Call me at +92 300 1234567', 'text');
    assert.ok(result.indicators.some(i => i.includes('Pakistani mobile')));
  });

  it('detects scam wording (prize)', () => {
    const result = analyzeWithRules('Congratulations you are the winner! Claim your free prize now!', 'message');
    assert.ok(result.indicators.some(i => i.includes('scam') || i.includes('prize')));
  });

  it('detects bank impersonation', () => {
    const result = analyzeWithRules('Dear Customer, your HBL account has been suspended. Verify now.', 'message');
    assert.ok(result.indicators.some(i => i.includes('impersonate') || i.includes('HBL') || i.includes('hbl')));
  });

  it('detects URL shortener', () => {
    const result = analyzeWithRules('Click here: https://bit.ly/h8l-update', 'link');
    assert.ok(result.indicators.some(i => i.includes('shortener')));
  });
});

// ═════════════════════════════════════════════════════════════
//  12. LLM validation tests
// ═════════════════════════════════════════════════════════════

describe('validateLlmOutput', () => {
  it('accepts valid output', () => {
    const valid = {
      risk_score: 85,
      verdict: 'DANGEROUS',
      explanation_en: 'This is dangerous',
      explanation_roman_urdu: 'Yeh khatarnaak hai',
      threat_indicators: ['urgency', 'lookalike domain'],
    };
    const result = validateLlmOutput(valid);
    assert.ok(result !== null);
    assert.equal(result.risk_score, 85);
    assert.equal(result.verdict, 'DANGEROUS');
  });

  it('rejects mismatched score and verdict', () => {
    const bad = { risk_score: 10, verdict: 'DANGEROUS', explanation_en: '', explanation_roman_urdu: '', threat_indicators: [] };
    const result = validateLlmOutput(bad);
    assert.equal(result, null);
  });

  it('rejects out-of-range score', () => {
    const bad = { risk_score: 150, verdict: 'DANGEROUS', explanation_en: '', explanation_roman_urdu: '', threat_indicators: [] };
    const result = validateLlmOutput(bad);
    assert.equal(result, null);
  });

  it('rejects invalid JSON', () => {
    const result = validateLlmOutput('not json at all');
    assert.equal(result, null);
  });

  it('rejects missing risk_score', () => {
    const bad = { verdict: 'SAFE', explanation_en: '', explanation_roman_urdu: '', threat_indicators: [] };
    const result = validateLlmOutput(bad);
    assert.equal(result, null);
  });
});

// ═════════════════════════════════════════════════════════════
//  13. Combination logic tests
// ═════════════════════════════════════════════════════════════

describe('combineResults', () => {
  it('returns rule-only result when LLM is null', () => {
    const ruleResult = { ruleScore: 65, verdict: 'SUSPICIOUS', indicators: ['urgency language'] };
    const result = combineResults(ruleResult, null);
    assert.equal(result.risk_score, 65);
    assert.equal(result.verdict, 'SUSPICIOUS');
    assert.equal(result.source, 'rule_engine');
  });

  it('takes higher score when combining', () => {
    const ruleResult = { ruleScore: 40, verdict: 'SUSPICIOUS', indicators: ['suspicious TLD'] };
    const llmResult = { risk_score: 75, verdict: 'DANGEROUS', explanation_en: 'Danger', explanation_roman_urdu: 'Khatra', threat_indicators: ['phishing'] };
    const result = combineResults(ruleResult, llmResult);
    assert.equal(result.risk_score, 75);
    assert.equal(result.verdict, 'DANGEROUS');
    assert.equal(result.source, 'combined');
  });

  it('prevents LLM from fully downgrading rule-based danger', () => {
    const ruleResult = { ruleScore: 80, verdict: 'DANGEROUS', indicators: ['lookalike domain', 'urgency'] };
    const llmResult = { risk_score: 10, verdict: 'SAFE', explanation_en: 'Looks ok', explanation_roman_urdu: 'Theek lagta hai', threat_indicators: [] };
    const result = combineResults(ruleResult, llmResult);
    assert.ok(result.risk_score >= 40, `Expected score >= 40, got ${result.risk_score}`);
    assert.notEqual(result.verdict, 'SAFE');
  });

  it('merges indicators from both sources', () => {
    const ruleResult = { ruleScore: 50, verdict: 'SUSPICIOUS', indicators: ['urgency'] };
    const llmResult = { risk_score: 55, verdict: 'SUSPICIOUS', explanation_en: 'Suspicious', explanation_roman_urdu: 'Mashkook', threat_indicators: ['social engineering'] };
    const result = combineResults(ruleResult, llmResult);
    assert.ok(result.threat_indicators.includes('urgency'));
    assert.ok(result.threat_indicators.includes('social engineering'));
  });

  it('generates Roman Urdu explanation when LLM is unavailable', () => {
    const ruleResult = { ruleScore: 0, verdict: 'SAFE', indicators: [] };
    const result = combineResults(ruleResult, null);
    assert.ok(result.explanation_roman_urdu.length > 0);
  });
});
