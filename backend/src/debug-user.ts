import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

async function deb() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const repository = app.get<Repository<User>>(getRepositoryToken(User));

  const user = await repository.findOne({
    where: { email: 'alex.burcea@holdemremovals.co.uk' },
  });

  console.log('--- USER DEBUG ---');
  if (user) {
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Hash Type:', typeof user.passwordHash);
    console.log('Hash Value:', user.passwordHash);
    console.log('Active:', user.isActive);
  } else {
    console.log('User not found!');
  }
  console.log('------------------');

  await app.close();
}

void deb();
