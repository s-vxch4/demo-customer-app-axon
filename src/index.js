const express = require('express');
const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./utils/logger');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');

const app = express();
app.disable('x-powered-by');
app.use('/v1/webhooks', webhookRoutes);
app.use(express.json({ limit: '100kb' }));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'demo-app' }));
app.use('/v1/payments', paymentRoutes);

app.use((error, req, res, next) => {
  logger.error('Unhandled request error', { method: req.method, path: req.path, message: error.message, stack: error.stack });
  return res.status(error.statusCode || 500).json({ error: { code: error.code || 'INTERNAL_ERROR', message: error.statusCode ? error.message : 'An unexpected error occurred.' } });
});

async function start() {
  await mongoose.connect(config.mongoUri);
  app.listen(config.port, () => logger.info('HTTP server listening', { port: config.port, env: config.env }));
}

if (require.main === module) start().catch((error) => { logger.error('Unable to start service', { message: error.message, stack: error.stack }); process.exit(1); });

module.exports = { app, start };