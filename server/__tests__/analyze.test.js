// ─────────────────────────────────────────────────────────────
//  Backend Tests — Node.js built-in test runner
//  Run with: node --test __tests__/analyze.test.js
// ─────────────────────────────────────────────────────────────

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { analyzeWithRules, extractDomain, isUrlShortener, checkLookalike, hasSuspiciousTld, isTrustedDomain } = require('../src/engine/rules');
const { redactSensitive, containsSensitiveData } = require('../src/engine/redact');
const { validateLlmOutput } = require('../src/engine/llm');
const { combineResults } = require('../src/engine/combine');

// ═════════════════════════════════════════════════════════════
//  1. Redaction tests
// ═════════════════════════════════════════════════════════════

describe('redactSensitive', () => {
  it('redacts OTP values', () => {
    const result = redactSensitive('Your OTP is 123456');
    assert.ok(!result.includes('123456'));
    assert.ok(result.includes('[REDACTED]'));
  });

  it('redacts PIN values', () => {
    const result = redactSensitive('Enter your pin: 4321');
    assert.ok(!result.includes('4321'));
  });

  it('redacts CNIC numbers', () => {
    const result = redactSensitive('My CNIC is 35202-1234567-1');
    assert.ok(result.includes('[CNIC-REDACTED]'));
  });

  it('redacts credit card numbers', () => {
    const result = redactSensitive('Card: 4111 1111 1111 1111');
    assert.ok(result.includes('[CARD-REDACTED]'));
  });

  it('does not redact safe content', () => {
    const result = redactSensitive('Check this link https://google.com');
    assert.ok(result.includes('google.com'));
  });
});

describe('containsSensitiveData', () => {
  it('detects OTP patterns', () => {
    assert.ok(containsSensitiveData('Your OTP is 123456'));
  });

  it('detects CNIC', () => {
    assert.ok(containsSensitiveData('CNIC 35202-1234567-1'));
  });

  it('returns false for safe text', () => {
    assert.ok(!containsSensitiveData('Hello world'));
  });
});

// ═════════════════════════════════════════════════════════════
//  2. Rule engine tests
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
//  3. LLM validation tests
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
//  4. Combination logic tests
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
