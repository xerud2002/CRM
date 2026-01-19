import { Lead } from './lead.entity';
import { User } from './user.entity';
export declare enum ActivityType {
    EMAIL = "email",
    CALL = "call",
    NOTE = "note",
    STATUS_CHANGE = "status_change",
    MILESTONE = "milestone",
    ASSESSMENT = "assessment"
}
export declare class Activity {
    id: string;
    lead: Lead;
    leadId: string;
    user: User;
    userId: string;
    type: ActivityType;
    description: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
