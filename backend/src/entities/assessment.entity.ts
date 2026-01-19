import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Lead } from './lead.entity';
import { User } from './user.entity';

export enum AssessmentType {
  VIDEO = 'video',
  IN_PERSON = 'in_person',
}

export enum AssessmentMethod {
  WHATSAPP = 'whatsapp',
  ZOOM = 'zoom',
  PHONE = 'phone',
  ON_SITE = 'on_site',
  OFFICE_VISIT = 'office_visit',
}

export enum AssessmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Lead, (lead) => lead.assessments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ name: 'lead_id' })
  leadId: string;

  @ManyToOne(() => User, (user) => user.assessments, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User;

  @Column({ name: 'assigned_to', nullable: true })
  assignedToId: string;

  @Column({
    type: 'enum',
    enum: AssessmentType,
  })
  type: AssessmentType;

  @Column({ type: 'date' })
  assessmentDate: Date;

  @Column({ type: 'time' })
  assessmentTime: string;

  @Column({
    type: 'enum',
    enum: AssessmentMethod,
  })
  method: AssessmentMethod;

  @Column({
    type: 'enum',
    enum: AssessmentStatus,
    default: AssessmentStatus.SCHEDULED,
  })
  status: AssessmentStatus;

  @Column({ nullable: true })
  fromAddress: string;

  @Column({ nullable: true })
  fromPostcode: string;

  @Column({ nullable: true })
  toAddress: string;

  @Column({ nullable: true })
  toPostcode: string;

  @Column({ type: 'date', nullable: true })
  moveDate: Date;

  @Column({ nullable: true })
  estimatedDurationMins: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  outcome: string;

  @Column({ nullable: true })
  bookingLink: string;

  @Column({ default: false })
  confirmationSent: boolean;

  @Column({ default: false })
  reminderSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
