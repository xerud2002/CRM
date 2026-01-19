import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Lead } from './lead.entity';
import { User } from './user.entity';

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quote_number', unique: true })
  quoteNumber: string;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ name: 'lead_id' })
  leadId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by' })
  createdById: string;

  @Column({
    type: 'enum',
    enum: QuoteStatus,
    default: QuoteStatus.DRAFT,
  })
  status: QuoteStatus;

  // Move details
  @Column({ name: 'move_date', type: 'date', nullable: true })
  moveDate: Date;

  @Column({ name: 'from_address', nullable: true })
  fromAddress: string;

  @Column({ name: 'to_address', nullable: true })
  toAddress: string;

  @Column({ type: 'int', nullable: true })
  bedrooms: number;

  // Pricing
  @OneToMany(() => QuoteLineItem, (item) => item.quote, {
    cascade: true,
    eager: true,
  })
  lineItems: QuoteLineItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({
    name: 'vat_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 20,
  })
  vatRate: number;

  @Column({
    name: 'vat_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  vatAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  deposit: number;

  // Terms & Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  terms: string;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil: Date;

  // Tracking
  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'viewed_at', type: 'timestamp', nullable: true })
  viewedAt: Date;

  @Column({ name: 'responded_at', type: 'timestamp', nullable: true })
  respondedAt: Date;

  @Column({ name: 'pdf_url', nullable: true })
  pdfUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('quote_line_items')
export class QuoteLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Quote, (quote) => quote.lineItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quote_id' })
  quote: Quote;

  @Column({ name: 'quote_id' })
  quoteId: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  category: string; // 'labor', 'materials', 'packing', 'storage', 'other'

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;
}
