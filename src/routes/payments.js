const express = require('express');
const auth = require('../middleware/auth');
const checkout = require('../services/checkout');
const invoice = require('../services/invoice');
const subscription = require('../services/subscription');

const router = express.Router();
router.use(auth);

router.post('/checkout', async (req, res, next) => {
  try { return res.status(201).json({ data: await checkout.createCheckoutCharge(req.body) }); } catch (error) { return next(error); }
});

router.post('/invoices/:invoiceId/pay', async (req, res, next) => {
  try { return res.json({ data: await invoice.collectInvoice({ ...req.body, invoiceId: req.params.invoiceId }) }); } catch (error) { return next(error); }
});

router.post('/subscriptions', async (req, res, next) => {
  try { return res.status(201).json({ data: await subscription.createSubscription(req.body) }); } catch (error) { return next(error); }
});

module.exports = router;