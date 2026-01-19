import { Lead } from './lead.entity';
import { User } from './user.entity';
export declare enum AssessmentType {
    VIDEO = "video",
    IN_PERSON = "in_person"
}
export declare enum AssessmentMethod {
    WHATSAPP = "whatsapp",
    ZOOM = "zoom",
    PHONE = "phone",
    ON_SITE = "on_site",
    OFFICE_VISIT = "office_visit"
}
export declare enum AssessmentStatus {
    SCHEDULED = "scheduled",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show"
}
export declare class Assessment {
    id: string;
    lead: Lead;
    leadId: string;
    assignedTo: User;
    assignedToId: string;
    type: AssessmentType;
    assessmentDate: Date;
    assessmentTime: string;
    method: AssessmentMethod;
    status: AssessmentStatus;
    fromAddress: string;
    fromPostcode: string;
    toAddress: string;
    toPostcode: string;
    moveDate: Date;
    estimatedDurationMins: number;
    notes: string;
    outcome: string;
    bookingLink: string;
    confirmationSent: boolean;
    reminderSent: boolean;
    createdAt: Date;
    updatedAt: Date;
}
