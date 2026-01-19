import {
  BaseEmailParser,
  EmailParserResult,
  ParsedLeadData,
} from './base.parser';
import { LeadSource } from '../../entities';

/**
 * Parser for CompareMyMove leads
 * From: accounts@comparemymove.com
 * Subject: "Removals lead from comparemymove.com (Name)"
 * Format: HTML email
 */
export class CompareMyMoveParser extends BaseEmailParser {
  canParse(from: string, subject: string): boolean {
    return from.toLowerCase().includes('comparemymove.com');
  }

  parse(subject: string, body: string, htmlBody?: string): EmailParserResult {
    try {
      const text = htmlBody || body;
      const lead: ParsedLeadData = {
        source: LeadSource.COMPAREMYMOVE,
      };

      // Extract name from subject: "Removals lead from comparemymove.com (John Smith)"
      const nameMatch = subject.match(/\(([^)]+)\)/);
      if (nameMatch) {
        const { firstName, lastName } = this.splitName(nameMatch[1]);
        lead.firstName = firstName;
        lead.lastName = lastName;
      }

      // Extract email
      lead.email = this.extractEmail(text);

      // Extract phone
      lead.phone = this.extractPhone(text);

      // Extract postcodes - look for patterns like "Moving from: XX1 1XX" and "Moving to: YY2 2YY"
      const fromMatch = text.match(
        /(?:moving\s*from|current\s*address|from)[:\s]*([^<\n]+)/i,
      );
      const toMatch = text.match(
        /(?:moving\s*to|new\s*address|to)[:\s]*([^<\n]+)/i,
      );

      if (fromMatch) {
        lead.fromPostcode = this.extractPostcode(fromMatch[1]);
        lead.fromAddress = fromMatch[1].trim().substring(0, 200);
      }
      if (toMatch) {
        lead.toPostcode = this.extractPostcode(toMatch[1]);
        lead.toAddress = toMatch[1].trim().substring(0, 200);
      }

      // Extract move date
      const dateMatch = text.match(
        /(?:move\s*date|moving\s*date|date)[:\s]*([^<\n]+)/i,
      );
      if (dateMatch) {
        lead.moveDate = this.parseDate(dateMatch[1]);
      }

      // Extract bedrooms
      lead.bedrooms = this.extractBedrooms(text);

      // Additional services as notes
      const servicesMatch = text.match(
        /(?:additional\s*services|services)[:\s]*([^<\n]+)/i,
      );
      const additionalMatch = text.match(
        /(?:additional\s*information|notes)[:\s]*([^<\n]+)/i,
      );
      const notes: string[] = [];
      if (servicesMatch) notes.push(`Services: ${servicesMatch[1].trim()}`);
      if (additionalMatch)
        notes.push(`Additional: ${additionalMatch[1].trim()}`);
      if (notes.length > 0) lead.notes = notes.join('\n');

      return { success: true, lead };
    } catch (error) {
      return {
        success: false,
        error: `CompareMyMove parser error: ${(error as Error).message}`,
      };
    }
  }
}
