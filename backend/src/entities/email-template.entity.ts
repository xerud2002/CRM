import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('email_templates')
export class EmailTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    category: string;

    @Column()
    subject: string;

    @Column({ type: 'text' })
    body: string;

    @Column({ type: 'jsonb', nullable: true })
    variables: string[];

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    includesCalendarInvite: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
