// ─────────────────────────────────────────────────────────────
//  Request Validation Middleware
// ─────────────────────────────────────────────────────────────

const MAX_INPUT_LENGTH = parseInt(process.env.MAX_INPUT_LENGTH || '5000', 10);

const VALID_INPUT_TYPES = ['text', 'link', 'message'];
const VALID_CONTENT_TYPES = ['text', 'link', 'phone'];

function validateAnalyzeRequest(req, res, next) {
  const { input, input_type } = req.body || {};

  if (!input || typeof input !== 'string') {
    return res.status(400).json({
      error: 'Field "input" is required and must be a non-empty string.',
    });
  }

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

  if (!input_type || !VALID_INPUT_TYPES.includes(input_type)) {
    return res.status(400).json({
      error: `Field "input_type" is required and must be one of: ${VALID_INPUT_TYPES.join(', ')}`,
    });
  }

  next();
}

function validateCheckNumberRequest(req, res, next) {
  const { phone_number } = req.body || {};

  if (!phone_number || typeof phone_number !== 'string') {
    return res.status(400).json({
      error: 'Field "phone_number" is required and must be a non-empty string.',
    });
  }

  if (phone_number.trim().length === 0) {
    return res.status(400).json({
      error: 'Field "phone_number" must not be empty or whitespace.',
    });
  }

  if (phone_number.length > 30) {
    return res.status(400).json({
      error: 'Phone number is too long.',
    });
  }

  next();
}

function validateCommunityReportRequest(req, res, next) {
  const { content_type, identifier } = req.body || {};

  if (!content_type || !VALID_CONTENT_TYPES.includes(content_type)) {
    return res.status(400).json({
      error: `Field "content_type" is required and must be one of: ${VALID_CONTENT_TYPES.join(', ')}`,
    });
  }

  if (!identifier || typeof identifier !== 'string') {
    return res.status(400).json({
      error: 'Field "identifier" is required and must be a non-empty string.',
    });
  }

  if (identifier.trim().length === 0) {
    return res.status(400).json({
      error: 'Field "identifier" must not be empty or whitespace.',
    });
  }

  if (identifier.length > 500) {
    return res.status(400).json({
      error: 'Identifier is too long.',
    });
  }

  next();
}

module.exports = {
  validateAnalyzeRequest,
  validateCheckNumberRequest,
  validateCommunityReportRequest,
};
