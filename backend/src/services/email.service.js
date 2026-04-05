const https = require('https');

/**
 * Email service — uses Resend HTTP API in production, Ethereal SMTP in dev.
 *
 * WHY HTTP API INSTEAD OF SMTP:
 * Render (and most free PaaS) block ALL outbound SMTP ports (25, 465, 587).
 * SMTP = TCP connection to a mail server port = gets blocked.
 * HTTP API = regular HTTPS POST to api.resend.com = never blocked.
 * This is the permanent fix. No SMTP is used in production at all.
 *
 * SETUP (one time):
 * 1. Sign up free at https://resend.com
 * 2. Go to API Keys → Create API Key → copy it
 * 3. Set on Render: RESEND_API_KEY = re_xxxxxxxxxxxx
 * 4. Set on Render: FROM_EMAIL = onboarding@resend.dev
 *    (use onboarding@resend.dev until you add your own domain)
 */

// ─── Resend HTTP API (production) ────────────────────────────────────────────

/**
 * Send an email via Resend's REST API using Node's built-in https module.
 * No extra packages required beyond what you already have.
 */
function sendViaResend({ from, to, subject, html }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ from, to, subject, html });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Resend API error ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error('Resend API request timed out after 10s'));
    });

    req.write(payload);
    req.end();
  });
}

// ─── Ethereal SMTP (development only) ────────────────────────────────────────

async function sendViaEthereal({ to, subject, html }) {
  const nodemailer = require('nodemailer');
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  const info = await transporter.sendMail({
    from: testAccount.user,
    to,
    subject,
    html,
  });

  console.log('Email service: using Ethereal (dev mode)');
  console.log('Ethereal inbox:  https://ethereal.email/login');
  console.log(`Ethereal user:   ${testAccount.user}`);
  console.log(`Ethereal pass:   ${testAccount.pass}`);
  console.log(`Email preview:   ${nodemailer.getTestMessageUrl(info)}`);

  return info;
}

// ─── EmailService class ───────────────────────────────────────────────────────

class EmailService {
  _isProduction() {
    return process.env.NODE_ENV === 'production' && !!process.env.RESEND_API_KEY;
  }

  async _send({ to, subject, html }) {
    const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    if (this._isProduction()) {
      return sendViaResend({ from, to, subject, html });
    } else {
      return sendViaEthereal({ to, subject, html });
    }
  }

  async sendVerificationEmail(user, token) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await this._send({
      to: user.email,
      subject: 'Verify Your Email — Citation Generator',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <h2 style="color:#b8860b;margin-top:0;">Welcome to Citation Generator!</h2>
          <p style="color:#333;">Hi ${user.name},</p>
          <p style="color:#333;">Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}"
             style="display:inline-block;margin:16px 0;padding:12px 28px;
                    background:#b8860b;color:#fff;text-decoration:none;
                    border-radius:6px;font-weight:bold;font-size:15px;">
            Verify Email
          </a>
          <p style="margin-top:24px;color:#888;font-size:13px;line-height:1.6;">
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
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <h2 style="color:#b8860b;margin-top:0;">Password Reset Request</h2>
          <p style="color:#333;">Hi ${user.name},</p>
          <p style="color:#333;">You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}"
             style="display:inline-block;margin:16px 0;padding:12px 28px;
                    background:#b8860b;color:#fff;text-decoration:none;
                    border-radius:6px;font-weight:bold;font-size:15px;">
            Reset Password
          </a>
          <p style="margin-top:24px;color:#888;font-size:13px;line-height:1.6;">
            This link expires in 1 hour.<br>
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }
}

module.exports = new EmailService();