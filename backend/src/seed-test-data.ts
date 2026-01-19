import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import {
  Lead,
  LeadStatus,
  LeadSource,
  ContactStatus,
} from './entities/lead.entity';
import { User } from './entities/user.entity';
import { Activity, ActivityType } from './entities/activity.entity';
import {
  Assessment,
  AssessmentType,
  AssessmentMethod,
  AssessmentStatus,
} from './entities/assessment.entity';
import { Email } from './entities/email.entity';
import { Call } from './entities/call.entity';
import { EmailAccount } from './entities/email-account.entity';
import { EmailTemplate } from './entities/email-template.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: { rejectUnauthorized: false },
  entities: [
    User,
    Lead,
    Activity,
    Assessment,
    Email,
    Call,
    EmailAccount,
    EmailTemplate,
  ],
  synchronize: false,
});

// Sample UK postcodes for testing
const postcodes = {
  northampton: [
    'NN1 1AA',
    'NN1 2AB',
    'NN2 6AA',
    'NN3 8QP',
    'NN4 5DH',
    'NN5 7LR',
  ],
  miltonKeynes: ['MK9 2AB', 'MK9 3CD', 'MK10 0AA', 'MK11 3EF', 'MK12 5GH'],
  peterborough: ['PE1 1AA', 'PE2 5BB', 'PE3 8CC', 'PE4 6DD'],
  bedford: ['MK40 1AA', 'MK41 7BB', 'MK42 9CC', 'MK43 0DD'],
  london: ['N1 9AA', 'NW1 8BB', 'E1 6CC', 'SE1 7DD', 'SW1 5EE', 'W1 4FF'],
};

const firstNames = [
  'James',
  'Oliver',
  'Emma',
  'Charlotte',
  'William',
  'Sophia',
  'Henry',
  'Amelia',
  'George',
  'Olivia',
  'Thomas',
  'Isabella',
  'Jack',
  'Mia',
  'Harry',
  'Ella',
  'Jacob',
  'Grace',
  'Charlie',
  'Lily',
];
const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Miller',
  'Davis',
  'Garcia',
  'Wilson',
  'Taylor',
  'Anderson',
  'Thomas',
  'Moore',
  'Martin',
  'Jackson',
  'White',
  'Harris',
  'Clark',
  'Lewis',
  'Walker',
];

const noteTemplates = [
  'Customer called to discuss moving timeline. Seems very interested.',
  'Left voicemail, waiting for callback.',
  'Discussed storage options. Customer needs 2 weeks storage.',
  'Customer confirmed move date. Ready to proceed.',
  'Requested additional quote for packing services.',
  'Customer comparing with other companies. Follow up in 2 days.',
  'Excellent phone call. Customer very organized.',
  'Needs large items only - 3 seater sofa, king bed, wardrobe.',
  'Asked about insurance options. Sent details via email.',
  'Customer has flexible dates - easier to schedule.',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number, daysAhead: number): Date {
  const today = new Date();
  const randomDays =
    Math.floor(Math.random() * (daysAhead + daysAgo)) - daysAgo;
  today.setDate(today.getDate() + randomDays);
  return today;
}

function generatePhone(): string {
  const prefix = Math.random() > 0.5 ? '07' : '01604';
  const suffix = Math.floor(Math.random() * 900000000 + 100000000)
    .toString()
    .slice(0, prefix === '07' ? 9 : 6);
  return prefix + suffix;
}

