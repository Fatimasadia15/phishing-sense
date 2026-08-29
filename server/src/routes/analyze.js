// ─────────────────────────────────────────────────────────────
//  POST /api/analyze — Route Handler
// ─────────────────────────────────────────────────────────────

const { analyzeWithRules } = require('../engine/rules');
const { callLlm }          = require('../engine/llm');
const { combineResults }   = require('../engine/combine');

/**
 * POST /api/analyze
 *
 * Body: { "input": "string", "input_type": "text|link|message" }
 *
 * Response:
 * {
 *   "risk_score": 0-100,
 *   "verdict": "SAFE" | "SUSPICIOUS" | "DANGEROUS",
 *   "explanation_en": "...",
 *   "explanation_roman_urdu": "...",
 *   "threat_indicators": ["..."],
 *   "source": "rule_engine" | "combined"
 * }
 */
async function handleAnalyze(req, res) {
  try {
    const { input, input_type } = req.body;

    // ── 1. Run rule-based engine ─────────────────────────────
    const ruleResult = analyzeWithRules(input, input_type);

    // ── 2. Attempt LLM analysis (uses redacted input) ────────
    let llmResult = null;
    try {
      llmResult = await callLlm(ruleResult.redactedInput, input_type, ruleResult);
    } catch (err) {
      console.error('[analyze] LLM call failed:', err.message);
      // Continue with rule-only result
    }

    // ── 3. Combine results ──────────────────────────────────
    const finalResult = combineResults(ruleResult, llmResult);

    // ── 4. Return response (strip internal fields) ──────────
    res.json({
      risk_score:         finalResult.risk_score,
      verdict:            finalResult.verdict,
      explanation_en:     finalResult.explanation_en,
      explanation_roman_urdu: finalResult.explanation_roman_urdu,
      threat_indicators:  finalResult.threat_indicators,
    });
  } catch (err) {
    console.error('[analyze] Unexpected error:', err.message);
    // Generic error — do not leak internals
    res.status(500).json({
      error: 'Analysis failed. Please try again.',
    });
  }
}

module.exports = { handleAnalyze };
