import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  type Relation,
} from 'typeorm';
import type { Lead } from './lead.entity';
import type { Activity } from './activity.entity';
import type { Assessment } from './assessment.entity';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STAFF,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany('Lead', 'assignedTo')
  leads: Relation<Lead[]>;

  @OneToMany('Activity', 'user')
  activities: Relation<Activity[]>;

  @OneToMany('Assessment', 'assignedTo')
  assessments: Relation<Assessment[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
