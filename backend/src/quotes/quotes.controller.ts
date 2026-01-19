import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { QuotesService } from './quotes.service';
import { PdfService } from './pdf.service';
import { CreateQuoteDto, UpdateQuoteDto, QuoteFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest {
  user: { id: string; email: string };
}

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  create(@Body() dto: CreateQuoteDto, @Request() req: AuthRequest) {
    return this.quotesService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() filter: QuoteFilterDto) {
    return this.quotesService.findAll(filter);
  }

  @Get('stats')
  getStats() {
    return this.quotesService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Get('lead/:leadId')
  findByLead(@Param('leadId') leadId: string) {
    return this.quotesService.findByLead(leadId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
    @Request() req: AuthRequest,
  ) {
    return this.quotesService.update(id, dto, req.user.id);
  }

  @Post(':id/send')
  send(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.quotesService.send(id, req.user.id);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.quotesService.accept(id, req.user.id);
  }

  @Post(':id/decline')
  decline(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.quotesService.decline(id, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.quotesService.delete(id);
  }

  @Get(':id/pdf')
  async generatePdf(@Param('id') id: string, @Res() res: Response) {
    const quote = await this.quotesService.findOne(id);
    const pdfBuffer = await this.pdfService.generateQuotePdf(quote);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Quote-${quote.quoteNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get(':id/pdf/preview')
  async previewPdf(@Param('id') id: string, @Res() res: Response) {
    const quote = await this.quotesService.findOne(id);
    const pdfBuffer = await this.pdfService.generateQuotePdf(quote);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Quote-${quote.quoteNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
