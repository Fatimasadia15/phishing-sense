// ─────────────────────────────────────────────────────────────
//  POST /api/check-number — Pakistani Phone Number Check
// ─────────────────────────────────────────────────────────────

const { analyzePhoneNumber } = require('../engine/rules');
const { getCommunityReportCount } = require('./community');

async function handleCheckNumber(req, res) {
  try {
    const { phone_number } = req.body;

    const result = analyzePhoneNumber(phone_number);

    if (result.normalized_number) {
      result.community_reports = await getCommunityReportCount(result.normalized_number);
    }

    res.json(result);
  } catch (err) {
    console.error('[check-number] Unexpected error:', err.message);
    res.status(500).json({ error: 'Number check failed. Please try again.' });
  }
}

module.exports = { handleCheckNumber };
