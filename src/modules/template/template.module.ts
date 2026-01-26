import { Module } from '@nestjs/common';

import { PrismaModule } from 'prisma/prisma.module';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { TemplateRepository } from './template.repository';

@Module({
  imports: [PrismaModule],
  controllers: [TemplateController],
  providers: [TemplateService, TemplateRepository],
  exports: [TemplateService],
})
export class TemplateModule {}
