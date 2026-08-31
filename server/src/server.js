// ─────────────────────────────────────────────────────────────
//  Phishing Sense — Backend Server Entry Point
//  Node.js + Express API for AI-powered risk analysis.
// ─────────────────────────────────────────────────────────────

// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express          = require('express');
const cors             = require('cors');
const helmet           = require('helmet');
const rateLimit        = require('express-rate-limit');
const { handleAnalyze } = require('./routes/analyze');
const { handleCheckNumber } = require('./routes/checkNumber');
const { handleReport, handleCount } = require('./routes/community');
const { handleChat } = require('./routes/chat');
const {
  validateAnalyzeRequest,
  validateCheckNumberRequest,
  validateCommunityReportRequest,
} = require('./middleware/validate');

const app  = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ── Security middleware ──────────────────────────────────────
app.use(helmet());

// CORS — allow Expo dev server and production origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:19000',
      'exp://localhost:19000',
    ];
    if (allowed.some(a => origin.startsWith(a))) {
      return callback(null, true);
    }
    // In production, add your actual domain here
    callback(null, true);
  },
}));

// ── Rate limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
});

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'phishing-sense',
    version: '1.0.0',
    llm_provider: process.env.LLM_PROVIDER || 'none',
  });
});

// ── Main analysis endpoint ──────────────────────────────────
app.post('/api/analyze', limiter, validateAnalyzeRequest, handleAnalyze);

// ── Number check endpoint ────────────────────────────────────
app.post('/api/check-number', limiter, validateCheckNumberRequest, handleCheckNumber);

// ── Sense AI chat endpoint ──────────────────────────────────
app.post('/api/chat', limiter, handleChat);

// ── Community reporting endpoints ───────────────────────────
app.post('/api/community/report', limiter, validateCommunityReportRequest, handleReport);
app.get('/api/community/count', handleCount);

// ── Root route ──────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    service: 'Phishing Sense API',
    version: '1.0.0',
    endpoints: {
      health:         'GET  /api/health',
      analyze:        'POST /api/analyze',
      chat:           'POST /api/chat',
      checkNumber:    'POST /api/check-number',
      communityReport:'POST /api/community/report',
      communityCount: 'GET  /api/community/count',
    },
    usage: 'POST to /api/analyze or /api/chat',
  });
});

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// ── Global error handler ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Phishing Sense] Server running on http://localhost:${PORT}`);
  console.log(`[Phishing Sense] LLM provider: ${process.env.LLM_PROVIDER || 'none (rules only)'}`);
  console.log(`[Phishing Sense] Health:        GET  http://localhost:${PORT}/api/health`);
  console.log(`[Phishing Sense] Analyze:       POST http://localhost:${PORT}/api/analyze`);
  console.log(`[Phishing Sense] Chat:          POST http://localhost:${PORT}/api/chat`);
  console.log(`[Phishing Sense] Check Number:  POST http://localhost:${PORT}/api/check-number`);
  console.log(`[Phishing Sense] Report:        POST http://localhost:${PORT}/api/community/report`);
  console.log(`[Phishing Sense] Report Count:  GET  http://localhost:${PORT}/api/community/count`);
});

module.exports = app;
