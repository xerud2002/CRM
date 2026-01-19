import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import type { TemplateVariables } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IcsGenerator } from './ics-generator';

@Controller('mail/templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.templatesService.findAll(category);
  }

  @Get('variables')
  getVariables() {
    return this.templatesService.getAvailableVariables();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      category?: string;
      subject: string;
      body: string;
      variables?: string[];
      includesCalendarInvite?: boolean;
    },
  ) {
    return this.templatesService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      category?: string;
      subject?: string;
      body?: string;
      variables?: string[];
      isActive?: boolean;
      includesCalendarInvite?: boolean;
    },
  ) {
    return this.templatesService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.templatesService.delete(id);
  }

  @Post(':id/preview')
  preview(@Param('id') id: string, @Body() variables: TemplateVariables) {
    return this.templatesService.findOne(id).then((template) => ({
      subject: this.templatesService.substituteVariables(
        template.subject,
        variables,
      ),
      body: this.templatesService.substituteVariables(template.body, variables),
      includesCalendarInvite: template.includesCalendarInvite,
    }));
  }

  @Post('generate-ics/video-call')
  generateVideoCallIcs(
    @Body()
    body: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      assessmentDate: string;
      durationMinutes: number;
      method: 'whatsapp' | 'zoom' | 'phone';
      staffName?: string;
      staffEmail?: string;
    },
  ) {
    const icsContent = IcsGenerator.generateVideoCallInvite({
      ...body,
      assessmentDate: new Date(body.assessmentDate),
    });

    return {
      filename: 'video-survey.ics',
      content: icsContent,
      contentType: 'text/calendar',
    };
  }

  @Post('generate-ics/in-person')
  generateInPersonIcs(
    @Body()
    body: {
      customerName: string;
      customerEmail: string;
      address: string;
      assessmentDate: string;
      durationMinutes: number;
      staffName?: string;
      staffEmail?: string;
    },
  ) {
    const icsContent = IcsGenerator.generateInPersonInvite({
      ...body,
      assessmentDate: new Date(body.assessmentDate),
    });

    return {
      filename: 'in-person-survey.ics',
      content: icsContent,
      contentType: 'text/calendar',
    };
  }

  @Post('generate-ics/booking')
  generateBookingIcs(
    @Body()
    body: {
      customerName: string;
      customerEmail: string;
      fromAddress: string;
      toAddress: string;
      moveDate: string;
      staffName?: string;
      staffEmail?: string;
    },
  ) {
    const icsContent = IcsGenerator.generateBookingInvite({
      ...body,
      moveDate: new Date(body.moveDate),
    });

    return {
      filename: 'moving-day.ics',
      content: icsContent,
      contentType: 'text/calendar',
    };
  }
}
