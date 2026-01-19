import {
  BaseEmailParser,
  EmailParserResult,
  ParsedLeadData,
} from './base.parser';
import { LeadSource } from '../../entities';

/**
 * Parser for GetAMover leads
 * From: info@getamover.co.uk
 * Subject: "New Quote Request: Name, lead ID XXXXX" or just "Removal Quote Request"
 * Format: HTML email (often table-based)
 */
export class GetAMoverParser extends BaseEmailParser {
  canParse(from: string, _subject: string): boolean {
    return from.toLowerCase().includes('getamover.co.uk');
  }

  parse(subject: string, body: string, htmlBody?: string): EmailParserResult {
    try {
      const text = htmlBody || body;
      const lead: ParsedLeadData = {
        source: LeadSource.GETAMOVER,
      };

      // Extract from subject: "New Quote Request: John Smith, lead ID 12345"
      const subjectMatch = subject.match(
        /New Quote Request:\s*([^,]+),\s*lead\s*ID\s*(\d+)/i,
      );
      if (subjectMatch) {
        const { firstName, lastName } = this.splitName(subjectMatch[1]);
        lead.firstName = firstName;
        lead.lastName = lastName;
        lead.externalRef = `GA${subjectMatch[2]}`;
      }

      // Extract email
      lead.email = this.extractEmail(text);

      // Extract phone - look for various patterns
      const phoneMatch = text.match(/(?:telephone|phone|tel)[:\s]*([^<\n]+)/i);
      if (phoneMatch) {
        lead.phone = this.extractPhone(phoneMatch[1]) || phoneMatch[1].trim().replace(/[^0-9+]/g, '');
      } else {
        lead.phone = this.extractPhone(text);
      }

      // Extract name from table format: <td>Name:</td><td>John Smith</td>
      const nameTableMatch = text.match(/<td[^>]*>\s*Name:?\s*<\/td>\s*<td[^>]*>\s*([^<]+)/i);
      if (nameTableMatch && !lead.firstName) {
        const { firstName, lastName } = this.splitName(nameTableMatch[1].trim());
        lead.firstName = firstName;
        lead.lastName = lastName;
      }

      // Extract from address from table
      const fromAddressMatch = text.match(/<td[^>]*>\s*(?:From\s*Address|Moving\s*From):?\s*<\/td>\s*<td[^>]*>\s*([^<]+)/i);
      if (fromAddressMatch) {
        lead.fromAddress = fromAddressMatch[1].trim();
        lead.fromPostcode = this.extractPostcode(lead.fromAddress);
      }

      // Extract to address from table
      const toAddressMatch = text.match(/<td[^>]*>\s*(?:To\s*Address|Moving\s*To):?\s*<\/td>\s*<td[^>]*>\s*([^<]+)/i);
      if (toAddressMatch) {
        lead.toAddress = toAddressMatch[1].trim();
        lead.toPostcode = this.extractPostcode(lead.toAddress);
      }

      // Extract move date from table
      const dateTableMatch = text.match(/<td[^>]*>\s*(?:Moving\s*Date|Date):?\s*<\/td>\s*<td[^>]*>\s*([^<]+)/i);
      if (dateTableMatch) {
        lead.moveDate = this.parseDate(dateTableMatch[1]);
      }

      // Extract bedrooms from table
      const bedroomTableMatch = text.match(/<td[^>]*>\s*Bedrooms?:?\s*<\/td>\s*<td[^>]*>\s*(\d+)/i);
      if (bedroomTableMatch) {
        lead.bedrooms = parseInt(bedroomTableMatch[1], 10);
      }

      // Fallback: Extract move date from text
      if (!lead.moveDate) {
        const dateMatch = text.match(
          /(?:planned\s*moving\s*date|move\s*date|moving\s*date)[:\s]*([^<\n]+)/i,
        );
        if (dateMatch) {
          lead.moveDate = this.parseDate(dateMatch[1]);
        }
      }

      // Fallback: Extract bedrooms from text
      if (!lead.bedrooms) {
        const bedroomMatch = text.match(
          /(?:number\s*of\s*bedrooms|bedrooms)[:\s]*(\d+)/i,
        );
        if (bedroomMatch) {
          lead.bedrooms = parseInt(bedroomMatch[1], 10);
        } else {
          lead.bedrooms = this.extractBedrooms(text);
        }
      }

      // Fallback: Moving from section (non-table format)
      if (!lead.fromAddress) {
        const fromSection = text.match(/moving\s*from[\s\S]*?(?=moving\s*to|$)/i);
        if (fromSection) {
          const fromText = fromSection[0];
          lead.fromPostcode = this.extractPostcode(fromText);
          const addressMatch = fromText.match(/(?:address)[:\s]*([^<\n]+)/i);
          if (addressMatch) lead.fromAddress = addressMatch[1].trim();
        }
      }

      // Fallback: Moving to section (non-table format)
      if (!lead.toAddress) {
        const toSection = text.match(/moving\s*to[\s\S]*?(?=details|$)/i);
        if (toSection) {
          const toText = toSection[0];
          lead.toPostcode = this.extractPostcode(toText);
          const addressMatch = toText.match(/(?:address)[:\s]*([^<\n]+)/i);
          if (addressMatch) lead.toAddress = addressMatch[1].trim();
        }
      }

      // Category (Domestic/Commercial)
      const categoryMatch = text.match(/(?:category)[:\s]*([^<\n]+)/i);
      if (categoryMatch) {
        lead.notes = `Category: ${categoryMatch[1].trim()}`;
      }

      return { success: true, lead };
    } catch (error) {
      return {
        success: false,
        error: `GetAMover parser error: ${(error as Error).message}`,
      };
    }
  }
}
