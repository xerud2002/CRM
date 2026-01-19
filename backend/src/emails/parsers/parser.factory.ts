import { Injectable, Logger } from '@nestjs/common';
import { BaseEmailParser, EmailParserResult } from './base.parser';
import { CompareMyMoveParser } from './comparemymove.parser';
import { ReallyMovingParser } from './reallymoving.parser';
import { GetAMoverParser } from './getamover.parser';
import { WebsiteParser } from './website.parser';
import { LeadSource } from '../../entities';

@Injectable()
export class EmailParserFactory {
  private readonly logger = new Logger(EmailParserFactory.name);
  private readonly parsers: BaseEmailParser[];

  constructor() {
    this.parsers = [
      new CompareMyMoveParser(),
      new ReallyMovingParser(),
      new GetAMoverParser(),
      new WebsiteParser(),
    ];
  }

  /**
   * Detect which parser to use based on email sender and subject
   */
  detectParser(from: string, subject: string): BaseEmailParser | null {
    for (const parser of this.parsers) {
      if (parser.canParse(from, subject)) {
        return parser;
      }
    }
    return null;
  }

  /**
   * Parse an email and extract lead data
   */
  parseEmail(
    from: string,
    subject: string,
    body: string,
    htmlBody?: string,
  ): EmailParserResult {
    const parser = this.detectParser(from, subject);

    if (!parser) {
      this.logger.warn(
        `No parser found for email from: ${from}, subject: ${subject}`,
      );
      return {
        success: false,
        error: 'No suitable parser found for this email format',
      };
    }

    this.logger.log(`Using ${parser.constructor.name} for email from ${from}`);
    return parser.parse(subject, body, htmlBody);
  }

  /**
   * Detect lead source from email sender
   */
  detectSource(from: string, subject: string): LeadSource {
    const fromLower = from.toLowerCase();

    if (fromLower.includes('comparemymove.com'))
      return LeadSource.COMPAREMYMOVE;
    if (fromLower.includes('reallymoving.com')) return LeadSource.REALLYMOVING;
    if (fromLower.includes('getamover.co.uk')) return LeadSource.GETAMOVER;
    if (
      fromLower.includes('holdemremovals.co.uk') &&
      subject.toLowerCase().includes('instant quote')
    ) {
      return LeadSource.WEBSITE;
    }

    return LeadSource.MANUAL;
  }
}
