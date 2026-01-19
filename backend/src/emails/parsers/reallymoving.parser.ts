import {
  BaseEmailParser,
  EmailParserResult,
  ParsedLeadData,
} from './base.parser';
import { LeadSource } from '../../entities';

/**
 * Parser for ReallyMoving leads
 * From: manuallead@reallymoving.com
 * Subject: "Manual quote - X bedroom - XX miles - Name (RefNumber)"
 * Format: Plain text
 */
export class ReallyMovingParser extends BaseEmailParser {
  canParse(from: string, subject: string): boolean {
    return from.toLowerCase().includes('reallymoving.com');
  }

  parse(subject: string, body: string, htmlBody?: string): EmailParserResult {
    try {
      const text = body; // ReallyMoving uses plain text
      const lead: ParsedLeadData = {
        source: LeadSource.REALLYMOVING,
      };

      // Extract info from subject: "Manual quote - 3 bedroom - 45 miles - John Smith (RM12345)"
      const subjectMatch = subject.match(
        /(\d+)\s*bedroom.*?(\d+)\s*miles.*?-\s*([^(]+)\(([^)]+)\)/i,
      );
      if (subjectMatch) {
        lead.bedrooms = parseInt(subjectMatch[1], 10);
        lead.distanceMiles = parseInt(subjectMatch[2], 10);
        const { firstName, lastName } = this.splitName(subjectMatch[3]);
        lead.firstName = firstName;
        lead.lastName = lastName;
        lead.externalRef = subjectMatch[4].trim();
      }

      // Parse line by line for ReallyMoving format
      const lines = text.split('\n');
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        if (!value) continue;

        const keyLower = key.toLowerCase().trim();

        if (keyLower.includes('name') && !lead.firstName) {
          const { firstName, lastName } = this.splitName(value);
          lead.firstName = firstName;
          lead.lastName = lastName;
        }
        if (keyLower.includes('email')) {
          lead.email = this.extractEmail(value) || value.trim();
        }
        if (keyLower.includes('phone') || keyLower.includes('tel')) {
          lead.phone = this.extractPhone(value) || value.replace(/\s/g, '');
        }
        if (
          keyLower.includes('moving from') ||
          keyLower.includes('from address')
        ) {
          lead.fromAddress = value;
          lead.fromPostcode = this.extractPostcode(value);
        }
        if (keyLower.includes('moving to') || keyLower.includes('to address')) {
          lead.toAddress = value;
          lead.toPostcode = this.extractPostcode(value);
        }
        if (
          keyLower.includes('move date') ||
          keyLower.includes('estimated move')
        ) {
          lead.moveDate = this.parseDate(value);
        }
        if (keyLower.includes('move size') && !lead.bedrooms) {
          lead.bedrooms = this.extractBedrooms(value);
        }
        if (keyLower.includes('reference') && !lead.externalRef) {
          lead.externalRef = value;
        }
        if (
          keyLower.includes('special instruction') ||
          keyLower.includes('notes')
        ) {
          lead.notes = value;
        }
      }

      return { success: true, lead };
    } catch (error) {
      return {
        success: false,
        error: `ReallyMoving parser error: ${(error as Error).message}`,
      };
    }
  }
}
