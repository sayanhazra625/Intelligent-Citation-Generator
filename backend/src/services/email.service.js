const nodemailer = require('nodemailer');

/**
 * Email service for sending transactional emails.
 * Uses Gmail SMTP in production, Ethereal (fake SMTP) in development.
 * Both are completely free.
 */
class EmailService {
  constructor() {
    this.transporter = null;
  }

  async _getTransporter() {
    if (this.transporter) return this.transporter;

    if (process.env.NODE_ENV === 'production' && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      // Production: Gmail SMTP (free — requires App Password)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
      console.log('Email service: using Gmail SMTP');
    } else {
      // Development: Ethereal fake SMTP (free, no signup needed)
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
      console.log(`Ethereal inbox: https://ethereal.email/login`);
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
        <h2>Welcome to Citation Generator!</h2>
        <p>Hi ${user.name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#b8860b;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't create this account, you can safely ignore this email.</p>
      `,
    });
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this._send({
      to: user.email,
      subject: 'Reset Your Password — Citation Generator',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#b8860b;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  }

  async _send({ to, subject, html }) {
    const transporter = await this._getTransporter();

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@citationgen.com',
      to,
      subject,
      html,
    });

    // In dev mode, log the Ethereal preview URL so you can view the email
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Email preview: ${previewUrl}`);
    }

    return info;
  }
}

module.exports = new EmailService();
