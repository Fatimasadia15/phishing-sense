// ─────────────────────────────────────────────────────────────
//  /api/history — Authenticated scan history routes
// ─────────────────────────────────────────────────────────────

const crypto = require('crypto');
const { supabase, isAvailable } = require('../db/supabase');

function hashInput(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * GET /api/history
 *
 * Query: ?limit=50&offset=0
 * Returns the authenticated user's scan history ordered newest first.
 */
async function handleGetHistory(req, res) {
  if (!isAvailable()) {
    return res.status(503).json({ error: 'Database unavailable.' });
  }

  const userId = req.user.id;
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

  const { data, error } = await supabase
    .from('scan_history')
    .select('id, input_hash, input_type, risk_score, verdict, details, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[history] GET failed:', error.message);
    return res.status(500).json({ error: 'Could not load scan history.' });
  }

  res.json({ history: data || [] });
}

/**
 * POST /api/history
 *
 * Body: { input, input_type, risk_score, verdict, details }
 * Persists a single scan result for the authenticated user.
 */
async function handlePostHistory(req, res) {
  if (!isAvailable()) {
    return res.status(503).json({ error: 'Database unavailable.' });
  }

  const { input, input_type, risk_score, verdict, details } = req.body;

  if (!input || !input_type || typeof risk_score !== 'number' || !verdict) {
    return res.status(400).json({
      error: 'Missing required fields: input, input_type, risk_score, verdict.',
    });
  }

  const allowedTypes = ['text', 'link', 'message', 'phone'];
  if (!allowedTypes.includes(input_type)) {
    return res.status(400).json({ error: `input_type must be one of ${allowedTypes.join(', ')}.` });
  }

  const allowedVerdicts = ['SAFE', 'SUSPICIOUS', 'DANGEROUS'];
  if (!allowedVerdicts.includes(verdict)) {
    return res.status(400).json({ error: `verdict must be one of ${allowedVerdicts.join(', ')}.` });
  }

  const userId = req.user.id;
  const inputHash = hashInput(input);

  const enrichedDetails = {
    ...(details || {}),
    content_preview: input.slice(0, 200),
  };

  const { data, error } = await supabase
    .from('scan_history')
    .insert({
      user_id: userId,
      input_hash: inputHash,
      input_type,
      risk_score: Math.round(risk_score),
      verdict,
      details: enrichedDetails,
    })
    .select('id, input_hash, input_type, risk_score, verdict, details, created_at')
    .single();

  if (error) {
    console.error('[history] POST failed:', error.message);
    return res.status(500).json({ error: 'Could not save scan history.' });
  }

  res.status(201).json({ history: data });
}

/**
 * DELETE /api/history/:id
 *
 * Removes a scan history row owned by the authenticated user.
 */
async function handleDeleteHistory(req, res) {
  if (!isAvailable()) {
    return res.status(503).json({ error: 'Database unavailable.' });
  }

  const userId = req.user.id;
  const id = parseInt(req.params.id, 10);

  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid history id.' });
  }

  const { error } = await supabase
    .from('scan_history')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('[history] DELETE failed:', error.message);
    return res.status(500).json({ error: 'Could not delete scan history.' });
  }

  res.status(204).send();
}

module.exports = {
  handleGetHistory,
  handlePostHistory,
  handleDeleteHistory,
};
