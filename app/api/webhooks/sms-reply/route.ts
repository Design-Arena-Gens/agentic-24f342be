import { NextRequest, NextResponse } from 'next/server';
import { analyzeResponse } from '@/lib/ai-agent';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;

    console.log(`SMS Reply received from ${from}: ${body}`);

    const analysis = await analyzeResponse(
      'SMS outreach message',
      body,
      `From: ${from}, MessageSid: ${messageSid}`
    );

    console.log('Intent analysis:', analysis);

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Error processing SMS reply:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
