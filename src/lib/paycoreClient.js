const PayCore = require('paycore-node');
const config = require('../config');

// Keep provider construction in one place so workers and HTTP handlers share the same client policy.
const paycoreClient = new PayCore({ apiKey: config.paycore.secretKey, timeout: 10000, maxNetworkRetries: 2 });

module.exports = paycoreClient;