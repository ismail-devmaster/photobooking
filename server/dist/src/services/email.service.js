"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = sendVerificationEmail;
// src/services/email.service.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@local.test';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:4000';
let transporter = null;
let usingTestAccount = false;
async function initTransporter() {
    if (transporter)
        return transporter;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
    if (SMTP_HOST && SMTP_PORT) {
        // Use provided SMTP server (production or MailDev)
        transporter = nodemailer_1.default.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: SMTP_SECURE === 'true', // true for 465, false for 587/1025
            auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
            // allow self-signed certs for local dev when using maildev or local smtp
            tls: {
                rejectUnauthorized: false,
            },
        });
        // verify connection config (optional)
        try {
            await transporter.verify();
            console.log('✅ SMTP transporter ready (host=%s port=%s)', SMTP_HOST, SMTP_PORT);
        }
        catch (err) {
            console.warn('⚠️ SMTP transporter verification failed:', err.message);
            // still keep transporter — errors will show on send
        }
        usingTestAccount = false;
        return transporter;
    }
    // No SMTP config: create ethereal test account automatically
    const testAccount = await nodemailer_1.default.createTestAccount();
    transporter = nodemailer_1.default.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
    usingTestAccount = true;
    console.warn('⚠️ No SMTP config found. Using Ethereal test account — messages will not be delivered externally.');
    return transporter;
}
/**
 * Send verification email (used by verification flow).
 * - to: recipient email
 * - name: recipient display name (nullable)
 * - token: plain verification token (included in link)
 * - userId: id of the user (uid param in link)
 */
async function sendVerificationEmail(to, name, token, userId) {
    const transport = await initTransporter();
    const verifyUrl = `${APP_BASE_URL.replace(/\/$/, '')}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}&uid=${encodeURIComponent(userId)}`;
    const subject = 'Verify your email';
    const text = `Hi ${name || ''},

Please verify your email by clicking the link below:

${verifyUrl}

If you did not sign up, ignore this email.
`;
    const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#111;">
    <h2>Hi ${name || ''}</h2>
    <p>Thanks for signing up. Click the button below to verify your email address.</p>
    <p style="margin: 20px 0;">
      <a href="${verifyUrl}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block;">Verify Email</a>
    </p>
    <p>If the button doesn't work, copy and paste this url into your browser:</p>
    <pre style="white-space:pre-wrap">${verifyUrl}</pre>
    <hr/>
    <p style="color:#666;font-size:12px">If you did not request this, you can ignore this email.</p>
  </div>`;
    const mailOptions = {
        from: FROM_EMAIL,
        to,
        subject,
        text,
        html,
    };
    try {
        const info = await transport.sendMail(mailOptions);
        console.log(`✉️ Verification email queued for ${to} (messageId=${info.messageId})`);
        // If using ethereal test account or some transports, print preview URL
        const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
        if (previewUrl) {
            console.log('🔗 Preview email URL (ethereal):', previewUrl);
        }
        // If using MailDev (smtp to localhost:1025), instruct to check MailDev web UI
        if (!usingTestAccount && (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'localhost')) {
            console.log('🔎 If using MailDev, open http://localhost:1080 to view the message.');
        }
        return info;
    }
    catch (err) {
        console.error('❌ Failed to send verification email:', err?.message || err);
        throw err;
    }
}
