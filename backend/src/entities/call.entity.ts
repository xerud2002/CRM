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

export enum CallDirection {
    INBOUND = 'inbound',
    OUTBOUND = 'outbound',
}

export enum CallStatus {
    ANSWERED = 'answered',
    MISSED = 'missed',
    VOICEMAIL = 'voicemail',
    NO_ANSWER = 'no_answer',
}

@Entity('calls')
export class Call {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @ManyToOne(() => Lead, (lead) => lead.calls, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'lead_id' })
    lead: Lead;

    @Column({ name: 'lead_id', nullable: true })
    leadId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @Column({
        type: 'enum',
        enum: CallDirection,
    })
    direction: CallDirection;

    @Column({
        type: 'enum',
        enum: CallStatus,
        default: CallStatus.NO_ANSWER,
    })
    status: CallStatus;

    @Column({ default: false })
    answered: boolean;

    @Column({ nullable: true })
    durationSeconds: number;

    @Column({ nullable: true })
    recordingUrl: string;

    @Column({ type: 'jsonb', nullable: true })
    tamarData: Record<string, any>;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ default: false })
    followUpRequired: boolean;

    @Column({ type: 'date', nullable: true })
    followUpDate: Date;

    @Column({ nullable: true })
    startedAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
