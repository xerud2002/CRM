import { CreateLeadDto } from './create-lead.dto';
import { LeadStatus, ContactStatus } from '../../entities';
declare const UpdateLeadDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateLeadDto>>;
export declare class UpdateLeadDto extends UpdateLeadDto_base {
    status?: LeadStatus;
    contactStatus?: ContactStatus;
    quoteAmount?: number;
    quoteAccepted?: boolean;
    assignedToId?: string;
}
export {};
