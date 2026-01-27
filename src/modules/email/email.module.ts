import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TemplateModule } from 'src/modules/template/template.module';
import { PrismaModule } from 'prisma/prisma.module';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailRepository } from './email.repository';
import { ProvidersModule } from './providers/providers.module';

@Module({
  imports: [ConfigModule, TemplateModule, PrismaModule, ProvidersModule],
  controllers: [EmailController],
  providers: [EmailService, EmailRepository],
})
export class EmailModule {}
