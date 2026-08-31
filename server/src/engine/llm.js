// ─────────────────────────────────────────────────────────────
//  LLM Integration Layer
//  Calls an OpenAI-compatible API for multilingual analysis.
//  Falls back gracefully when the LLM is unavailable.
// ─────────────────────────────────────────────────────────────

const { clampRiskScore, isScoreAlignedWithVerdict } = require('./risk');

const SYSTEM_PROMPT = `You are Phishing Sense, an AI safety assistant for Pakistan.
You analyze suspicious text, messages, links, and phone numbers for fraud risk.
You understand English, Urdu (اردو), and Roman Urdu.

IMPORTANT RULES:
- Never ask for passwords, PINs, or OTPs.
- Never claim a phone number is definitively fraudulent based only on heuristics.
- Keep explanations concise and in plain language suitable for non-technical users.
- Explain risks in terms a senior citizen can understand.

Respond ONLY with valid JSON in this exact format:
{
  "risk_score": <integer 0-100>,
  "verdict": "<SAFE|SUSPICIOUS|DANGEROUS>",
  "explanation_en": "<bullet points in English>",
  "explanation_roman_urdu": "<bullet points in Roman Urdu>",
  "threat_indicators": ["<indicator 1>", "<indicator 2>"]
}

Risk buckets:
- 0-30 = SAFE
- 31-70 = SUSPICIOUS
- 71-100 = DANGEROUS`;

/**
 * Validate and sanitize LLM output.
 * Returns null if output is invalid/unusable.
 */
function validateLlmOutput(raw) {
  try {
    // Parse if it's a string
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    // Validate required fields
    if (typeof parsed.risk_score !== 'number' || !Number.isFinite(parsed.risk_score)) return null;
    if (parsed.risk_score < 0 || parsed.risk_score > 100) return null;

    const validVerdicts = ['SAFE', 'SUSPICIOUS', 'DANGEROUS'];
    if (!validVerdicts.includes(parsed.verdict)) return null;

    const riskScore = clampRiskScore(parsed.risk_score);
    if (!isScoreAlignedWithVerdict(riskScore, parsed.verdict)) return null;

    return {
      risk_score: riskScore,
      verdict: parsed.verdict,
      explanation_en: String(parsed.explanation_en || '').slice(0, 2000),
      explanation_roman_urdu: String(parsed.explanation_roman_urdu || '').slice(0, 2000),
      threat_indicators: Array.isArray(parsed.threat_indicators)
        ? parsed.threat_indicators.map(String).slice(0, 10)
        : [],
    };
  } catch {
    return null;
  }
}

/**
 * Call the LLM for analysis.
 * Returns validated output or null on failure.
 *
 * @param {string} redactedInput - Input with sensitive data removed
 * @param {string} inputType     - "text" | "link" | "message"
 * @param {object} ruleResult    - Results from the rule engine (for context)
 * @returns {Promise<object|null>}
 */
async function callLlm(redactedInput, inputType, ruleResult) {
  const provider = process.env.LLM_PROVIDER || 'none';
  if (provider === 'none') return null;

  const apiKey = process.env.LLM_API_KEY;
  const apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
  const model  = process.env.LLM_MODEL  || 'gpt-4o-mini';

  if (!apiKey) {
    console.warn('[LLM] No API key configured — falling back to rules only');
    return null;
  }

  const userMessage = `Analyze this ${inputType} for phishing/scam risk:

"${redactedInput}"

Rule engine already found these indicators:
${ruleResult.indicators.length > 0 ? ruleResult.indicators.map(i => `- ${i}`).join('\n') : '- No strong indicators found by rules'}
Rule engine risk score: ${ruleResult.ruleScore}/100

Provide your independent analysis in the required JSON format.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[LLM] API returned ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('[LLM] Empty response from model');
      return null;
    }

    return validateLlmOutput(content);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[LLM] Request timed out after 15s');
    } else {
      console.error('[LLM] Error:', err.message);
    }
    return null;
  }
}

const SYSTEM_PROMPT_CHAT = `You are Sense AI, an expert AI safety and anti-scam assistant for Phishing Sense in Pakistan.
You provide clear, empowering, and actionable cybersecurity advice to users asking about phishing, fake messages, suspicious links, bank scams (HBL, Meezan, UBL, MCB, JazzCash, Easypaisa), BISP scams, OTP theft, and social media safety.

GUIDELINES:
- Answer the user's SPECIFIC question directly. Do not give generic stock responses.
- Match the language of the prompt: if asked in Urdu/Roman Urdu, respond in clear Roman Urdu or Urdu script. If asked in English, respond in English.
- Use simple, reassuring bullet points (max 3-4 points).
- Never ask for secrets (passwords, PINs, OTPs).
- If the user mentions a potential breach, provide emergency steps (call bank, freeze card, change password, report to FIA Cybercrime).`;

/**
 * Call LLM for Sense AI chat.
 * Returns response string or null on failure.
 */
async function callLlmChat(message, language = 'en') {
  const provider = process.env.LLM_PROVIDER || 'none';
  if (provider === 'none') return null;

  const apiKey = process.env.LLM_API_KEY;
  const apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
  const model  = process.env.LLM_MODEL  || 'gpt-4o-mini';

  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_CHAT },
          { role: 'user',   content: `[User Preferred Language: ${language}]\n\nQuestion: "${message}"` },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return content ? content.trim() : null;
  } catch {
    return null;
  }
}

module.exports = { callLlm, validateLlmOutput, SYSTEM_PROMPT, callLlmChat };

