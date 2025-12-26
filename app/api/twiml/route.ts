import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scriptParam = searchParams.get('script');

  if (!scriptParam) {
    return new NextResponse('Script parameter required', { status: 400 });
  }

  try {
    const script = JSON.parse(decodeURIComponent(scriptParam));

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
      'If you are interested, please say yes. Otherwise, say no or not interested.'
    );

    response.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US'
      },
      script.closing
    );

    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    return new NextResponse('Invalid script format', { status: 400 });
  }
}
