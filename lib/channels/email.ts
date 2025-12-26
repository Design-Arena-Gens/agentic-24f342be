import nodemailer from 'nodemailer';
import { Contact } from '../types';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(
  contact: Contact,
  message: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!contact.email) {
    return { success: false, error: 'No email address provided' };
  }

  const lines = message.split('\n');
  let subject = 'Message for you';
  let body = message;

  if (lines[0].toLowerCase().startsWith('subject:')) {
    subject = lines[0].replace(/^subject:\s*/i, '').trim();
    body = lines.slice(1).join('\n').trim();
  }

  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: contact.email,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    });

    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
}

export function parseEmailReply(rawEmail: string): {
  from: string;
  subject: string;
  body: string;
  timestamp: Date;
} {
  const fromMatch = rawEmail.match(/From: (.+)/);
  const subjectMatch = rawEmail.match(/Subject: (.+)/);
  const dateMatch = rawEmail.match(/Date: (.+)/);

  const bodyStart = rawEmail.indexOf('\n\n');
  const body = bodyStart > -1 ? rawEmail.substring(bodyStart).trim() : '';

  return {
    from: fromMatch ? fromMatch[1] : '',
    subject: subjectMatch ? subjectMatch[1] : '',
    body: body,
    timestamp: dateMatch ? new Date(dateMatch[1]) : new Date()
  };
}
