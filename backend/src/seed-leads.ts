import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LeadsService } from './leads/leads.service';
import { CreateLeadDto } from './leads/dto/create-lead.dto';
import { LeadSource } from './entities';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const leadsService = app.get(LeadsService);

  const leads: CreateLeadDto[] = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '07700900000',
      source: LeadSource.WEBSITE,
      fromAddress: '10 Downing St, London',
      toAddress: 'Buckingham Palace, London',
      fromPostcode: 'SW1A 2AA',
      toPostcode: 'SW1A 1AA',
      moveDate: new Date('2026-02-15T09:00:00.000Z'),
      notes: 'Need packing service as well.',
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '07700900001',
      source: LeadSource.COMPAREMYMOVE,
      fromAddress: '5 Oxford St, London',
      toAddress: '100 Princes St, Edinburgh',
      fromPostcode: 'W1D 1BS',
      toPostcode: 'EH2 3AA',
      moveDate: new Date('2026-03-01T09:00:00.000Z'),
      notes: 'Long distance move, needs large van.',
    },
    {
      firstName: 'Robert',
      lastName: 'Brown',
      email: 'bob.brown@example.com',
      phone: '07700900002',
      source: LeadSource.GETAMOVER,
      fromAddress: '221B Baker St, London',
      toAddress: '4 Privet Drive, Surrey',
      fromPostcode: 'NW1 6XE',
      toPostcode: 'GU33 9AA',
      moveDate: new Date('2026-02-20T09:00:00.000Z'),
      notes: 'Fragile items, piano.',
    },
  ];

  for (const lead of leads) {
    try {
      await leadsService.create(lead);
      console.log(`Created lead: ${lead.firstName} ${lead.lastName}`);
    } catch (e) {
      console.error(`Error creating lead ${lead.firstName}:`, (e as Error).message);
    }
  }

  await app.close();
}

void bootstrap();
