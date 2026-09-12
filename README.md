# demo-app

Commerce API for checkout payments, invoice collection, and subscription billing. The service keeps payment provider calls behind application services and emits operational notifications through SendGrid and Twilio.

## Requirements

- Node.js 18.18 or newer
- A MongoDB instance
- PayCore, SendGrid, and Twilio credentials

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

The API listens on `PORT` (default `3000`). Health checks are available at `GET /health`. All payment routes require the `x-api-key` header.

## API surface

- `POST /v1/payments/checkout` creates a one-time charge and sends a confirmation email.
- `POST /v1/payments/invoices/:invoiceId/pay` collects an outstanding invoice.
- `POST /v1/payments/subscriptions` creates a recurring billing subscription.
- `POST /v1/webhooks/paycore` accepts signed PayCore lifecycle events.

## Operations

Set `LOG_LEVEL=debug` for local troubleshooting. Production logs are JSON and should be shipped from stdout. Webhook requests are authenticated with `PAYCORE_WEBHOOK_SECRET`; the raw request body must be preserved by the application before signature verification.

Run `npm test` for the test suite and `npm run lint` for static checks.
