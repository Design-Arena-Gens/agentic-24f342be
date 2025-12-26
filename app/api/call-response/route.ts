import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { analyzeResponse } from '@/lib/ai-agent';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const speechResult = formData.get('SpeechResult') as string;
    const callSid = formData.get('CallSid') as string;

    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    if (!speechResult) {
      response.say(
        { voice: 'Polly.Joanna' },
        'I did not hear a response. Thank you for your time. Goodbye.'
      );
      response.hangup();
      return new NextResponse(response.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    const analysis = await analyzeResponse(
      'Initial outreach call',
      speechResult,
      `Call SID: ${callSid}`
    );

    if (analysis.intent === 'interested') {
      response.say(
        { voice: 'Polly.Joanna' },
        'Great! A representative will follow up with you shortly. Thank you!'
      );
    } else if (analysis.intent === 'not_interested') {
      response.say(
        { voice: 'Polly.Joanna' },
        'I understand. Thank you for your time. Have a great day!'
      );
    } else if (analysis.intent === 'ask_later') {
      response.say(
        { voice: 'Polly.Joanna' },
        'No problem. We will reach out to you at a better time. Thank you!'
      );
    } else if (analysis.intent === 'unsubscribe') {
      response.say(
        { voice: 'Polly.Joanna' },
        'Understood. We will remove you from our contact list. Goodbye.'
      );
    } else {
      if (analysis.suggestedReply) {
        response.say({ voice: 'Polly.Joanna' }, analysis.suggestedReply);
      } else {
        response.say(
          { voice: 'Polly.Joanna' },
          'Thank you for your response. Someone will get back to you soon.'
        );
      }
    }

    response.hangup();

    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    response.say({ voice: 'Polly.Joanna' }, 'An error occurred. Goodbye.');
    response.hangup();

    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}
