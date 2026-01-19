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
exports.Call = exports.CallStatus = exports.CallDirection = void 0;
const typeorm_1 = require("typeorm");
const lead_entity_1 = require("./lead.entity");
const user_entity_1 = require("./user.entity");
var CallDirection;
(function (CallDirection) {
    CallDirection["INBOUND"] = "inbound";
    CallDirection["OUTBOUND"] = "outbound";
})(CallDirection || (exports.CallDirection = CallDirection = {}));
var CallStatus;
(function (CallStatus) {
    CallStatus["ANSWERED"] = "answered";
    CallStatus["MISSED"] = "missed";
    CallStatus["VOICEMAIL"] = "voicemail";
    CallStatus["NO_ANSWER"] = "no_answer";
})(CallStatus || (exports.CallStatus = CallStatus = {}));
let Call = class Call {
    id;
    lead;
    leadId;
    user;
    userId;
    direction;
    status;
    answered;
    durationSeconds;
    recordingUrl;
    tamarData;
    notes;
    followUpRequired;
    followUpDate;
    startedAt;
    createdAt;
};
exports.Call = Call;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Call.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => lead_entity_1.Lead, (lead) => lead.calls, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'lead_id' }),
    __metadata("design:type", lead_entity_1.Lead)
], Call.prototype, "lead", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lead_id', nullable: true }),
    __metadata("design:type", String)
], Call.prototype, "leadId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Call.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], Call.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CallDirection,
    }),
    __metadata("design:type", String)
], Call.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CallStatus,
        default: CallStatus.NO_ANSWER,
    }),
    __metadata("design:type", String)
], Call.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Call.prototype, "answered", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Call.prototype, "durationSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Call.prototype, "recordingUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Call.prototype, "tamarData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Call.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Call.prototype, "followUpRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Call.prototype, "followUpDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Call.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Call.prototype, "createdAt", void 0);
exports.Call = Call = __decorate([
    (0, typeorm_1.Entity)('calls')
], Call);
//# sourceMappingURL=call.entity.js.map