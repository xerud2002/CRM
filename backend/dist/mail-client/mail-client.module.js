"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailClientModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const mail_client_controller_1 = require("./mail-client.controller");
const mail_client_service_1 = require("./mail-client.service");
const imap_service_1 = require("./imap.service");
const smtp_service_1 = require("./smtp.service");
const entities_1 = require("../entities");
let MailClientModule = class MailClientModule {
};
exports.MailClientModule = MailClientModule;
exports.MailClientModule = MailClientModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([entities_1.EmailAccount, entities_1.Email, entities_1.Lead])],
        controllers: [mail_client_controller_1.MailClientController],
        providers: [mail_client_service_1.MailClientService, imap_service_1.ImapService, smtp_service_1.SmtpService],
        exports: [mail_client_service_1.MailClientService],
    })
], MailClientModule);
//# sourceMappingURL=mail-client.module.js.map