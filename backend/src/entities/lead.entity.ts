import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';

export enum LeadStatus {
    PENDING = 'pending',
    NEW = 'new',
    CONTACTED = 'contacted',
    QUALIFIED = 'qualified',
    PROPOSAL = 'proposal',
    WON = 'won',
    LOST = 'lost',
    REJECTED = 'rejected',
}

export enum ContactStatus {
    NOT_CONTACTED = 'not_contacted',
    CONTACTED = 'contacted',
    RESPONDED = 'responded',
    NO_RESPONSE = 'no_response',
}

export enum LeadSource {
    COMPAREMYMOVE = 'comparemymove',
    REALLYMOVING = 'reallymoving',
    GETAMOVER = 'getamover',
    WEBSITE = 'website',
    MANUAL = 'manual',
}

@Entity('leads')
export class Lead {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.leads, { nullable: true })
    @JoinColumn({ name: 'assigned_to' })
    assignedTo: User;

    @Column({ name: 'assigned_to', nullable: true })
    assignedToId: string;

    @Index()
    @Column({ nullable: true })
    email: string;

    @Index()
    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    firstName: string;

    @Column({ nullable: true })
    lastName: string;

    @Column({ nullable: true })
    company: string;

    @Index()
    @Column({
        type: 'enum',
        enum: LeadStatus,
        default: LeadStatus.PENDING,
    })
    status: LeadStatus;

    @Index()
    @Column({
        type: 'enum',
        enum: ContactStatus,
        default: ContactStatus.NOT_CONTACTED,
    })
    contactStatus: ContactStatus;

    @Column({ type: 'jsonb', nullable: true })
    milestones: Record<string, any>;

    @Column({
        type: 'enum',
        enum: LeadSource,
        default: LeadSource.MANUAL,
    })
    source: LeadSource;

    @Column({ nullable: true })
    externalRef: string;

    @Column({ type: 'date', nullable: true })
    moveDate: Date;

    @Column({ nullable: true })
    fromAddress: string;

    @Index()
    @Column({ nullable: true })
    fromPostcode: string;

    @Column({ nullable: true })
    fromPropertyType: string;

    @Column({ nullable: true })
    toAddress: string;

    @Index()
    @Column({ nullable: true })
    toPostcode: string;

    @Column({ nullable: true })
    toPropertyType: string;

    @Column({ nullable: true })
    bedrooms: number;

    @Column({ nullable: true })
    moveCategory: string;

    @Column({ nullable: true })
    distanceMiles: number;

    @Column({ type: 'jsonb', nullable: true })
    inventoryJson: Record<string, any>;

    @Column({ default: false })
    packingRequired: boolean;

    @Column({ default: false })
    cleaningRequired: boolean;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    quoteAmount: number;

    @Column({ default: false })
    quoteAccepted: boolean;

    @Column({ nullable: true })
    lastContactAt: Date;

    @OneToMany('Activity', 'lead')
    activities: any[];

    @OneToMany('Email', 'lead')
    emails: any[];

    @OneToMany('Call', 'lead')
    calls: any[];

    @OneToMany('Assessment', 'lead')
    assessments: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
