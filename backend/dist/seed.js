"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const auth_service_1 = require("./auth/auth.service");
const entities_1 = require("./entities");
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const authService = app.get(auth_service_1.AuthService);
    try {
        const admin = await authService.createUser('alex.barcea@holdemremovals.co.uk', 'Holdem2026!', 'Alex Barcea', entities_1.UserRole.ADMIN);
        console.log('✅ Admin user created:', admin.email);
        const staff = await authService.createUser('ella.v@holdemremovals.co.uk', 'Holdem2026!', 'Ella V', entities_1.UserRole.STAFF);
        console.log('✅ Staff user created:', staff.email);
    }
    catch (error) {
        if (error.code === '23505') {
            console.log('⚠️ Users already exist');
        }
        else {
            console.error('Error:', error.message);
        }
    }
    await app.close();
}
seed();
//# sourceMappingURL=seed.js.map