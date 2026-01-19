/**
 * Test script for email parsers
 * Run with: npx ts-node src/test-parsers.ts
 */

import { EmailParserFactory } from './emails/parsers';

const parserFactory = new EmailParserFactory();

// Test data for each parser
const testEmails = [
  {
    name: 'CompareMyMove',
    from: 'accounts@comparemymove.com',
    subject: 'Removals lead from comparemymove.com (John Smith)',
    body: `
      <html>
        <body>
          <h2>New Removal Lead</h2>
          <p>Customer: John Smith</p>
          <p>Email: john.smith@email.com</p>
          <p>Phone: 07700 900123</p>
          <p>Moving from: 45 High Street, London, NW1 2AB</p>
          <p>Moving to: 12 Oak Avenue, Manchester, M1 5GH</p>
          <p>Move date: 15/03/2026</p>
          <p>Bedrooms: 3</p>
          <p>Additional services: Packing required</p>
        </body>
      </html>
    `,
  },
  {
    name: 'ReallyMoving',
    from: 'manuallead@reallymoving.com',
    subject: 'New removal enquiry - Jane Doe',
    body: `
      New removal lead from ReallyMoving.com
      
      Name: Jane Doe
      Email: jane.doe@gmail.com
      Phone: 07800 123456
      
      From: 22 Park Lane, Birmingham, B1 1AA
      To: 88 River Road, Leeds, LS1 2BB
      
      Move Date: 01-04-2026
      Property: 2 bedroom flat
      
      Notes: Needs piano moving
    `,
  },
  {
    name: 'GetAMover',
    from: 'info@getamover.co.uk',
    subject: 'Removal Quote Request',
    body: `
      <html>
        <body>
          <h1>New Quote Request</h1>
          <table>
            <tr><td>Name:</td><td>Mike Johnson</td></tr>
            <tr><td>Email:</td><td>mike.j@hotmail.com</td></tr>
            <tr><td>Phone:</td><td>07900 456789</td></tr>
            <tr><td>From Address:</td><td>15 Queen St, Bristol, BS1 4DJ</td></tr>
            <tr><td>To Address:</td><td>30 King Road, Cardiff, CF10 3NP</td></tr>
            <tr><td>Moving Date:</td><td>2026-05-20</td></tr>
            <tr><td>Bedrooms:</td><td>4</td></tr>
          </table>
        </body>
      </html>
    `,
  },
  {
    name: 'Website (Instant Quote)',
    from: 'noreply@holdemremovals.co.uk',
    subject: 'New Instant Quote Request',
    body: `
      <html>
        <body>
          <h2>Instant Quote Form Submission</h2>
          <p><strong>Customer Details:</strong></p>
          <p>Name: Sarah Williams</p>
          <p>Email: sarah.w@yahoo.com</p>
          <p>Phone: 07777 888999</p>
          
          <p><strong>Move Details:</strong></p>
          <p>From: 5 Church Lane, Northampton, NN1 2PQ</p>
          <p>To: 10 Mill Way, Milton Keynes, MK9 3AB</p>
          <p>Date: 10 June 2026</p>
          <p>Bedrooms: 3 bed house</p>
          
          <p>Packing service: Yes</p>
        </body>
      </html>
    `,
  },
];

console.log('='.repeat(60));
console.log('EMAIL PARSER TEST');
console.log('='.repeat(60));

for (const testEmail of testEmails) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Testing: ${testEmail.name}`);
  console.log(`From: ${testEmail.from}`);
  console.log(`Subject: ${testEmail.subject}`);
  console.log(`${'─'.repeat(60)}`);

  // Check if parser is detected
  const parser = parserFactory.detectParser(testEmail.from, testEmail.subject);

  if (!parser) {
    console.log('❌ No parser found for this email');
    continue;
  }

  console.log(`✓ Parser detected: ${parser.constructor.name}`);

  // Parse the email
  const result = parserFactory.parseEmail(
    testEmail.from,
    testEmail.subject,
    testEmail.body,
    testEmail.body,
  );

  if (!result.success) {
    console.log(`❌ Parse failed: ${result.error}`);
    continue;
  }

  console.log('✓ Parse successful!');
  console.log('\nExtracted Lead Data:');
  console.log(JSON.stringify(result.lead, null, 2));

  // Detect source
  const source = parserFactory.detectSource(testEmail.from, testEmail.subject);
  console.log(`\nDetected Source: ${source}`);
}

console.log('\n' + '='.repeat(60));
console.log('TEST COMPLETE');
console.log('='.repeat(60));
