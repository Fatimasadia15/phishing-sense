// ─────────────────────────────────────────────────────────────
//  POST /api/analyze — Route Handler
// ─────────────────────────────────────────────────────────────

const crypto = require('crypto');
const { analyzeWithRules } = require('../engine/rules');
const { callLlm }          = require('../engine/llm');
const { combineResults }   = require('../engine/combine');
const { supabase, isAvailable } = require('../db/supabase');
const { getUserFromToken } = require('../middleware/auth');

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

    // ── 4. Persist scan for authenticated users ─────────────
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = token ? await getUserFromToken(token) : null;

    if (user && isAvailable()) {
      try {
        const inputHash = crypto.createHash('sha256').update(input).digest('hex');
        await supabase.from('scan_history').insert({
          user_id:    user.id,
          input_hash: inputHash,
          input_type,
          risk_score: finalResult.risk_score,
          verdict:    finalResult.verdict,
          details:    {
            content_preview:    input.slice(0, 200),
            explanation_en:     finalResult.explanation_en,
            explanation_roman_urdu: finalResult.explanation_roman_urdu,
            threat_indicators:  finalResult.threat_indicators,
            source:             finalResult.source,
          },
        });
      } catch (persistErr) {
        // Never fail the analysis response because persistence failed
        console.error('[analyze] Failed to persist scan:', persistErr.message);
      }
    }

    // ── 5. Return response (strip internal fields) ──────────
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