async function seedTestData() {
  console.log('Connecting to database...');
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const leadRepo = dataSource.getRepository(Lead);
  const activityRepo = dataSource.getRepository(Activity);
  const assessmentRepo = dataSource.getRepository(Assessment);

  // Get existing users
  const users = await userRepo.find();
  if (users.length === 0) {
    console.error('No users found. Please run the main seed first.');
    process.exit(1);
  }
  console.log(`Found ${users.length} users`);

  // Create test leads
  const sources = Object.values(LeadSource);
  const statuses = [
    LeadStatus.PENDING,
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.QUALIFIED,
    LeadStatus.PROPOSAL,
  ];

  const leads: Lead[] = [];

  // Generate 30 leads with varying statuses
  console.log('\nCreating 30 test leads...');
  for (let i = 0; i < 30; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const status = randomItem(statuses);
    const source = randomItem(sources);
    const fromArea = randomItem(Object.keys(postcodes));
    const toArea = randomItem(Object.keys(postcodes));

    const lead = leadRepo.create({
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      phone: generatePhone(),
      source,
      status,
      contactStatus:
        status === LeadStatus.PENDING
          ? ContactStatus.NOT_CONTACTED
          : randomItem([ContactStatus.CONTACTED, ContactStatus.RESPONDED]),
      fromAddress: `${Math.floor(Math.random() * 100) + 1} Example Street`,
      fromPostcode: randomItem(postcodes[fromArea as keyof typeof postcodes]),
      toAddress: `${Math.floor(Math.random() * 100) + 1} New Street`,
      toPostcode: randomItem(postcodes[toArea as keyof typeof postcodes]),
      moveDate: randomDate(-5, 60),
      bedrooms: Math.floor(Math.random() * 4) + 1,
      assignedTo: status === LeadStatus.PENDING ? undefined : randomItem(users),
      createdAt: randomDate(-30, 0),
    });

    const savedLead = await leadRepo.save(lead);
    leads.push(savedLead);
    console.log(`  ${i + 1}. ${firstName} ${lastName} (${source}, ${status})`);
  }

  // Add activities to non-pending leads
  console.log('\nAdding activities to leads...');
  let activityCount = 0;

  for (const lead of leads) {
    if (lead.status === LeadStatus.PENDING) continue;

    const numActivities = Math.floor(Math.random() * 5) + 1;
    const user = randomItem(users);

    for (let i = 0; i < numActivities; i++) {
      const activityTypes = [
        ActivityType.NOTE,
        ActivityType.STATUS_CHANGE,
        ActivityType.EMAIL,
        ActivityType.CALL,
      ];
      const type = randomItem(activityTypes);

      let description = '';
      let metadata: Record<string, unknown> = {};

      switch (type) {
        case ActivityType.NOTE:
          description = randomItem(noteTemplates);
          break;
        case ActivityType.STATUS_CHANGE:
          description = `Status changed to ${lead.status}`;
          metadata = { from: LeadStatus.NEW, to: lead.status };
          break;
        case ActivityType.EMAIL:
          description = 'Sent quote email to customer';
          metadata = { subject: 'Your Moving Quote from Holdem Removals' };
          break;
        case ActivityType.CALL:
          description =
            Math.random() > 0.5
              ? 'Outbound call - discussed requirements'
              : 'Inbound call - customer enquiry';
          metadata = {
            direction: Math.random() > 0.5 ? 'outbound' : 'inbound',
            duration: Math.floor(Math.random() * 600) + 60,
          };
          break;
      }

      const activity = activityRepo.create({
        lead,
        user,
        type,
        description,
        metadata,
        createdAt: randomDate(-14, 0),
      });

      await activityRepo.save(activity);
      activityCount++;
    }
  }
  console.log(`Created ${activityCount} activities`);

  // Add assessments to some leads
  console.log('\nCreating assessments...');
  const qualifiedLeads = leads.filter((l) =>
    [LeadStatus.QUALIFIED, LeadStatus.PROPOSAL].includes(l.status),
  );
  let assessmentCount = 0;

  for (const lead of qualifiedLeads.slice(0, 10)) {
    const isVideo = Math.random() > 0.4;
    const assessment = assessmentRepo.create({
      lead,
      assignedTo: randomItem(users),
      type: isVideo ? AssessmentType.VIDEO : AssessmentType.IN_PERSON,
      method: isVideo
        ? randomItem([
            AssessmentMethod.WHATSAPP,
            AssessmentMethod.ZOOM,
            AssessmentMethod.PHONE,
          ])
        : randomItem([AssessmentMethod.ON_SITE, AssessmentMethod.OFFICE_VISIT]),
      status: randomItem([
        AssessmentStatus.SCHEDULED,
        AssessmentStatus.COMPLETED,
      ]),
      assessmentDate: randomDate(-7, 14),
      assessmentTime: `${Math.floor(Math.random() * 8) + 9}:${Math.random() > 0.5 ? '00' : '30'}`,
      fromAddress: lead.fromAddress,
      fromPostcode: lead.fromPostcode,
      toAddress: lead.toAddress,
      toPostcode: lead.toPostcode,
      moveDate: lead.moveDate,
      estimatedDurationMins: Math.random() > 0.5 ? 30 : 60,
      notes:
        Math.random() > 0.5 ? 'Customer requested morning slot' : undefined,
    });

    await assessmentRepo.save(assessment);
    assessmentCount++;
  }
  console.log(`Created ${assessmentCount} assessments`);

  // Summary
  console.log('\n✅ Test data seeded successfully!');
  console.log('━'.repeat(40));
  console.log(`📋 Leads created: ${leads.length}`);
  console.log(
    `   - Pending (inbox): ${leads.filter((l) => l.status === LeadStatus.PENDING).length}`,
  );
  console.log(
    `   - New: ${leads.filter((l) => l.status === LeadStatus.NEW).length}`,
  );
  console.log(
    `   - Contacted: ${leads.filter((l) => l.status === LeadStatus.CONTACTED).length}`,
  );
  console.log(
    `   - Qualified: ${leads.filter((l) => l.status === LeadStatus.QUALIFIED).length}`,
  );
  console.log(
    `   - Proposal: ${leads.filter((l) => l.status === LeadStatus.PROPOSAL).length}`,
  );
  console.log(`📝 Activities created: ${activityCount}`);
  console.log(`📅 Assessments created: ${assessmentCount}`);
  console.log('━'.repeat(40));

  await dataSource.destroy();
}

seedTestData().catch((error) => {
  console.error('Error seeding test data:', error);
  process.exit(1);
});
