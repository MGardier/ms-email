import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';

import { EmailModule } from 'src/modules/email/email.module';
import { TemplateModule } from 'src/modules/template/template.module';
import { HealthModule } from './common/health/health.module';
import { validateEnv } from './common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    EmailModule,
    TemplateModule,
  ],
})
export class AppModule {}
