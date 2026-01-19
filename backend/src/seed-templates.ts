import { DataSource } from 'typeorm';
import { EmailTemplate } from './entities';
import * as dotenv from 'dotenv';

dotenv.config();

const templates = [
  {
    name: 'Initial Introduction',
    category: 'Introduction',
    subject: 'Your Removal Enquiry - Holdem Removals',
    body: `Dear {{first_name}},

Thank you for your enquiry about your move from {{from_postcode}} to {{to_postcode}}.

To provide you with an accurate quote, we'd like to arrange a quick assessment of your belongings. Please choose your preferred option:

📹 <strong>Video Call Survey</strong> (15-20 minutes via WhatsApp)
Quick and convenient - show us around your home via video call and we'll provide a quote the same day.

🏠 <strong>In-Person Survey</strong> (30-45 minutes at your property)
One of our experienced surveyors will visit your property to assess your move requirements.

Please reply to this email with your preferred option and some availability, or call us on 01234 567890.

We look forward to helping you with your move!

Best regards,
{{staff_name}}
Holdem Removals
{{staff_phone}}`,
    variables: [
      'first_name',
      'from_postcode',
      'to_postcode',
      'staff_name',
      'staff_phone',
    ],
    includesCalendarInvite: false,
  },
  {
    name: 'Video Call Confirmation',
    category: 'Assessment',
    subject: 'Video Survey Confirmed - {{assessment_date}}',
    body: `Dear {{first_name}},

Your video survey has been booked! Here are the details:

📅 <strong>Date:</strong> {{assessment_date}}
⏰ <strong>Time:</strong> {{assessment_time}}
📱 <strong>Method:</strong> {{assessment_method}}

<strong>What to expect:</strong>
• We will call you on {{phone}} at the scheduled time
• The call will take approximately 15-20 minutes
• Please have access to all rooms you want us to assess
• Show us any items that need special care (antiques, pianos, etc.)

<strong>Tips for a successful video survey:</strong>
• Good lighting helps us see your items clearly
• Walk slowly through each room
• Don't forget garages, lofts, and sheds!

Please find attached a calendar invite for your records.

If you need to reschedule, please reply to this email or call us on {{staff_phone}}.

Best regards,
{{staff_name}}
Holdem Removals`,
    variables: [
      'first_name',
      'assessment_date',
      'assessment_time',
      'assessment_method',
      'phone',
      'staff_name',
      'staff_phone',
    ],
    includesCalendarInvite: true,
  },
  {
    name: 'In-Person Survey Confirmation',
    category: 'Assessment',
    subject: 'In-Person Survey Confirmed - {{assessment_date}}',
    body: `Dear {{first_name}},

Your in-person survey has been booked! Here are the details:

📅 <strong>Date:</strong> {{assessment_date}}
⏰ <strong>Time:</strong> {{assessment_time}}
📍 <strong>Address:</strong> {{from_address}}, {{from_postcode}}

<strong>What to expect:</strong>
• Our surveyor will arrive at the scheduled time
• The visit will take approximately 30-45 minutes
• We'll assess all items to be moved and discuss your requirements
• You'll receive a detailed quote within 24 hours

<strong>Please ensure:</strong>
• Access to all rooms, including loft, garage, and garden shed
• Let us know about any parking restrictions
• Inform us of any items requiring special handling

Please find attached a calendar invite for your records.

If you need to reschedule, please reply to this email or call us on {{staff_phone}}.

Best regards,
{{staff_name}}
Holdem Removals`,
    variables: [
      'first_name',
      'assessment_date',
      'assessment_time',
      'from_address',
      'from_postcode',
      'staff_name',
      'staff_phone',
    ],
    includesCalendarInvite: true,
  },
  {
    name: 'Quote Send',
    category: 'Quote',
    subject: 'Your Removal Quote - {{from_postcode}} to {{to_postcode}}',
    body: `Dear {{first_name}},

Thank you for allowing us to survey your property. Based on our assessment, we are pleased to provide you with the following quote:

<strong>Move Details:</strong>
📍 From: {{from_address}}, {{from_postcode}}
📍 To: {{to_address}}, {{to_postcode}}
📅 Preferred Date: {{move_date}}
🏠 Property Size: {{bedrooms}} bedrooms

<strong>Your Quote:</strong>
💷 <a href="{{quote_link}}" style="color: #2563eb; font-weight: bold;">Click here to view your detailed quote</a>

<strong>What's included:</strong>
• Professional removal team
• Fully equipped removal vehicle(s)
• Furniture blankets and protection
• Public liability insurance
• No hidden charges

<strong>Optional extras available:</strong>
• Packing service
• Packing materials
• Storage facilities
• End of tenancy cleaning

This quote is valid for 30 days. To accept, simply reply to this email or call us on {{staff_phone}}.

We look forward to helping you with your move!

Best regards,
{{staff_name}}
Holdem Removals`,
    variables: [
      'first_name',
      'from_address',
      'from_postcode',
      'to_address',
      'to_postcode',
      'move_date',
      'bedrooms',
      'quote_link',
      'staff_name',
      'staff_phone',
    ],
    includesCalendarInvite: false,
  },
  {
    name: 'Follow-up #1',
    category: 'Follow-up',
    subject: 'Following up on your removal enquiry - Holdem Removals',
    body: `Dear {{first_name}},

I hope this email finds you well. I wanted to follow up on the quote we sent for your move from {{from_postcode}} to {{to_postcode}}.

Have you had a chance to review it? If you have any questions or would like to discuss the quote further, I'd be happy to help.

Perhaps you'd like to:
• Discuss the quote in more detail
• Adjust the moving date
• Add or remove services
• Get information about our packing service

Please don't hesitate to reply to this email or give us a call on {{staff_phone}}.

Best regards,
{{staff_name}}
Holdem Removals`,
    variables: [
      'first_name',
      'from_postcode',
      'to_postcode',
      'staff_name',
      'staff_phone',
    ],
    includesCalendarInvite: false,
  },
  {
    name: 'Follow-up #2',
    category: 'Follow-up',
    subject: 'Quick check-in - Your upcoming move',
    body: `Hi {{first_name}},

Just a quick check-in regarding your upcoming move from {{from_postcode}} to {{to_postcode}}.

I understand that moving can be a busy time with lots to arrange. If you've decided to go with another company, no hard feelings - but if you're still considering your options, we'd love the opportunity to help.

<strong>Why choose Holdem Removals?</strong>
✓ Over 10 years of experience
✓ Fully insured and trained team
✓ Competitive pricing with no hidden fees
✓ Hundreds of 5-star reviews

If your plans have changed or you'd like an updated quote, just let me know.

Best regards,
{{staff_name}}
Holdem Removals
{{staff_phone}}`,
    variables: [
      'first_name',
      'from_postcode',
      'to_postcode',
      'staff_name',
      'staff_phone',
    ],
    includesCalendarInvite: false,
  },
  {
    name: 'Follow-up #3',
    category: 'Follow-up',
    subject: 'Final follow-up - Holdem Removals',
    body: `Dear {{first_name}},

This is just a final follow-up regarding your removal enquiry for {{from_postcode}} to {{to_postcode}}.

If you've already made arrangements for your move, we wish you all the best! However, if you're still looking for a removal company, our quote remains available and we can still accommodate your preferred moving date.

Should you need removal services in the future, please don't hesitate to get in touch. We're always here to help!

Best wishes,
{{staff_name}}
Holdem Removals
{{staff_phone}}`,
    variables: [
      'first_name',
      'from_postcode',
      'to_postcode',
      'staff_name',
      'staff_phone',
    ],
    includesCalendarInvite: false,
  },
  {
    name: 'Booking Confirmation',
    category: 'Booking',
    subject: 'Booking Confirmed - {{service_type}} on {{move_date}}',
    body: `Dear {{first_name}},

Great news! Your booking has been confirmed. Here are the details:

<strong>📋 Service: {{service_type}}</strong>
<strong>⏰ Arrival Time: {{start_time}}</strong>

{{job_schedule}}

<strong>Collection Address:</strong>
📍 {{from_address}}, {{from_postcode}}

<strong>Delivery Address:</strong>
📍 {{to_address}}, {{to_postcode}}

<strong>💷 Invoice:</strong>
<a href="{{invoice_link}}" style="color: #2563eb; font-weight: bold;">Click here to view your invoice</a>

<strong>What happens next:</strong>
• Our team will arrive at the scheduled time
• Please ensure all items are packed and ready (unless packing service booked)
• Ensure clear access at both properties
• Keep valuables and important documents with you

<strong>On the day:</strong>
• Our team leader will introduce themselves and walk through the plan
• Feel free to point out any fragile or special items
• We'll call you if we're running early or late

Please find attached a calendar invite for your records.

If you have any questions before the big day, don't hesitate to contact us on {{staff_phone}}.

Thank you for choosing Holdem Removals!

Best regards,
{{staff_name}}
Holdem Removals`,
    variables: [
      'first_name',
      'service_type',
      'start_time',
      'job_schedule',
      'move_date',
      'from_address',
      'from_postcode',
      'to_address',
      'to_postcode',
      'invoice_link',
      'staff_name',
      'staff_phone',
    ],
    includesCalendarInvite: true,
  },
  {
    name: 'Review Request',
    category: 'Post-Move',
    subject: "How was your move? We'd love your feedback!",
    body: `Dear {{first_name}},

We hope you're settled into your new home and that everything went smoothly with your move!

We really enjoyed helping you, and we'd be incredibly grateful if you could take 2 minutes to share your experience. Your feedback helps other families find reliable removals and helps us continue improving our service.

<strong>⭐ Leave a Google Review:</strong>
{{google_review_link}}

<strong>⭐ Leave a Trustpilot Review:</strong>
{{trustpilot_review_link}}

A few things you might mention:
• How was the team on the day?
• Was everything handled with care?
• Would you recommend us to friends?

Thank you so much for choosing Holdem Removals. We wish you all the best in your new home!

Warm regards,
{{staff_name}}
Holdem Removals

P.S. If there was anything we could have done better, please reply to this email and let us know. We're always looking to improve!`,
    variables: [
      'first_name',
      'staff_name',
      'google_review_link',
      'trustpilot_review_link',
    ],
    includesCalendarInvite: false,
  },
];

async function seedTemplates() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [EmailTemplate],
    synchronize: false,
    ssl: process.env.DATABASE_HOST?.includes('supabase')
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    await dataSource.initialize();
    console.log('📧 Connected to database');

    const templateRepo = dataSource.getRepository(EmailTemplate);

    for (const template of templates) {
      // Check if template already exists
      const existing = await templateRepo.findOne({
        where: { name: template.name },
      });

      if (existing) {
        console.log(
          `⏭️  Template "${template.name}" already exists, skipping...`,
        );
        continue;
      }

      const newTemplate = templateRepo.create({
        name: template.name,
        category: template.category,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        includesCalendarInvite: template.includesCalendarInvite,
        isActive: true,
      });

      await templateRepo.save(newTemplate);
      console.log(`✅ Created template: ${template.name}`);
    }

    console.log('\n🎉 Template seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
  } finally {
    await dataSource.destroy();
  }
}

void seedTemplates();
