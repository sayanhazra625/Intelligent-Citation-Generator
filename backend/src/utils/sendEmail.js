const nodemailer = require('nodemailer');

/**
 * Simple email sending utility (uses the EmailService for actual sending).
 * Kept for backward compatibility with auth controller.
 */
const sendEmail = async ({ to, subject, html }) => {
  const emailService = require('../services/email.service');
  await emailService._send({ to, subject, html });
};

module.exports = sendEmail;
