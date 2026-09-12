const Joi = require('joi');
require('dotenv').config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  MONGODB_URI: Joi.string().uri().required(),
  API_KEY: Joi.string().min(20).required(),
  PAYCORE_SECRET_KEY: Joi.string().required(),
  PAYCORE_WEBHOOK_SECRET: Joi.string().required(),
  SENDGRID_API_KEY: Joi.string().required(),
  EMAIL_FROM: Joi.string().email().required(),
  TWILIO_ACCOUNT_SID: Joi.string().required(),
  TWILIO_AUTH_TOKEN: Joi.string().required(),
  TWILIO_FROM_NUMBER: Joi.string().required(),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly').default('info')
}).unknown();

const { error, value } = schema.validate(process.env, { abortEarly: false });
if (error) {
  throw new Error(`Invalid environment configuration: ${error.details.map((detail) => detail.message).join(', ')}`);
}

module.exports = {
  env: value.NODE_ENV,
  port: value.PORT,
  mongoUri: value.MONGODB_URI,
  apiKey: value.API_KEY,
  paycore: { secretKey: value.PAYCORE_SECRET_KEY, webhookSecret: value.PAYCORE_WEBHOOK_SECRET },
  sendgrid: { apiKey: value.SENDGRID_API_KEY, from: value.EMAIL_FROM },
  twilio: { accountSid: value.TWILIO_ACCOUNT_SID, authToken: value.TWILIO_AUTH_TOKEN, from: value.TWILIO_FROM_NUMBER },
  logLevel: value.LOG_LEVEL
};