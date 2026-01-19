import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { UserRole } from './entities';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  try {
    // Create correct admin user
    const adminEmail = 'alex.burcea@holdemremovals.co.uk';
    try {
      const admin = await authService.createUser(
        adminEmail,
        'Holdem2026!',
        'Alex Burcea',
        UserRole.ADMIN,
      );
      console.log('✅ Admin user created:', admin.email);
    } catch (e) {
      console.log(
        `⚠️ User ${adminEmail} might already exist or error: ${(e as Error).message}`,
      );
    }

    // Create staff user (if not exists)
    const staffEmail = 'ella.v@holdemremovals.co.uk';
    try {
      const staff = await authService.createUser(
        staffEmail,
        'Holdem2026!',
        'Ella V',
        UserRole.STAFF,
      );
      console.log('✅ Staff user created:', staff.email);
    } catch (e) {
      console.log(
        `⚠️ User ${staffEmail} might already exist or error: ${(e as Error).message}`,
      );
    }
  } catch (error) {
    console.error('General Error:', (error as Error).message);
  }

  await app.close();
}

void seed();
