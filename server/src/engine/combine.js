// ─────────────────────────────────────────────────────────────
//  Risk Combination Logic
//  Merges rule-based and LLM results with a safety-biased policy.
// ─────────────────────────────────────────────────────────────

/**
 * Combine rule-based and LLM analysis into a final result.
 *
 * Safety-biased policy:
 *  - If the rule engine says DANGEROUS, the final verdict is at least SUSPICIOUS
 *  - If both engines agree, use the higher score
 *  - If they disagree, take the higher (more cautious) score
 *  - If the LLM is unavailable, use rule results alone
 *
 * @param {object} ruleResult
 * @param {object|null} llmResult
 * @returns {object} - Final normalized response
 */
function combineResults(ruleResult, llmResult) {
  // If no LLM result, return rule-based analysis
  if (!llmResult) {
    return {
      risk_score: ruleResult.ruleScore,
      verdict: ruleResult.verdict,
      explanation_en: buildExplanationEn(ruleResult),
      explanation_roman_urdu: buildExplanationRomanUrdu(ruleResult),
      threat_indicators: ruleResult.indicators,
      source: 'rule_engine',
    };
  }

  // Safety-biased combination
  // Take the higher (more cautious) score
  let finalScore = Math.max(ruleResult.ruleScore, llmResult.risk_score);

  // If rule engine found strong danger, don't let LLM downgrade below SUSPICIOUS
  if (ruleResult.ruleScore >= 71 && llmResult.risk_score < 31) {
    finalScore = Math.max(finalScore, 40); // at least SUSPICIOUS
  }

  // Merge threat indicators (deduplicated)
  const allIndicators = [...new Set([
    ...ruleResult.indicators,
    ...llmResult.threat_indicators,
  ])];

  // Determine verdict from final score
  let verdict;
  if (finalScore <= 30) verdict = 'SAFE';
  else if (finalScore <= 70) verdict = 'SUSPICIOUS';
  else verdict = 'DANGEROUS';

  // Use LLM explanations if available (they're richer), else generate from rules
  const explanation_en = llmResult.explanation_en || buildExplanationEn(ruleResult);
  const explanation_roman_urdu = llmResult.explanation_roman_urdu || buildExplanationRomanUrdu(ruleResult);

  return {
    risk_score: finalScore,
    verdict,
    explanation_en,
    explanation_roman_urdu,
    threat_indicators: allIndicators,
    source: 'combined',
  };
}

/**
 * Build English explanation from rule-based indicators.
 */
function buildExplanationEn(ruleResult) {
  if (ruleResult.indicators.length === 0) {
    return '• No significant phishing indicators were detected in this content.';
  }
  return ruleResult.indicators.map(i => `• ${i}`).join('\n');
}

/**
 * Build Roman Urdu explanation from rule-based indicators.
 */
function buildExplanationRomanUrdu(ruleResult) {
  if (ruleResult.indicators.length === 0) {
    return '• Is content mein koi phishing ya scam ki nishani nahi mili.';
  }

  // Map common indicators to Roman Urdu equivalents
  const urduMap = {
    'URL uses a link shortener': 'Link ek shortener use karta hai — asli manzil chhupi hui hai',
    'Domain uses a suspicious TLD': 'Domain ka extension mashkook hai',
    'Domain mimics': 'Domain kisi mashhoor website ki naqal kar raha hai',
    'urgent/panic language': 'Message mein jaldi ya ghabrahat ki zaban istemal hui hai',
    'credentials (OTP/PIN/password)': 'OTP, PIN, ya password maanga ja raha hai',
    'scam/phrasing patterns': 'Yeh scam ya fraud ki mashhoor zaban hai',
    'impersonate': 'Kisi sarkari idare ya bank ka roop dhara ja raha hai',
    'Pakistani mobile number': 'Pakistani mobile number mila — yeh sirf andaza hai, pakka scam nahi',
    'HTTP instead of HTTPS': 'Link HTTPS ke bajaye HTTP use karta hai — mehfooz nahi',
  };

  return ruleResult.indicators.map(indicator => {
    for (const [key, urdu] of Object.entries(urduMap)) {
      if (indicator.includes(key)) return `• ${urdu}`;
    }
    return `• ${indicator}`;
  }).join('\n');
}

module.exports = { combineResults };
