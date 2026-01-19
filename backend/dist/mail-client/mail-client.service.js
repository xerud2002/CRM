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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailClientService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const smtp_service_1 = require("./smtp.service");
const imap_service_1 = require("./imap.service");
let MailClientService = class MailClientService {
    accountRepository;
    emailRepository;
    leadRepository;
    smtpService;
    imapService;
    constructor(accountRepository, emailRepository, leadRepository, smtpService, imapService) {
        this.accountRepository = accountRepository;
        this.emailRepository = emailRepository;
        this.leadRepository = leadRepository;
        this.smtpService = smtpService;
        this.imapService = imapService;
    }
    async getAccounts() {
        return this.accountRepository.find({ where: { isActive: true } });
    }
    async getInbox(accountId, page = 1, limit = 20) {
        return [];
    }
    async sendEmail(accountId, to, subject, body, attachments) {
        const result = await this.smtpService.sendEmail(accountId, to, subject, body, attachments);
        const account = await this.accountRepository.findOne({ where: { id: accountId } });
        if (!account) {
            throw new Error('Email account not found');
        }
        const lead = await this.leadRepository.findOne({ where: { email: to } });
        const email = this.emailRepository.create({
            direction: entities_1.EmailDirection.OUTBOUND,
            subject,
            body,
            fromAddress: account.email,
            toAddress: to,
            messageId: result.messageId,
            sentAt: new Date(),
            lead: lead || undefined,
        });
        return this.emailRepository.save(email);
    }
};
exports.MailClientService = MailClientService;
exports.MailClientService = MailClientService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.EmailAccount)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Email)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Lead)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        smtp_service_1.SmtpService,
        imap_service_1.ImapService])
], MailClientService);
//# sourceMappingURL=mail-client.service.js.map