// ─────────────────────────────────────────────────────────────
//  Request Validation Middleware
// ─────────────────────────────────────────────────────────────

const MAX_INPUT_LENGTH = parseInt(process.env.MAX_INPUT_LENGTH || '5000', 10);

const VALID_INPUT_TYPES = ['text', 'link', 'message'];

function validateAnalyzeRequest(req, res, next) {
  const { input, input_type } = req.body || {};

  // Check input exists and is a string
  if (!input || typeof input !== 'string') {
    return res.status(400).json({
      error: 'Field "input" is required and must be a non-empty string.',
    });
  }

  // Check input length
  if (input.trim().length === 0) {
    return res.status(400).json({
      error: 'Field "input" must not be empty or whitespace.',
    });
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({
      error: `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters.`,
    });
  }

  // Check input_type
  if (!input_type || !VALID_INPUT_TYPES.includes(input_type)) {
    return res.status(400).json({
      error: `Field "input_type" is required and must be one of: ${VALID_INPUT_TYPES.join(', ')}`,
    });
  }

  next();
}

module.exports = { validateAnalyzeRequest };
