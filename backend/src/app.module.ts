import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth';
import { LeadsModule } from './leads';
import { DashboardModule } from './dashboard';
import { MailClientModule } from './mail-client';
import { ActivitiesModule } from './activities';
import { AssessmentsModule } from './assessments';
import { QuotesModule } from './quotes';
import { CallsModule } from './calls';
import { ReportsModule } from './reports';
import { SmsModule } from './sms';
import {
  User,
  Lead,
  Activity,
  Email,
  EmailTemplate,
  EmailAccount,
  Call,
  Assessment,
  Quote,
  QuoteLineItem,
} from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        ssl: {
          rejectUnauthorized: false, // Required for Supabase direct connection
        },
        entities: [
          User,
          Lead,
          Activity,
          Email,
          EmailTemplate,
          EmailAccount,
          Call,
          Assessment,
          Quote,
          QuoteLineItem,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    LeadsModule,
    DashboardModule,
    MailClientModule,
    ActivitiesModule,
    AssessmentsModule,
    QuotesModule,
    CallsModule,
    ReportsModule,
    SmsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
