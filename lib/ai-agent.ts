import Anthropic from '@anthropic-ai/sdk';
import { Contact } from './types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface MessageGenerationParams {
  contact: Contact;
  template: string;
  tone: 'sales' | 'support' | 'reminder' | 'follow-up';
  language: string;
  channel: 'SMS' | 'Call' | 'Email';
}

export async function generatePersonalizedMessage(params: MessageGenerationParams): Promise<string> {
  const { contact, template, tone, language, channel } = params;

  const channelGuidelines = {
    SMS: 'Keep it under 160 characters, concise and actionable.',
    Call: 'Write a natural conversational script for text-to-speech. Use proper pauses and inflection markers.',
    Email: 'Write a complete email with subject line, greeting, body, and signature. Professional formatting.'
  };

  const toneDescriptions = {
    sales: 'persuasive and value-focused',
    support: 'helpful and empathetic',
    reminder: 'gentle and informative',
    'follow-up': 'courteous and persistent'
  };

  const variables = {
    name: contact.fullName,
    firstName: contact.fullName.split(' ')[0],
    ...contact.customVariables
  };

  let processedTemplate = template;
  for (const [key, value] of Object.entries(variables)) {
    processedTemplate = processedTemplate.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }

  const prompt = `You are an expert copywriter creating ${tone} outreach messages.

Channel: ${channel}
Language: ${language}
Tone: ${toneDescriptions[tone]}
Guidelines: ${channelGuidelines[channel]}

Template with variables filled in:
${processedTemplate}

Contact details:
- Name: ${contact.fullName}
- Country: ${contact.country || 'Unknown'}

Create a personalized, ${tone} message for ${channel} that:
1. Uses the template as a base but enhances it naturally
2. Feels personal and not automated
3. Follows the channel guidelines strictly
4. Is in ${language}
5. Includes a clear call-to-action

${channel === 'Email' ? 'Format as:\nSubject: [subject line]\n\n[email body]' : 'Return only the message text, no metadata.'}`;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: channel === 'SMS' ? 256 : 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return text.trim();
}

export async function analyzeResponse(
  originalMessage: string,
  response: string,
  context: string
): Promise<{
  intent: 'interested' | 'not_interested' | 'ask_later' | 'unsubscribe' | 'question';
  confidence: number;
  suggestedReply?: string;
  needsEscalation: boolean;
}> {
  const prompt = `Analyze this customer response to our outreach message.

Our message: ${originalMessage}

Their response: ${response}

Context: ${context}

Classify their intent as one of:
- interested: They want to proceed, learn more, or take action
- not_interested: They declined or said no
- ask_later: They want to be contacted later
- unsubscribe: They want to stop receiving messages
- question: They have a question or need clarification

Also determine:
1. Confidence level (0-100)
2. Whether this needs human escalation
3. A suggested automated reply if appropriate

Respond in JSON format:
{
  "intent": "interested|not_interested|ask_later|unsubscribe|question",
  "confidence": 85,
  "suggestedReply": "optional reply text",
  "needsEscalation": false,
  "reasoning": "brief explanation"
}`;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return {
      intent: parsed.intent || 'question',
      confidence: parsed.confidence || 50,
      suggestedReply: parsed.suggestedReply,
      needsEscalation: parsed.needsEscalation || false
    };
  } catch {
    return {
      intent: 'question',
      confidence: 30,
      needsEscalation: true
    };
  }
}

export async function generateCallScript(params: MessageGenerationParams): Promise<{
  greeting: string;
  mainPitch: string;
  objectionHandlers: Record<string, string>;
  closing: string;
}> {
  const { contact, template, tone, language } = params;

  const prompt = `Create a voice call script for an AI agent making an outbound call.

Contact: ${contact.fullName}
Template: ${template}
Tone: ${tone}
Language: ${language}

Generate a structured call script with:
1. Greeting (warm introduction)
2. Main pitch (value proposition based on template)
3. Common objection handlers (3-4 scenarios)
4. Closing (call-to-action)

Return as JSON:
{
  "greeting": "...",
  "mainPitch": "...",
  "objectionHandlers": {
    "not_interested": "...",
    "too_busy": "...",
    "need_more_info": "..."
  },
  "closing": "..."
}`;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return parsed;
  } catch {
    return {
      greeting: `Hi ${contact.fullName}, this is an automated call.`,
      mainPitch: template,
      objectionHandlers: {},
      closing: 'Thank you for your time.'
    };
  }
}
