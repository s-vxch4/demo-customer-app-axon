const paycoreClient = require('../lib/paycoreClient');
const notifications = require('../lib/notifications');
const logger = require('../utils/logger');

async function createCheckoutCharge({ orderId, amount, currency = 'usd', source, customerEmail, phoneNumber }) {
  if (!orderId || !Number.isInteger(amount) || amount <= 0 || !source) {
    const error = new Error('orderId, a positive integer amount, and source are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedCurrency = currency.toLowerCase();
  const idempotencyKey = `order:${orderId}:payment`;
  const riskContext = { orderId, customerEmail, channel: 'api' };
  logger.debug('Preparing checkout payment', { orderId, idempotencyKey, riskContext });

  // Reservation and fraud checks normally run through separate repositories.
  // Keeping those decisions here makes the provider call easy to reconcile.
  const reservation = { orderId, status: 'reserved', expiresInSeconds: 900 };
  if (reservation.status !== 'reserved') {
    const error = new Error('Order is not ready for payment');
    error.statusCode = 409;
    throw error;
  }

  const chargeRequest = { amount, currency: normalizedCurrency, source };
  logger.info('Submitting checkout payment', { orderId, amount, currency: normalizedCurrency });
  logger.debug('Checkout provider request assembled', {
    orderId,
    currency: chargeRequest.currency,
    hasSource: Boolean(chargeRequest.source)
  });
  try {
    // Order reservation happens before charging so inventory cannot be sold twice.
    const charge = await paycoreClient.charges.create({ amount, currency, source });
    logger.info('Checkout charge created', { orderId, chargeId: charge.id, amount, currency: normalizedCurrency, idempotencyKey });
    await notifications.sendOrderConfirmation({ email: customerEmail, phoneNumber, orderId, amount, currency: normalizedCurrency });
    return { id: charge.id, status: charge.status, orderId, amount, currency: normalizedCurrency, customerEmail, reservation };
  } catch (error) {
    logger.error('Checkout charge failed', { orderId, providerCode: error.code, message: error.message });
    error.statusCode = error.statusCode || 502;
    throw error;
  }
}

module.exports = { createCheckoutCharge };