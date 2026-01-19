import {
  BaseEmailParser,
  EmailParserResult,
  ParsedLeadData,
} from './base.parser';
import { LeadSource } from '../../entities';

/**
 * Parser for GetAMover leads
 * From: info@getamover.co.uk
 * Subject: "New Quote Request: Name, lead ID XXXXX"
 * Format: HTML email
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

      // Extract phone - look for "Telephone:" pattern
      const phoneMatch = text.match(/(?:telephone|phone|tel)[:\s]*([^<\n]+)/i);
      if (phoneMatch) {
        lead.phone = this.extractPhone(phoneMatch[1]) || phoneMatch[1].trim();
      }

      // Extract move date
      const dateMatch = text.match(
        /(?:planned\s*moving\s*date|move\s*date)[:\s]*([^<\n]+)/i,
      );
      if (dateMatch) {
        lead.moveDate = this.parseDate(dateMatch[1]);
      }

      // Extract bedrooms
      const bedroomMatch = text.match(
        /(?:number\s*of\s*bedrooms|bedrooms)[:\s]*(\d+)/i,
      );
      if (bedroomMatch) {
        lead.bedrooms = parseInt(bedroomMatch[1], 10);
      } else {
        lead.bedrooms = this.extractBedrooms(text);
      }

      // Extract addresses - GetAMover has structured format
      // Moving from section
      const fromSection = text.match(/moving\s*from[\s\S]*?(?=moving\s*to|$)/i);
      if (fromSection) {
        const fromText = fromSection[0];
        lead.fromPostcode = this.extractPostcode(fromText);

        const addressMatch = fromText.match(/(?:address)[:\s]*([^<\n]+)/i);
        if (addressMatch) lead.fromAddress = addressMatch[1].trim();

        const propertyMatch = fromText.match(/(?:property)[:\s]*([^<\n]+)/i);
        if (propertyMatch) lead.fromPropertyType = propertyMatch[1].trim();
      }

      // Moving to section
      const toSection = text.match(/moving\s*to[\s\S]*?(?=details|$)/i);
      if (toSection) {
        const toText = toSection[0];
        lead.toPostcode = this.extractPostcode(toText);

        const addressMatch = toText.match(/(?:address)[:\s]*([^<\n]+)/i);
        if (addressMatch) lead.toAddress = addressMatch[1].trim();

        const propertyMatch = toText.match(/(?:property)[:\s]*([^<\n]+)/i);
        if (propertyMatch) lead.toPropertyType = propertyMatch[1].trim();
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
