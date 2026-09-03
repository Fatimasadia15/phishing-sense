// ─────────────────────────────────────────────────────────────
//  Authentication Middleware
//  Verifies the Supabase access token passed in the Authorization
//  header and attaches req.user for downstream route handlers.
// ─────────────────────────────────────────────────────────────

const { supabase } = require('../db/supabase');

async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Missing access token.' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
    }

    req.user = {
      id:    data.user.id,
      email: data.user.email || null,
    };

    next();
  } catch (err) {
    console.error('[auth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized. Token verification failed.' });
  }
}

/**
 * Verify a Supabase access token without failing the request.
 * Returns the user object or null if the token is missing/invalid.
 */
async function getUserFromToken(token) {
  if (!token || !supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return { id: data.user.id, email: data.user.email || null };
  } catch (err) {
    console.error('[auth] Optional token verification failed:', err.message);
    return null;
  }
}

module.exports = { authenticateUser, getUserFromToken };
