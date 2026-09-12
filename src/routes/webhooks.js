const express = require('express');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');

const router = express.Router();
router.post('/paycore', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.get('paycore-signature');
  const expected = crypto.createHmac('sha256', config.paycore.webhookSecret).update(req.body).digest('hex');
  if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return res.status(400).json({ error: 'Invalid webhook signature' });
  const event = JSON.parse(req.body.toString('utf8'));
  logger.info('PayCore webhook received', { eventId: event.id, type: event.type });
  // Event processing is intentionally idempotent; consumers use event.id as the deduplication key.
  return res.status(204).send();
});

module.exports = router;