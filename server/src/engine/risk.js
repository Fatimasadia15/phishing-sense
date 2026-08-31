// ─────────────────────────────────────────────────────────────
//  Canonical Risk Bands
// ─────────────────────────────────────────────────────────────

const SAFE_MAX_SCORE = 30;
const SUSPICIOUS_MAX_SCORE = 70;
const DANGEROUS_MIN_SCORE = 71;

function clampRiskScore(score) {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function verdictForScore(score) {
  const normalizedScore = clampRiskScore(score);
  if (normalizedScore <= SAFE_MAX_SCORE) return 'SAFE';
  if (normalizedScore <= SUSPICIOUS_MAX_SCORE) return 'SUSPICIOUS';
  return 'DANGEROUS';
}

function isScoreAlignedWithVerdict(score, verdict) {
  return verdictForScore(score) === verdict;
}

module.exports = {
  SAFE_MAX_SCORE,
  SUSPICIOUS_MAX_SCORE,
  DANGEROUS_MIN_SCORE,
  clampRiskScore,
  verdictForScore,
  isScoreAlignedWithVerdict,
};
