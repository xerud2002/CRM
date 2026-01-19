import { User } from './user.entity';
export declare class EmailAccount {
    id: string;
    email: string;
    displayName: string;
    imapHost: string;
    imapPort: number;
    smtpHost: string;
    smtpPort: number;
    username: string;
    passwordEncrypted: string;
    isActive: boolean;
    owner: User;
    ownerId: string;
    lastSyncAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
