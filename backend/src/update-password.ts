import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities';

async function updatePassword() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  const email = 'alex.burcea@holdemremovals.co.uk';
  const newPassword = '123456';

  try {
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      console.log(`❌ User ${email} not found`);
      await app.close();
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await userRepository.save(user);

    console.log(`✅ Password updated for ${email}`);
    console.log(`   New password: ${newPassword}`);
  } catch (error) {
    console.error('Error:', error.message);
  }

  await app.close();
}

updatePassword();
