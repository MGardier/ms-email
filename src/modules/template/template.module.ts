import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from 'prisma/prisma.module';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { TemplateRepository } from './template.repository';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [TemplateController],
  providers: [TemplateService, TemplateRepository],
  exports: [TemplateService],
})
export class TemplateModule {}
