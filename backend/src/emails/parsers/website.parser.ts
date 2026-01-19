import {
  BaseEmailParser,
  EmailParserResult,
  ParsedLeadData,
} from './base.parser';
import { LeadSource } from '../../entities';

/**
 * Parser for internal website quote requests
 * From: office@holdemremovals.co.uk (own domain)
 * Subject: "New Instant Quote by Name moving from POSTCODE on DATE"
 * Format: HTML with potential PDF attachment
 */
export class WebsiteParser extends BaseEmailParser {
  canParse(from: string, subject: string): boolean {
    return (
      from.toLowerCase().includes('holdemremovals.co.uk') &&
      subject.toLowerCase().includes('instant quote')
    );
  }

  parse(subject: string, body: string, htmlBody?: string): EmailParserResult {
    try {
      const text = htmlBody || body;
      const lead: ParsedLeadData = {
        source: LeadSource.WEBSITE,
      };

      // Extract from subject: "New Instant Quote by John Smith moving from NN1 2AB on 15/02/2026"
      const subjectMatch = subject.match(
        /by\s+([^]+?)\s+moving\s+from\s+([A-Z0-9\s]+)\s+on\s+(.+)/i,
      );
      if (subjectMatch) {
        const { firstName, lastName } = this.splitName(subjectMatch[1]);
        lead.firstName = firstName;
        lead.lastName = lastName;
        lead.fromPostcode = subjectMatch[2].trim().toUpperCase();
        lead.moveDate = this.parseDate(subjectMatch[3]);
      }

      // Extract email
      lead.email = this.extractEmail(text);

      // Extract phone
      lead.phone = this.extractPhone(text);

      // Extract customer name if not found in subject
      if (!lead.firstName) {
        const nameMatch = text.match(
          /(?:customer\s*name|name)[:\s]*([^<\n]+)/i,
        );
        if (nameMatch) {
          const { firstName, lastName } = this.splitName(nameMatch[1]);
          lead.firstName = firstName;
          lead.lastName = lastName;
        }
      }

      // Extract postcodes
      const exitMatch = text.match(
        /(?:exit\s*postcode|from\s*postcode)[:\s]*([^<\n]+)/i,
      );
      if (exitMatch) {
        lead.fromPostcode =
          this.extractPostcode(exitMatch[1]) || exitMatch[1].trim();
      }

      const destMatch = text.match(
        /(?:destination|to\s*postcode)[:\s]*([^<\n]+)/i,
      );
      if (destMatch) {
        lead.toPostcode =
          this.extractPostcode(destMatch[1]) || destMatch[1].trim();
      }

      // Extract services
      const packingMatch = text.match(
        /packing\s*(?:services?)?[:\s]*(yes|no|true|false)/i,
      );
      if (packingMatch) {
        lead.packingRequired = ['yes', 'true'].includes(
          packingMatch[1].toLowerCase(),
        );
      }

      const cleaningMatch = text.match(
        /cleaning\s*(?:services?)?[:\s]*(yes|no|true|false)/i,
      );
      if (cleaningMatch) {
        lead.cleaningRequired = ['yes', 'true'].includes(
          cleaningMatch[1].toLowerCase(),
        );
      }

      // Extract notes
      const notesMatch = text.match(
        /(?:special\s*notes|notes|comments)[:\s]*([^<\n]+)/i,
      );
      if (notesMatch) {
        lead.notes = notesMatch[1].trim();
      }

      return { success: true, lead };
    } catch (error) {
      return {
        success: false,
        error: `Website parser error: ${(error as Error).message}`,
      };
    }
  }
}
