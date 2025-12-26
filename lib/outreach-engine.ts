import { Contact, OutreachResult } from './types';
import { generatePersonalizedMessage, generateCallScript } from './ai-agent';
import { sendSMS } from './channels/sms';
import { makeCall } from './channels/voice';
import { sendEmail } from './channels/email';
import { isWithinBusinessHours } from './timezone-utils';

export interface OutreachConfig {
  template: string;
  tone: 'sales' | 'support' | 'reminder' | 'follow-up';
  language: string;
  respectTimezones: boolean;
  respectDoNotContact: boolean;
}

export async function executeOutreach(
  contact: Contact,
  config: OutreachConfig
): Promise<OutreachResult> {
  if (config.respectDoNotContact && contact.status === 'Do Not Contact') {
    return {
      contactName: contact.fullName,
      channel: 'None',
      success: false,
      error: 'Contact marked as Do Not Contact',
      timestamp: new Date()
    };
  }

  if (config.respectTimezones && contact.timeZone) {
    if (!isWithinBusinessHours(contact.timeZone)) {
      return {
        contactName: contact.fullName,
        channel: 'None',
        success: false,
        error: 'Outside business hours for contact timezone',
        timestamp: new Date()
      };
    }
  }

  const channel = determineChannel(contact);

  try {
    if (channel === 'SMS') {
      return await sendSMSOutreach(contact, config);
    } else if (channel === 'Call') {
      return await sendCallOutreach(contact, config);
    } else if (channel === 'Email') {
      return await sendEmailOutreach(contact, config);
    } else {
      return {
        contactName: contact.fullName,
        channel: 'None',
        success: false,
        error: 'No valid contact method available',
        timestamp: new Date()
      };
    }
  } catch (error: any) {
    return {
      contactName: contact.fullName,
      channel,
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
}

function determineChannel(contact: Contact): 'SMS' | 'Call' | 'Email' | 'None' {
  if (contact.preferredContactMethod !== 'Auto') {
    if (contact.preferredContactMethod === 'SMS' && contact.phoneNumber) return 'SMS';
    if (contact.preferredContactMethod === 'Call' && contact.phoneNumber) return 'Call';
    if (contact.preferredContactMethod === 'Email' && contact.email) return 'Email';
  }

  if (contact.phoneNumber) return 'SMS';
  if (contact.email) return 'Email';
  return 'None';
}

async function sendSMSOutreach(
  contact: Contact,
  config: OutreachConfig
): Promise<OutreachResult> {
  const message = await generatePersonalizedMessage({
    contact,
    template: config.template,
    tone: config.tone,
    language: config.language,
    channel: 'SMS'
  });

  const result = await sendSMS(contact, message);

  return {
    contactName: contact.fullName,
    channel: 'SMS',
    success: result.success,
    message: result.success ? message : undefined,
    error: result.error,
    timestamp: new Date()
  };
}

async function sendCallOutreach(
  contact: Contact,
  config: OutreachConfig
): Promise<OutreachResult> {
  const script = await generateCallScript({
    contact,
    template: config.template,
    tone: config.tone,
    language: config.language,
    channel: 'Call'
  });

  const result = await makeCall(contact, script);

  return {
    contactName: contact.fullName,
    channel: 'Call',
    success: result.success,
    message: result.success ? `Call initiated: ${result.callId}` : undefined,
    error: result.error,
    timestamp: new Date()
  };
}

async function sendEmailOutreach(
  contact: Contact,
  config: OutreachConfig
): Promise<OutreachResult> {
  const message = await generatePersonalizedMessage({
    contact,
    template: config.template,
    tone: config.tone,
    language: config.language,
    channel: 'Email'
  });

  const result = await sendEmail(contact, message);

  return {
    contactName: contact.fullName,
    channel: 'Email',
    success: result.success,
    message: result.success ? 'Email sent' : undefined,
    error: result.error,
    timestamp: new Date()
  };
}

export async function batchOutreach(
  contacts: Contact[],
  config: OutreachConfig,
  onProgress?: (completed: number, total: number) => void
): Promise<OutreachResult[]> {
  const results: OutreachResult[] = [];
  const delayMs = 2000;

  for (let i = 0; i < contacts.length; i++) {
    const result = await executeOutreach(contacts[i], config);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, contacts.length);
    }

    if (i < contacts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
