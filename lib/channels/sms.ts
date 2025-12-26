import twilio from 'twilio';
import { Contact } from '../types';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const fromNumber = process.env.TWILIO_PHONE_NUMBER;

export async function sendSMS(contact: Contact, message: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!contact.phoneNumber) {
    return { success: false, error: 'No phone number provided' };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber || '',
      to: contact.phoneNumber
    });

    return {
      success: true,
      messageId: result.sid
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    };
  }
}

export async function checkSMSReplies(): Promise<Array<{
  from: string;
  body: string;
  timestamp: Date;
  messageId: string;
}>> {
  try {
    const messages = await client.messages.list({
      to: fromNumber || '',
      limit: 50
    });

    return messages.map(msg => ({
      from: msg.from,
      body: msg.body,
      timestamp: msg.dateCreated,
      messageId: msg.sid
    }));
  } catch (error) {
    console.error('Failed to fetch SMS replies:', error);
    return [];
  }
}
