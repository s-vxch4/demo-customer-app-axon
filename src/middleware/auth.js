const crypto = require('crypto');
const config = require('../config');

module.exports = function apiKeyAuth(req, res, next) {
  const suppliedKey = req.get('x-api-key');
  if (!suppliedKey || suppliedKey.length !== config.apiKey.length || !crypto.timingSafeEqual(Buffer.from(suppliedKey), Buffer.from(config.apiKey))) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'A valid API key is required.' } });
  }
  return next();
};