const sendgrid = require('@sendgrid/mail');
const twilio = require('twilio');
const config = require('../config');
const logger = require('../utils/logger');

sendgrid.setApiKey(config.sendgrid.apiKey);
const twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);

async function sendOrderConfirmation({ email, phoneNumber, orderId, amount, currency }) {
  const tasks = [];
  if (email) {
    tasks.push(sendgrid.send({
      to: email,
      from: config.sendgrid.from,
      subject: `Order ${orderId} confirmed`,
      text: `Your payment of ${(amount / 100).toFixed(2)} ${currency.toUpperCase()} was received.`
    }));
  }
  if (phoneNumber) {
    tasks.push(twilioClient.messages.create({
      to: phoneNumber,
      from: config.twilio.from,
      body: `Order ${orderId} is confirmed. Payment received.`
    }));
  }
  const results = await Promise.allSettled(tasks);
  results.forEach((result) => {
    if (result.status === 'rejected') logger.warn('Order notification failed', { orderId, message: result.reason.message });
  });
}

module.exports = { sendOrderConfirmation };