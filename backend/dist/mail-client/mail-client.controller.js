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
exports.MailClientController = void 0;
const common_1 = require("@nestjs/common");
const mail_client_service_1 = require("./mail-client.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let MailClientController = class MailClientController {
    mailService;
    constructor(mailService) {
        this.mailService = mailService;
    }
    getAccounts() {
        return this.mailService.getAccounts();
    }
    sendEmail(body) {
        return this.mailService.sendEmail(body.accountId, body.to, body.subject, body.html);
    }
};
exports.MailClientController = MailClientController;
__decorate([
    (0, common_1.Get)('accounts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MailClientController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MailClientController.prototype, "sendEmail", null);
exports.MailClientController = MailClientController = __decorate([
    (0, common_1.Controller)('mail'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [mail_client_service_1.MailClientService])
], MailClientController);
//# sourceMappingURL=mail-client.controller.js.map