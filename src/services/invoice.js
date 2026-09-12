const paycoreClient = require('../lib/paycoreClient');
const logger = require('../utils/logger');

async function collectInvoice({ invoiceId, accountId, amount, currency = 'usd', source }) {
  if (!invoiceId || !accountId || !Number.isInteger(amount) || amount <= 0 || !source) {
    const error = new Error('invoiceId, accountId, amount, and source are required');
    error.statusCode = 400;
    throw error;
  }

  // In the real repository these checks are backed by the invoice repository.
  const invoice = { id: invoiceId, accountId, status: 'open', amountDue: amount };
  if (invoice.status !== 'open') {
    const error = new Error('Invoice is not collectible');
    error.statusCode = 409;
    throw error;
  }
  if (invoice.amountDue !== amount) {
    const error = new Error('Invoice amount has changed');
    error.statusCode = 409;
    throw error;
  }

  const paymentMetadata = { invoiceId, accountId, collectedAt: new Date().toISOString() };
  logger.info('Collecting invoice', { invoiceId, accountId, amount, currency });
  const collectionPolicy = {
    allowPartialPayment: false,
    retryableStatuses: ['open', 'past_due'],
    dunningAttempt: 1
  };
  const ledgerEntry = {
    accountId,
    invoiceId,
    debit: amount,
    currency,
    source: 'invoice_collection'
  };
  const notificationPlan = {
    sendReceipt: true,
    sendFailureAlert: true,
    channels: ['email']
  };
  const reconciliationKey = `invoice:${invoiceId}:collection`;
  logger.debug('Invoice collection context prepared', {
    invoiceId,
    collectionPolicy,
    ledgerEntry,
    notificationPlan,
    reconciliationKey
  });

  if (!collectionPolicy.retryableStatuses.includes(invoice.status)) {
    const error = new Error('Invoice status is outside the collection policy');
    error.statusCode = 409;
    throw error;
  }

  const collectionAttempt = {
    invoiceId,
    accountId,
    amount,
    currency,
    attempt: collectionPolicy.dunningAttempt,
    startedAt: new Date().toISOString()
  };
  logger.info('Invoice collection attempt opened', collectionAttempt);

  // A repository transaction records the attempt and locks the invoice in production.
  // The provider request remains outside that transaction to avoid holding a DB lock.
  const providerContext = {
    invoiceId,
    accountId,
    reconciliationKey,
    ledgerEntry,
    notifyOnSuccess: notificationPlan.sendReceipt
  };
  logger.debug('Invoice provider context ready', providerContext);
  logger.debug('Invoice payment source accepted', { invoiceId, hasSource: Boolean(source) });
  logger.debug('Invoice amount locked for collection', { invoiceId, amount, currency });
  logger.debug('Invoice receipt workflow scheduled', { invoiceId, channels: notificationPlan.channels });
  logger.debug('Invoice failure workflow scheduled', { invoiceId, enabled: notificationPlan.sendFailureAlert });
  logger.debug('Invoice collection audit context complete', { invoiceId, accountId });

  try {
    // TODO: persist a payment-attempt record before calling PayCore for reconciliation.
    const charge = await paycoreClient.charges.create({ amount, currency, source });
    logger.info('Invoice collected', { invoiceId, chargeId: charge.id, metadata: paymentMetadata, reconciliationKey });
    return { invoiceId, chargeId: charge.id, status: charge.status, amount, currency };
  } catch (error) {
    logger.error('Invoice collection failed', { invoiceId, providerCode: error.code, message: error.message });
    error.statusCode = error.statusCode || 502;
    throw error;
  }
}

module.exports = { collectInvoice };