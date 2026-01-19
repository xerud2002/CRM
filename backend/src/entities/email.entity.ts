import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Lead } from './lead.entity';
import { User } from './user.entity';

export enum EmailDirection {
    INBOUND = 'inbound',
    OUTBOUND = 'outbound',
}

@Entity('emails')
export class Email {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @ManyToOne(() => Lead, (lead) => lead.emails, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'lead_id' })
    lead: Lead;

    @Column({ name: 'lead_id', nullable: true })
    leadId: string;

    @ManyToOne('EmailTemplate', { nullable: true })
    @JoinColumn({ name: 'template_id' })
    template: any;

    @Column({ name: 'template_id', nullable: true })
    templateId: string;

    @Column({
        type: 'enum',
        enum: EmailDirection,
    })
    direction: EmailDirection;

    @Column()
    subject: string;

    @Column({ type: 'text' })
    body: string;

    @Column()
    fromAddress: string;

    @Column()
    toAddress: string;

    @Index({ unique: true })
    @Column({ nullable: true })
    messageId: string;

    @Column({ nullable: true })
    sentAt: Date;

    @Column({ type: 'jsonb', nullable: true })
    attachments: { filename: string; size: number; contentType: string }[];

    @CreateDateColumn()
    createdAt: Date;
}
