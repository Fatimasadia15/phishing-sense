// ─────────────────────────────────────────────────────────────
//  POST /api/check-number — Pakistani Phone Number Check
// ─────────────────────────────────────────────────────────────

const { analyzePhoneNumber, normalizePhoneNumber } = require('../engine/rules');
const { getCommunityReportCount } = require('./community');

async function handleCheckNumber(req, res) {
  try {
    const { phone_number } = req.body;
    const { normalized } = normalizePhoneNumber(phone_number);
    const communityReports = normalized
      ? await getCommunityReportCount(normalized)
      : 0;
    const result = analyzePhoneNumber(phone_number, communityReports);

    res.json(result);
  } catch (err) {
    console.error('[check-number] Unexpected error:', err.message);
    res.status(500).json({ error: 'Number check failed. Please try again.' });
  }
}

module.exports = { handleCheckNumber };
