import { Injectable } from '@nestjs/common';
import { Quote } from '../entities';

/**
 * PDF Generation Service using pure HTML-to-PDF approach
 * Uses a simple HTML template that can be converted to PDF
 */
@Injectable()
export class PdfService {
  /**
   * Generate a professional quote PDF
   */
  generateQuotePdf(quote: Quote): Buffer {
    const html = this.generateQuoteHtml(quote);

    // For server-side PDF generation, we'll use a simple approach
    // In production, you'd use puppeteer or a PDF service
    // For now, return HTML as a buffer that can be rendered
    return Buffer.from(html, 'utf-8');
  }

  /**
   * Generate HTML template for quote
   */
  generateQuoteHtml(quote: Quote): string {
    const leadName = quote.lead
      ? `${quote.lead.firstName} ${quote.lead.lastName}`
      : 'Customer';
    const leadEmail = quote.lead?.email || '';
    const leadPhone = quote.lead?.phone || '';

    const moveDate = quote.moveDate
      ? new Date(quote.moveDate).toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'TBC';

    const validUntil = quote.validUntil
      ? new Date(quote.validUntil).toLocaleDateString('en-GB')
      : '';

    const lineItemsHtml =
      quote.lineItems
        ?.map(
          (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">£${Number(item.unitPrice).toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">£${Number(item.amount).toFixed(2)}</td>
        </tr>
      `,
        )
        .join('') || '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quote ${quote.quoteNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      color: #1f2937;
      line-height: 1.5;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .logo { 
      font-size: 28px; 
      font-weight: 700; 
      color: #2563eb;
    }
    .logo span { color: #1f2937; }
    .quote-info { text-align: right; }
    .quote-number { 
      font-size: 24px; 
      font-weight: 600; 
      color: #2563eb;
    }
    .quote-date { color: #6b7280; margin-top: 4px; }
    
    .parties { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 30px;
    }
    .party { flex: 1; }
    .party-title { 
      font-size: 12px; 
      text-transform: uppercase; 
      color: #6b7280; 
      margin-bottom: 8px;
      font-weight: 600;
    }
    .party-name { font-size: 18px; font-weight: 600; }
    .party-detail { color: #4b5563; }
    
    .move-details {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .move-details h3 {
      font-size: 14px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .move-row {
      display: flex;
      margin-bottom: 8px;
    }
    .move-label { 
      width: 120px; 
      color: #6b7280; 
      font-weight: 500;
    }
    .move-value { font-weight: 500; }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 20px;
    }
    th { 
      background: #2563eb; 
      color: white; 
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
    th:nth-child(2) { text-align: center; }
    
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .total-row.grand {
      border-bottom: none;
      border-top: 2px solid #2563eb;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 20px;
      font-weight: 700;
      color: #2563eb;
    }
    
    .terms {
      margin-top: 40px;
      padding: 20px;
      background: #fef3c7;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }
    .terms h3 {
      font-size: 14px;
      text-transform: uppercase;
      color: #92400e;
      margin-bottom: 12px;
    }
    .terms pre {
      font-family: inherit;
      white-space: pre-wrap;
      color: #78350f;
      font-size: 13px;
    }
    
    .notes {
      margin-top: 20px;
      padding: 20px;
      background: #eff6ff;
      border-radius: 8px;
    }
    .notes h3 {
      font-size: 14px;
      text-transform: uppercase;
      color: #1e40af;
      margin-bottom: 8px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
    }
    
    .valid-until {
      margin-top: 20px;
      padding: 12px 20px;
      background: #fee2e2;
      border-radius: 8px;
      color: #991b1b;
      font-weight: 500;
      text-align: center;
    }
    
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Holdem<span>Removals</span></div>
      <div style="color: #6b7280; margin-top: 8px;">
        Professional Removal Services<br>
        office@holdemremovals.co.uk<br>
        01234 567890
      </div>
    </div>
    <div class="quote-info">
      <div class="quote-number">${quote.quoteNumber}</div>
      <div class="quote-date">Date: ${new Date(quote.createdAt).toLocaleDateString('en-GB')}</div>
      <div class="quote-date">Status: ${quote.status.toUpperCase()}</div>
    </div>
  </div>
  
  <div class="parties">
    <div class="party">
      <div class="party-title">Quote For</div>
      <div class="party-name">${leadName}</div>
      <div class="party-detail">${leadEmail}</div>
      <div class="party-detail">${leadPhone}</div>
    </div>
  </div>
  
  <div class="move-details">
    <h3>Move Details</h3>
    <div class="move-row">
      <div class="move-label">Move Date:</div>
      <div class="move-value">${moveDate}</div>
    </div>
    <div class="move-row">
      <div class="move-label">From:</div>
      <div class="move-value">${quote.fromAddress || 'TBC'}</div>
    </div>
    <div class="move-row">
      <div class="move-label">To:</div>
      <div class="move-value">${quote.toAddress || 'TBC'}</div>
    </div>
    ${
      quote.bedrooms
        ? `
    <div class="move-row">
      <div class="move-label">Bedrooms:</div>
      <div class="move-value">${quote.bedrooms}</div>
    </div>
    `
        : ''
    }
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHtml}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>£${Number(quote.subtotal).toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span>VAT (${Number(quote.vatRate)}%)</span>
      <span>£${Number(quote.vatAmount).toFixed(2)}</span>
    </div>
    <div class="total-row grand">
      <span>Total</span>
      <span>£${Number(quote.total).toFixed(2)}</span>
    </div>
    ${
      quote.deposit
        ? `
    <div class="total-row" style="margin-top: 12px; color: #059669;">
      <span>Deposit Required</span>
      <span>£${Number(quote.deposit).toFixed(2)}</span>
    </div>
    `
        : ''
    }
  </div>
  
  ${
    quote.notes
      ? `
  <div class="notes">
    <h3>Notes</h3>
    <p>${quote.notes}</p>
  </div>
  `
      : ''
  }
  
  ${
    quote.terms
      ? `
  <div class="terms">
    <h3>Terms & Conditions</h3>
    <pre>${quote.terms}</pre>
  </div>
  `
      : ''
  }
  
  ${
    validUntil
      ? `
  <div class="valid-until">
    ⚠️ This quote is valid until ${validUntil}
  </div>
  `
      : ''
  }
  
  <div class="footer">
    <p>Holdem Removals Ltd | Registered in England | Company No. 12345678</p>
    <p>Thank you for choosing Holdem Removals!</p>
  </div>
</body>
</html>
    `;
  }
}
