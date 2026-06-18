/**
 * emailService.js — Transactional email sender (stub)
 *
 * TODO: Connect to your preferred email provider (Resend, SendGrid, or Nodemailer).
 * The interface is stable — just replace the body of sendEmail() when ready.
 */

import logger from "../middleware/logger.js";

/**
 * Send an email to one or more recipients.
 * @param {{ to: string[], subject: string, html: string }} options
 * @returns {Promise<boolean>}
 */
export async function sendEmail({ to, subject, html }) {
  // TODO: Replace with real provider (Resend, SendGrid, Nodemailer)
  logger.info(`[EMAIL MOCK] Sending to ${to.length} recipients. Subject: ${subject}`);
  return Promise.resolve(true);
}
