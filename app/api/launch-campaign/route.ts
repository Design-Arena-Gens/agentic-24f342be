import { NextRequest } from 'next/server';
import { Contact } from '@/lib/types';
import { executeOutreach, OutreachConfig } from '@/lib/outreach-engine';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { contacts, config } = body as { contacts: Contact[]; config: OutreachConfig };

        if (!contacts || contacts.length === 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'No contacts provided' })}\n\n`)
          );
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ status: `Starting campaign for ${contacts.length} contacts...` })}\n\n`
          )
        );

        for (let i = 0; i < contacts.length; i++) {
          const contact = contacts[i];

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ status: `Processing ${i + 1}/${contacts.length}: ${contact.fullName}` })}\n\n`
            )
          );

          const result = await executeOutreach(contact, config);

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ result })}\n\n`)
          );

          if (i < contacts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ status: 'Campaign completed!', completed: true })}\n\n`
          )
        );

        controller.close();
      } catch (error: any) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: error.message || 'Campaign failed' })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
