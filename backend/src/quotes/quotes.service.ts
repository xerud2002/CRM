import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Quote,
  QuoteLineItem,
  QuoteStatus,
  Lead,
  LeadStatus,
  ActivityType,
  Activity,
} from '../entities';
import { CreateQuoteDto, UpdateQuoteDto, QuoteFilterDto } from './dto';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(QuoteLineItem)
    private lineItemRepository: Repository<QuoteLineItem>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    private dataSource: DataSource,
  ) {}

  /**
   * Generate unique quote number: HR-YYYY-NNNN
   */
  private async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `HR-${year}-`;

    // Get the latest quote number for this year
    const latestQuote = await this.quoteRepository
      .createQueryBuilder('quote')
      .where('quote.quoteNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('quote.quoteNumber', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (latestQuote) {
      const lastNumber = parseInt(latestQuote.quoteNumber.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate quote totals from line items
   */
  private calculateTotals(
    lineItems: { quantity: number; unitPrice: number }[],
    vatRate: number,
  ): { subtotal: number; vatAmount: number; total: number } {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  async create(dto: CreateQuoteDto, userId: string): Promise<Quote> {
    // Verify lead exists
    const lead = await this.leadRepository.findOne({
      where: { id: dto.leadId },
    });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${dto.leadId} not found`);
    }

    const quoteNumber = await this.generateQuoteNumber();
    const vatRate = dto.vatRate ?? 20;
    const totals = this.calculateTotals(dto.lineItems, vatRate);

    // Set default validity (14 days)
    const validUntil = dto.validUntil
      ? new Date(dto.validUntil)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Default terms
    const defaultTerms = `
• 50% deposit required to confirm booking
• Balance due on completion of move
• Price valid for 14 days from quote date
• Insurance included up to £50,000
• Cancellation: 48 hours notice required for full refund
    `.trim();

    const quote = this.quoteRepository.create({
      quoteNumber,
      leadId: dto.leadId,
      createdById: userId,
      moveDate: dto.moveDate ? new Date(dto.moveDate) : lead.moveDate,
      fromAddress: dto.fromAddress || lead.fromAddress,
      toAddress: dto.toAddress || lead.toAddress,
      bedrooms: dto.bedrooms || lead.bedrooms,
      vatRate,
      ...totals,
      deposit: dto.deposit,
      notes: dto.notes,
      terms: dto.terms || defaultTerms,
      validUntil,
      status: QuoteStatus.DRAFT,
    });

    const savedQuote = await this.quoteRepository.save(quote);

    // Create line items
    const lineItems = dto.lineItems.map((item, index) =>
      this.lineItemRepository.create({
        quoteId: savedQuote.id,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
        sortOrder: item.sortOrder ?? index,
      }),
    );

    await this.lineItemRepository.save(lineItems);

    // Log activity
    await this.activityRepository.save({
      leadId: dto.leadId,
      userId,
      type: ActivityType.NOTE,
      description: `Quote ${quoteNumber} created - Total: £${totals.total.toFixed(2)}`,
    });

    return this.findOne(savedQuote.id);
  }

  async findAll(filter: QuoteFilterDto): Promise<{
    data: Quote[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.lead', 'lead')
      .leftJoinAndSelect('quote.createdBy', 'createdBy')
      .leftJoinAndSelect('quote.lineItems', 'lineItems')
      .orderBy('quote.createdAt', 'DESC');

    if (filter.leadId) {
      query.andWhere('quote.leadId = :leadId', { leadId: filter.leadId });
    }

    if (filter.status) {
      query.andWhere('quote.status = :status', { status: filter.status });
    }

    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({
      where: { id },
      relations: ['lead', 'createdBy', 'lineItems'],
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    // Sort line items
    if (quote.lineItems) {
      quote.lineItems.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return quote;
  }

  async findByLead(leadId: string): Promise<Quote[]> {
    return this.quoteRepository.find({
      where: { leadId },
      relations: ['createdBy', 'lineItems'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    dto: UpdateQuoteDto,
    _userId: string,
  ): Promise<Quote> {
    const quote = await this.findOne(id);

    // If line items are being updated, recalculate totals
    if (dto.lineItems) {
      const vatRate = dto.vatRate ?? quote.vatRate;
      const totals = this.calculateTotals(dto.lineItems, Number(vatRate));

      // Delete existing line items
      await this.lineItemRepository.delete({ quoteId: id });

      // Create new line items
      const lineItems = dto.lineItems.map((item, index) =>
        this.lineItemRepository.create({
          quoteId: id,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
          sortOrder: item.sortOrder ?? index,
        }),
      );

      await this.lineItemRepository.save(lineItems);

      Object.assign(quote, {
        ...dto,
        ...totals,
        moveDate: dto.moveDate ? new Date(dto.moveDate) : quote.moveDate,
        validUntil: dto.validUntil
          ? new Date(dto.validUntil)
          : quote.validUntil,
      });
    } else {
      Object.assign(quote, {
        ...dto,
        moveDate: dto.moveDate ? new Date(dto.moveDate) : quote.moveDate,
        validUntil: dto.validUntil
          ? new Date(dto.validUntil)
          : quote.validUntil,
      });
    }

    return this.quoteRepository.save(quote);
  }

  async send(id: string, userId: string): Promise<Quote> {
    const quote = await this.findOne(id);

    quote.status = QuoteStatus.SENT;
    quote.sentAt = new Date();

    await this.quoteRepository.save(quote);

    // Log activity
    await this.activityRepository.save({
      leadId: quote.leadId,
      userId,
      type: ActivityType.EMAIL,
      description: `Quote ${quote.quoteNumber} sent to customer - £${Number(quote.total).toFixed(2)}`,
    });

    return quote;
  }

  async markViewed(id: string): Promise<Quote> {
    const quote = await this.findOne(id);

    if (quote.status === QuoteStatus.SENT) {
      quote.status = QuoteStatus.VIEWED;
      quote.viewedAt = new Date();
      await this.quoteRepository.save(quote);
    }

    return quote;
  }

  async accept(id: string, userId?: string): Promise<Quote> {
    const quote = await this.findOne(id);

    quote.status = QuoteStatus.ACCEPTED;
    quote.respondedAt = new Date();

    await this.quoteRepository.save(quote);

    // Update lead status to proposal accepted
    await this.leadRepository.update(quote.leadId, {
      status: LeadStatus.WON,
    });

    // Log activity
    await this.activityRepository.save({
      leadId: quote.leadId,
      userId: userId || quote.createdById,
      type: ActivityType.STATUS_CHANGE,
      description: `Quote ${quote.quoteNumber} ACCEPTED - £${Number(quote.total).toFixed(2)}`,
    });

    return quote;
  }

  async decline(id: string, userId?: string): Promise<Quote> {
    const quote = await this.findOne(id);

    quote.status = QuoteStatus.DECLINED;
    quote.respondedAt = new Date();

    await this.quoteRepository.save(quote);

    // Log activity
    await this.activityRepository.save({
      leadId: quote.leadId,
      userId: userId || quote.createdById,
      type: ActivityType.STATUS_CHANGE,
      description: `Quote ${quote.quoteNumber} DECLINED`,
    });

    return quote;
  }

  async delete(id: string): Promise<void> {
    const quote = await this.findOne(id);
    await this.quoteRepository.remove(quote);
  }

  /**
   * Get quote statistics
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalValue: number;
    acceptedValue: number;
    conversionRate: number;
  }> {
    const quotes = await this.quoteRepository.find();

    const byStatus: Record<string, number> = {};
    let totalValue = 0;
    let acceptedValue = 0;
    let sentCount = 0;
    let acceptedCount = 0;

    for (const quote of quotes) {
      byStatus[quote.status] = (byStatus[quote.status] || 0) + 1;
      totalValue += Number(quote.total);

      if (quote.status === QuoteStatus.ACCEPTED) {
        acceptedValue += Number(quote.total);
        acceptedCount++;
      }

      if (
        [
          QuoteStatus.SENT,
          QuoteStatus.VIEWED,
          QuoteStatus.ACCEPTED,
          QuoteStatus.DECLINED,
        ].includes(quote.status)
      ) {
        sentCount++;
      }
    }

    return {
      total: quotes.length,
      byStatus,
      totalValue: Math.round(totalValue * 100) / 100,
      acceptedValue: Math.round(acceptedValue * 100) / 100,
      conversionRate:
        sentCount > 0 ? Math.round((acceptedCount / sentCount) * 100) : 0,
    };
  }
}
