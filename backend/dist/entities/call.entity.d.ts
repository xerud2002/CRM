import { Lead } from './lead.entity';
import { User } from './user.entity';
export declare enum CallDirection {
    INBOUND = "inbound",
    OUTBOUND = "outbound"
}
export declare enum CallStatus {
    ANSWERED = "answered",
    MISSED = "missed",
    VOICEMAIL = "voicemail",
    NO_ANSWER = "no_answer"
}
export declare class Call {
    id: string;
    lead: Lead;
    leadId: string;
    user: User;
    userId: string;
    direction: CallDirection;
    status: CallStatus;
    answered: boolean;
    durationSeconds: number;
    recordingUrl: string;
    tamarData: Record<string, any>;
    notes: string;
    followUpRequired: boolean;
    followUpDate: Date;
    startedAt: Date;
    createdAt: Date;
}
