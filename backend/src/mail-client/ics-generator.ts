/**
 * ICS Calendar File Generator
 * Generates .ics files for email attachments
 */

export interface CalendarEvent {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  organizerName?: string;
  organizerEmail?: string;
  attendeeName?: string;
  attendeeEmail?: string;
}

export class IcsGenerator {
  /**
   * Generate an ICS calendar file content
   */
  static generate(event: CalendarEvent): string {
    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@holdemremovals.co.uk`;
    const now = this.formatDate(new Date());
    const start = this.formatDate(event.startDate);
    const end = this.formatDate(event.endDate);

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Holdem Removals//CRM//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${this.escapeText(event.title)}`,
      `DESCRIPTION:${this.escapeText(event.description)}`,
    ];

    if (event.location) {
      icsContent.push(`LOCATION:${this.escapeText(event.location)}`);
    }

    if (event.organizerEmail) {
      icsContent.push(
        `ORGANIZER;CN=${event.organizerName || 'Holdem Removals'}:mailto:${event.organizerEmail}`,
      );
    }

    if (event.attendeeEmail) {
      icsContent.push(
        `ATTENDEE;CN=${event.attendeeName || 'Customer'};RSVP=TRUE:mailto:${event.attendeeEmail}`,
      );
    }

    icsContent.push(
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR',
    );

    return icsContent.join('\r\n');
  }

  /**
   * Generate ICS for a video call assessment
   */
  static generateVideoCallInvite(data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    assessmentDate: Date;
    durationMinutes: number;
    method: 'whatsapp' | 'zoom' | 'phone';
    staffName?: string;
    staffEmail?: string;
  }): string {
    const endDate = new Date(data.assessmentDate);
    endDate.setMinutes(endDate.getMinutes() + data.durationMinutes);

    const methodText = {
      whatsapp: 'WhatsApp Video Call',
      zoom: 'Zoom Video Call',
      phone: 'Phone Call',
    }[data.method];

    return this.generate({
      title: `Holdem Removals - Video Survey (${methodText})`,
      description:
        `Video survey for your upcoming move.\\n\\n` +
        `Method: ${methodText}\\n` +
        `We will call you on: ${data.customerPhone}\\n\\n` +
        `Please have access to all rooms you want surveyed.\\n\\n` +
        `Contact: ${data.staffName || 'Holdem Removals'}\\n` +
        `Phone: 01onal 567890`,
      startDate: data.assessmentDate,
      endDate: endDate,
      organizerName: data.staffName || 'Holdem Removals',
      organizerEmail: data.staffEmail || 'office@holdemremovals.co.uk',
      attendeeName: data.customerName,
      attendeeEmail: data.customerEmail,
    });
  }

  /**
   * Generate ICS for an in-person survey
   */
  static generateInPersonInvite(data: {
    customerName: string;
    customerEmail: string;
    address: string;
    assessmentDate: Date;
    durationMinutes: number;
    staffName?: string;
    staffEmail?: string;
  }): string {
    const endDate = new Date(data.assessmentDate);
    endDate.setMinutes(endDate.getMinutes() + data.durationMinutes);

    return this.generate({
      title: 'Holdem Removals - In-Person Survey',
      description:
        `In-person survey at your property for your upcoming move.\\n\\n` +
        `Our surveyor will assess all items to be moved and provide an accurate quote.\\n\\n` +
        `Please ensure access to all rooms and areas.\\n\\n` +
        `Contact: ${data.staffName || 'Holdem Removals'}\\n` +
        `Phone: 01234 567890`,
      location: data.address,
      startDate: data.assessmentDate,
      endDate: endDate,
      organizerName: data.staffName || 'Holdem Removals',
      organizerEmail: data.staffEmail || 'office@holdemremovals.co.uk',
      attendeeName: data.customerName,
      attendeeEmail: data.customerEmail,
    });
  }

  /**
   * Generate ICS for a booking confirmation
   */
  static generateBookingInvite(data: {
    customerName: string;
    customerEmail: string;
    fromAddress: string;
    toAddress: string;
    moveDate: Date;
    staffName?: string;
    staffEmail?: string;
  }): string {
    // Moving day typically starts at 8am and ends at 6pm
    const startDate = new Date(data.moveDate);
    startDate.setHours(8, 0, 0, 0);
    const endDate = new Date(data.moveDate);
    endDate.setHours(18, 0, 0, 0);

    return this.generate({
      title: 'Holdem Removals - Moving Day',
      description:
        `Your removal is booked!\\n\\n` +
        `Moving from: ${data.fromAddress}\\n` +
        `Moving to: ${data.toAddress}\\n\\n` +
        `Our team will arrive between 8:00 AM - 9:00 AM.\\n\\n` +
        `Please ensure:\\n` +
        `- All items are packed and ready\\n` +
        `- Clear access to both properties\\n` +
        `- Parking space for removal van\\n\\n` +
        `Contact on the day: 01234 567890`,
      location: data.fromAddress,
      startDate: startDate,
      endDate: endDate,
      organizerName: data.staffName || 'Holdem Removals',
      organizerEmail: data.staffEmail || 'office@holdemremovals.co.uk',
      attendeeName: data.customerName,
      attendeeEmail: data.customerEmail,
    });
  }

  /**
   * Format date to ICS format (YYYYMMDDTHHmmssZ)
   */
  private static formatDate(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  }

  /**
   * Escape special characters in ICS text
   */
  private static escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }
}
