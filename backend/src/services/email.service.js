const nodemailer = require('nodemailer');

/**
 * Email service for sending transactional emails.
 *
 * Production: Resend SMTP relay (free, 3000/month, works on Render free tier)
 * Development: Ethereal fake SMTP (free, no signup, emails viewable in browser)
 *
 * Why not Gmail SMTP directly?
 * Render (and most PaaS free tiers) block outbound SMTP ports 25, 465, 587
 * to prevent spam abuse. Resend sends over HTTPS internally so it works fine.
 */
class EmailService {
  constructor() {
    this.transporter = null;
  }

  async _getTransporter() {
    if (this.transporter) return this.transporter;

    const isProduction = process.env.NODE_ENV === 'production';
    const hasResend = !!process.env.RESEND_API_KEY;

    if (isProduction && hasResend) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      });
      console.log('Email service: using Resend SMTP');

    } else {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('Email service: using Ethereal (dev mode)');
      console.log('Ethereal inbox: https://ethereal.email/login');
      console.log(`Ethereal user: ${testAccount.user}`);
      console.log(`Ethereal pass: ${testAccount.pass}`);
    }

    return this.transporter;
  }

  async sendVerificationEmail(user, token) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await this._send({
      to: user.email,
      subject: 'Verify Your Email — Citation Generator',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#b8860b;">Welcome to Citation Generator!</h2>
          <p>Hi ${user.name},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}"
             style="display:inline-block;padding:12px 24px;background:#b8860b;color:#fff;
                    text-decoration:none;border-radius:6px;font-weight:bold;">
            Verify Email
          </a>
          <p style="margin-top:24px;color:#666;font-size:13px;">
            This link expires in 24 hours.<br>
            If you didn't create this account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this._send({
      to: user.email,
      subject: 'Reset Your Password — Citation Generator',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#b8860b;">Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 24px;background:#b8860b;color:#fff;
                    text-decoration:none;border-radius:6px;font-weight:bold;">
            Reset Password
          </a>
          <p style="margin-top:24px;color:#666;font-size:13px;">
            This link expires in 1 hour.<br>
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }

  async _send({ to, subject, html }) {
    const transporter = await this._getTransporter();

    const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    const info = await transporter.sendMail({ from, to, subject, html });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email preview: ${previewUrl}`);
    }

    return info;
  }
}

module.exports = new EmailService();