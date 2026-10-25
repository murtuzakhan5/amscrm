import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

if (env.smtpUser && env.smtpPassword) {
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPassword,
    },
  });
}

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!transporter) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✉️ [DEV EMAIL SIMULATOR] To: ${to}`);
      console.log(`📌 Subject: ${subject}`);
      console.log(`📝 Content: ${text || html}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { mock: true, success: true };
    }

    const info = await transporter.sendMail({
      from: env.emailFrom,
      to,
      subject,
      text,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
  const subject = 'AMS Crafters — Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #17365D; margin-bottom: 16px;">AMS Crafters CRM</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. Click the button below to set a new password. This link is valid for 1 hour.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #2563EB; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">© AMS Crafters. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html, text: `Reset password: ${resetUrl}` });
};
