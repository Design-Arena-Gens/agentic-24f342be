import * as XLSX from 'xlsx';
import { Contact, ContactSchema } from './types';

export interface ParseResult {
  valid: Contact[];
  invalid: Array<{ row: number; data: any; errors: string[] }>;
  duplicates: Array<{ row: number; contact: Contact }>;
}

export function parseExcelFile(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const valid: Contact[] = [];
  const invalid: Array<{ row: number; data: any; errors: string[] }> = [];
  const duplicates: Array<{ row: number; contact: Contact }> = [];
  const seen = new Set<string>();

  rawData.forEach((row, index) => {
    const normalized = normalizeRow(row);

    const validation = ContactSchema.safeParse(normalized);

    if (!validation.success) {
      invalid.push({
        row: index + 2,
        data: row,
        errors: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
      return;
    }

    const contact = validation.data;

    if (!contact.phoneNumber && !contact.email) {
      invalid.push({
        row: index + 2,
        data: row,
        errors: ['At least one contact method (phone or email) is required']
      });
      return;
    }

    const uniqueKey = `${contact.phoneNumber || ''}-${contact.email || ''}`;
    if (seen.has(uniqueKey)) {
      duplicates.push({ row: index + 2, contact });
      return;
    }

    seen.add(uniqueKey);
    valid.push(contact);
  });

  return { valid, invalid, duplicates };
}

function normalizeRow(row: any): Partial<Contact> {
  const phoneNumber = cleanPhoneNumber(
    row['Phone Number'] || row['phone'] || row['phoneNumber'] || row['Phone'] || ''
  );

  const email = cleanEmail(
    row['Email Address'] || row['email'] || row['Email'] || ''
  );

  return {
    fullName: String(row['Full Name'] || row['name'] || row['fullName'] || row['Name'] || '').trim(),
    phoneNumber: phoneNumber || undefined,
    email: email || undefined,
    country: String(row['Country'] || row['country'] || '').trim() || undefined,
    timeZone: String(row['Time Zone'] || row['timeZone'] || row['timezone'] || '').trim() || undefined,
    preferredContactMethod: normalizeContactMethod(
      row['Preferred Contact Method'] || row['preferredContactMethod'] || row['contactMethod'] || 'Auto'
    ),
    status: normalizeStatus(row['Status'] || row['status'] || 'New'),
    customVariables: extractCustomVariables(row)
  };
}

function cleanPhoneNumber(phone: string): string {
  const cleaned = String(phone).replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

function cleanEmail(email: string): string {
  return String(email).trim().toLowerCase();
}

function normalizeContactMethod(method: string): 'SMS' | 'Call' | 'Email' | 'Auto' {
  const normalized = String(method).toLowerCase().trim();
  if (normalized.includes('sms') || normalized.includes('text')) return 'SMS';
  if (normalized.includes('call') || normalized.includes('voice') || normalized.includes('phone')) return 'Call';
  if (normalized.includes('email') || normalized.includes('mail')) return 'Email';
  return 'Auto';
}

function normalizeStatus(status: string): 'New' | 'Contacted' | 'Replied' | 'Do Not Contact' | 'Failed' {
  const normalized = String(status).toLowerCase().trim();
  if (normalized.includes('contact') && !normalized.includes('not')) return 'Contacted';
  if (normalized.includes('repl')) return 'Replied';
  if (normalized.includes('not') || normalized.includes('dnc') || normalized.includes('block')) return 'Do Not Contact';
  if (normalized.includes('fail') || normalized.includes('error')) return 'Failed';
  return 'New';
}

function extractCustomVariables(row: any): Record<string, string> {
  const standardFields = [
    'Full Name', 'name', 'fullName', 'Name',
    'Phone Number', 'phone', 'phoneNumber', 'Phone',
    'Email Address', 'email', 'Email',
    'Country', 'country',
    'Time Zone', 'timeZone', 'timezone',
    'Preferred Contact Method', 'preferredContactMethod', 'contactMethod',
    'Status', 'status'
  ];

  const custom: Record<string, string> = {};

  for (const [key, value] of Object.entries(row)) {
    if (!standardFields.includes(key) && value) {
      custom[key] = String(value);
    }
  }

  return custom;
}

export function exportToExcel(contacts: Contact[]): Buffer {
  const data = contacts.map(c => ({
    'Full Name': c.fullName,
    'Phone Number': c.phoneNumber || '',
    'Email Address': c.email || '',
    'Country': c.country || '',
    'Time Zone': c.timeZone || '',
    'Preferred Contact Method': c.preferredContactMethod,
    'Status': c.status,
    ...c.customVariables
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
