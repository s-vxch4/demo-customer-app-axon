const paycoreClient = require('../lib/paycoreClient');
const logger = require('../utils/logger');

async function createSubscription({ customerId, planId, source }) {
  if (!customerId || !planId || !source) {
    const error = new Error('customerId, planId, and source are required');
    error.statusCode = 400;
    throw error;
  }
  try {
    const subscription = await paycoreClient.subscriptions.create({ customer: customerId, plan: planId, source });
    logger.info('Subscription created', { customerId, planId, subscriptionId: subscription.id });
    return { id: subscription.id, status: subscription.status, planId, customerId };
  } catch (error) {
    logger.error('Subscription creation failed', { customerId, planId, providerCode: error.code, message: error.message });
    error.statusCode = error.statusCode || 502;
    throw error;
  }
}

module.exports = { createSubscription };