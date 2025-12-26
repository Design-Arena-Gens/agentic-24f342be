import { z } from 'zod';

export const ContactSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  country: z.string().optional(),
  timeZone: z.string().optional(),
  preferredContactMethod: z.enum(['SMS', 'Call', 'Email', 'Auto']).default('Auto'),
  status: z.enum(['New', 'Contacted', 'Replied', 'Do Not Contact', 'Failed']).default('New'),
  customVariables: z.record(z.string()).optional(),
});

export type Contact = z.infer<typeof ContactSchema>;

export interface Campaign {
  id: string;
  name: string;
  contacts: Contact[];
  messageTemplate: string;
  tone: 'sales' | 'support' | 'reminder' | 'follow-up';
  language: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  stats: {
    total: number;
    sent: number;
    replied: number;
    failed: number;
  };
}

export interface OutreachResult {
  contactName: string;
  channel: string;
  success: boolean;
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface ConversationContext {
  contactName: string;
  channel: 'SMS' | 'Call' | 'Email';
  history: Array<{
    role: 'agent' | 'contact';
    content: string;
    timestamp: Date;
  }>;
  intent?: 'interested' | 'not_interested' | 'ask_later' | 'unsubscribe';
  needsEscalation: boolean;
}
