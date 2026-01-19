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
exports.Assessment = exports.AssessmentStatus = exports.AssessmentMethod = exports.AssessmentType = void 0;
const typeorm_1 = require("typeorm");
const lead_entity_1 = require("./lead.entity");
const user_entity_1 = require("./user.entity");
var AssessmentType;
(function (AssessmentType) {
    AssessmentType["VIDEO"] = "video";
    AssessmentType["IN_PERSON"] = "in_person";
})(AssessmentType || (exports.AssessmentType = AssessmentType = {}));
var AssessmentMethod;
(function (AssessmentMethod) {
    AssessmentMethod["WHATSAPP"] = "whatsapp";
    AssessmentMethod["ZOOM"] = "zoom";
    AssessmentMethod["PHONE"] = "phone";
    AssessmentMethod["ON_SITE"] = "on_site";
    AssessmentMethod["OFFICE_VISIT"] = "office_visit";
})(AssessmentMethod || (exports.AssessmentMethod = AssessmentMethod = {}));
var AssessmentStatus;
(function (AssessmentStatus) {
    AssessmentStatus["SCHEDULED"] = "scheduled";
    AssessmentStatus["COMPLETED"] = "completed";
    AssessmentStatus["CANCELLED"] = "cancelled";
    AssessmentStatus["NO_SHOW"] = "no_show";
})(AssessmentStatus || (exports.AssessmentStatus = AssessmentStatus = {}));
let Assessment = class Assessment {
    id;
    lead;
    leadId;
    assignedTo;
    assignedToId;
    type;
    assessmentDate;
    assessmentTime;
    method;
    status;
    fromAddress;
    fromPostcode;
    toAddress;
    toPostcode;
    moveDate;
    estimatedDurationMins;
    notes;
    outcome;
    bookingLink;
    confirmationSent;
    reminderSent;
    createdAt;
    updatedAt;
};
exports.Assessment = Assessment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Assessment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => lead_entity_1.Lead, (lead) => lead.assessments, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'lead_id' }),
    __metadata("design:type", lead_entity_1.Lead)
], Assessment.prototype, "lead", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lead_id' }),
    __metadata("design:type", String)
], Assessment.prototype, "leadId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.assessments, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_to' }),
    __metadata("design:type", user_entity_1.User)
], Assessment.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_to', nullable: true }),
    __metadata("design:type", String)
], Assessment.prototype, "assignedToId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AssessmentType,
    }),
    __metadata("design:type", String)
], Assessment.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Assessment.prototype, "assessmentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], Assessment.prototype, "assessmentTime", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AssessmentMethod,
    }),
    __metadata("design:type", String)
], Assessment.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AssessmentStatus,
        default: AssessmentStatus.SCHEDULED,
    }),
    __metadata("design:type", String)
], Assessment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Assessment.prototype, "fromAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Assessment.prototype, "fromPostcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Assessment.prototype, "toAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Assessment.prototype, "toPostcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Assessment.prototype, "moveDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Assessment.prototype, "estimatedDurationMins", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Assessment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Assessment.prototype, "outcome", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Assessment.prototype, "bookingLink", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Assessment.prototype, "confirmationSent", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Assessment.prototype, "reminderSent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Assessment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Assessment.prototype, "updatedAt", void 0);
exports.Assessment = Assessment = __decorate([
    (0, typeorm_1.Entity)('assessments')
], Assessment);
//# sourceMappingURL=assessment.entity.js.map