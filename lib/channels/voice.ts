import twilio from 'twilio';
import { Contact } from '../types';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const fromNumber = process.env.TWILIO_PHONE_NUMBER;

export async function makeCall(
  contact: Contact,
  script: { greeting: string; mainPitch: string; closing: string }
): Promise<{
  success: boolean;
  callId?: string;
  error?: string;
}> {
  if (!contact.phoneNumber) {
    return { success: false, error: 'No phone number provided' };
  }

  try {
    const twiml = generateTwiML(script);
    const twimlUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/twiml?script=${encodeURIComponent(JSON.stringify(script))}`;

    const call = await client.calls.create({
      twiml: twiml,
      to: contact.phoneNumber,
      from: fromNumber || '',
      machineDetection: 'DetectMessageEnd',
      machineDetectionTimeout: 5,
      record: true
    });

    return {
      success: true,
      callId: call.sid
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to make call'
    };
  }
}

function generateTwiML(script: {
  greeting: string;
  mainPitch: string;
  closing: string;
}): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  response.say(
    {
      voice: 'Polly.Joanna',
      language: 'en-US'
    },
    script.greeting
  );

  response.pause({ length: 1 });

  response.say(
    {
      voice: 'Polly.Joanna',
      language: 'en-US'
    },
    script.mainPitch
  );

  response.pause({ length: 1 });

  const gather = response.gather({
    input: ['speech'],
    action: '/api/call-response',
    method: 'POST',
    speechTimeout: 'auto',
    language: 'en-US'
  });

  gather.say(
    {
      voice: 'Polly.Joanna'
    },
    'If you\'re interested, please say yes. Otherwise, say no or not interested.'
  );

  response.say(
    {
      voice: 'Polly.Joanna',
      language: 'en-US'
    },
    script.closing
  );

  return response.toString();
}

export async function getCallStatus(callId: string): Promise<{
  status: string;
  duration?: number;
  answeredBy?: string;
}> {
  try {
    const call = await client.calls(callId).fetch();
    return {
      status: call.status,
      duration: parseInt(call.duration || '0'),
      answeredBy: call.answeredBy || undefined
    };
  } catch (error) {
    return { status: 'unknown' };
  }
}

export async function getCallRecording(callId: string): Promise<string | null> {
  try {
    const recordings = await client.recordings.list({ callSid: callId, limit: 1 });
    if (recordings.length > 0) {
      return `https://api.twilio.com${recordings[0].uri.replace('.json', '.mp3')}`;
    }
    return null;
  } catch (error) {
    return null;
  }
}
