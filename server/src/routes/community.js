// ─────────────────────────────────────────────────────────────
//  Community Scam Reporting
//  POST /api/community/report  +  GET /api/community/count
//  Supabase-backed with in-memory fallback.
// ─────────────────────────────────────────────────────────────

const crypto = require('crypto');
const { isAvailable, getClient } = require('../db/supabase');

// In-memory fallback when Supabase is unavailable
const memReports = new Map();

function hashIdentifier(identifier) {
  return crypto.createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex');
}

function fingerprintRequest(req) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  return crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16);
}

async function handleReport(req, res) {
  try {
    const { content_type, identifier } = req.body;
    const key = hashIdentifier(identifier);
    const reporter = fingerprintRequest(req);

    if (isAvailable()) {
      const supabase = getClient();

      const { data: existing } = await supabase
        .from('community_reports')
        .select('id')
        .eq('identifier', key)
        .eq('reporter_hash', reporter)
        .maybeSingle();

      if (existing) {
        const { count } = await supabase
          .from('community_reports')
          .select('*', { count: 'exact', head: true })
          .eq('identifier', key);

        return res.status(200).json({
          success: true,
          message: 'You have already reported this. Thank you for helping the community.',
          count: count || 1,
          duplicate: true,
        });
      }

      const { error: insertErr } = await supabase
        .from('community_reports')
        .insert({
          content_type,
          identifier: key,
          reporter_hash: reporter,
        });

      if (insertErr && !insertErr.message?.includes('duplicate')) {
        console.error('[community/report] Insert error:', insertErr.message);
        return res.status(500).json({ error: 'Could not submit report. Please try again.' });
      }

      const { count } = await supabase
        .from('community_reports')
        .select('*', { count: 'exact', head: true })
        .eq('identifier', key);

      res.status(201).json({
        success: true,
        message: 'Report submitted. Thank you for helping protect the community.',
        count: count || 1,
        duplicate: false,
      });
    } else {
      // In-memory fallback
      if (!memReports.has(key)) memReports.set(key, new Set());
      const reporters = memReports.get(key);

      if (reporters.has(reporter)) {
        return res.status(200).json({
          success: true,
          message: 'You have already reported this. Thank you for helping the community.',
          count: reporters.size,
          duplicate: true,
        });
      }

      reporters.add(reporter);
      res.status(201).json({
        success: true,
        message: 'Report submitted. Thank you for helping protect the community.',
        count: reporters.size,
        duplicate: false,
      });
    }
  } catch (err) {
    console.error('[community/report] Unexpected error:', err.message);
    res.status(500).json({ error: 'Could not submit report. Please try again.' });
  }
}

async function handleCount(req, res) {
  const { identifier } = req.query || {};

  if (!identifier) {
    return res.status(400).json({
      error: 'Query parameter "identifier" is required.',
    });
  }

  const count = await getCommunityReportCount(identifier);
  res.json({ count });
}

async function getCommunityReportCount(identifier) {
  const key = hashIdentifier(identifier);

  if (isAvailable()) {
    const supabase = getClient();
    const { count, error } = await supabase
      .from('community_reports')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', key);

    if (error) {
      console.error('[community/count] Query error:', error.message);
      return 0;
    }
    return count || 0;
  }

  // In-memory fallback
  const reporters = memReports.get(key);
  return reporters ? reporters.size : 0;
}

module.exports = { handleReport, handleCount, getCommunityReportCount };
