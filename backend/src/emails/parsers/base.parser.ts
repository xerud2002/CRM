import { LeadSource } from '../../entities';

export interface ParsedLeadData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  externalRef?: string;
  moveDate?: Date;
  fromAddress?: string;
  fromPostcode?: string;
  fromPropertyType?: string;
  toAddress?: string;
  toPostcode?: string;
  toPropertyType?: string;
  bedrooms?: number;
  distanceMiles?: number;
  packingRequired?: boolean;
  cleaningRequired?: boolean;
  notes?: string;
}

export interface EmailParserResult {
  success: boolean;
  lead?: ParsedLeadData;
  error?: string;
}

export abstract class BaseEmailParser {
  abstract canParse(from: string, subject: string): boolean;
  abstract parse(
    subject: string,
    body: string,
    htmlBody?: string,
  ): EmailParserResult;

  protected extractPostcode(text: string): string | undefined {
    // UK postcode regex
    const postcodeRegex = /\b([A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2})\b/gi;
    const match = text.match(postcodeRegex);
    return match ? match[0].toUpperCase().replace(/\s+/g, ' ') : undefined;
  }

  protected extractEmail(text: string): string | undefined {
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/i;
    const match = text.match(emailRegex);
    return match ? match[0].toLowerCase() : undefined;
  }

  protected extractPhone(text: string): string | undefined {
    // UK phone numbers
    const phoneRegex =
      /(?:(?:\+44\s?|0)(?:7\d{3}|\d{4})\s?\d{3}\s?\d{3}|\d{5}\s?\d{6})/;
    const match = text.match(phoneRegex);
    return match ? match[0].replace(/\s/g, '') : undefined;
  }

  protected parseDate(text: string): Date | undefined {
    // Try various date formats
    const datePatterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // DD/MM/YYYY or DD-MM-YYYY
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD or YYYY-MM-DD
      /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const date = new Date(match[0]);
          if (!isNaN(date.getTime())) return date;
        } catch {}
      }
    }
    return undefined;
  }

  protected extractBedrooms(text: string): number | undefined {
    const bedroomRegex = /(\d+)\s*(?:bed(?:room)?s?|br)/i;
    const match = text.match(bedroomRegex);
    return match ? parseInt(match[1], 10) : undefined;
  }

  protected splitName(fullName: string): {
    firstName: string;
    lastName: string;
  } {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }
}
