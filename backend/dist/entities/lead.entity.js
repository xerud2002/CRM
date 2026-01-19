"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lead = exports.LeadSource = exports.ContactStatus = exports.LeadStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["PENDING"] = "pending";
    LeadStatus["NEW"] = "new";
    LeadStatus["CONTACTED"] = "contacted";
    LeadStatus["QUALIFIED"] = "qualified";
    LeadStatus["PROPOSAL"] = "proposal";
    LeadStatus["WON"] = "won";
    LeadStatus["LOST"] = "lost";
    LeadStatus["REJECTED"] = "rejected";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
var ContactStatus;
(function (ContactStatus) {
    ContactStatus["NOT_CONTACTED"] = "not_contacted";
    ContactStatus["CONTACTED"] = "contacted";
    ContactStatus["RESPONDED"] = "responded";
    ContactStatus["NO_RESPONSE"] = "no_response";
})(ContactStatus || (exports.ContactStatus = ContactStatus = {}));
var LeadSource;
(function (LeadSource) {
    LeadSource["COMPAREMYMOVE"] = "comparemymove";
    LeadSource["REALLYMOVING"] = "reallymoving";
    LeadSource["GETAMOVER"] = "getamover";
    LeadSource["WEBSITE"] = "website";
    LeadSource["MANUAL"] = "manual";
})(LeadSource || (exports.LeadSource = LeadSource = {}));
let Lead = class Lead {
    id;
    assignedTo;
    assignedToId;
    email;
    phone;
    firstName;
    lastName;
    company;
    status;
    contactStatus;
    milestones;
    source;
    externalRef;
    moveDate;
    fromAddress;
    fromPostcode;
    fromPropertyType;
    toAddress;
    toPostcode;
    toPropertyType;
    bedrooms;
    moveCategory;
    distanceMiles;
    inventoryJson;
    packingRequired;
    cleaningRequired;
    notes;
    quoteAmount;
    quoteAccepted;
    lastContactAt;
    activities;
    emails;
    calls;
    assessments;
    createdAt;
    updatedAt;
};
exports.Lead = Lead;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Lead.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.leads, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_to' }),
    __metadata("design:type", user_entity_1.User)
], Lead.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_to', nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "assignedToId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: LeadStatus,
        default: LeadStatus.PENDING,
    }),
    __metadata("design:type", String)
], Lead.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ContactStatus,
        default: ContactStatus.NOT_CONTACTED,
    }),
    __metadata("design:type", String)
], Lead.prototype, "contactStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Lead.prototype, "milestones", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: LeadSource,
        default: LeadSource.MANUAL,
    }),
    __metadata("design:type", String)
], Lead.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "externalRef", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Lead.prototype, "moveDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "fromAddress", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "fromPostcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "fromPropertyType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "toAddress", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "toPostcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "toPropertyType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Lead.prototype, "bedrooms", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "moveCategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Lead.prototype, "distanceMiles", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Lead.prototype, "inventoryJson", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Lead.prototype, "packingRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Lead.prototype, "cleaningRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Lead.prototype, "quoteAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Lead.prototype, "quoteAccepted", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Lead.prototype, "lastContactAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Activity', 'lead'),
    __metadata("design:type", Array)
], Lead.prototype, "activities", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Email', 'lead'),
    __metadata("design:type", Array)
], Lead.prototype, "emails", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Call', 'lead'),
    __metadata("design:type", Array)
], Lead.prototype, "calls", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Assessment', 'lead'),
    __metadata("design:type", Array)
], Lead.prototype, "assessments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Lead.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Lead.prototype, "updatedAt", void 0);
exports.Lead = Lead = __decorate([
    (0, typeorm_1.Entity)('leads')
], Lead);
//# sourceMappingURL=lead.entity.js.map