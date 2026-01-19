import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { UserRole } from './entities';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(AuthService);

    try {
        // Create admin user
        const admin = await authService.createUser(
            'alex.barcea@holdemremovals.co.uk',
            'Holdem2026!',
            'Alex Barcea',
            UserRole.ADMIN,
        );
        console.log('✅ Admin user created:', admin.email);

        // Create staff user
        const staff = await authService.createUser(
            'ella.v@holdemremovals.co.uk',
            'Holdem2026!',
            'Ella V',
            UserRole.STAFF,
        );
        console.log('✅ Staff user created:', staff.email);

    } catch (error) {
        if (error.code === '23505') {
            console.log('⚠️ Users already exist');
        } else {
            console.error('Error:', error.message);
        }
    }

    await app.close();
}

seed();
