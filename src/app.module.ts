import { Module } from '@nestjs/common';
import { EmailModule } from './email/email.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { TemplateModule } from './template/template.module';
import { TemplateService } from './template/template.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EmailModule,
    TemplateModule,
  ],
  controllers: [],
  providers: [PrismaModule, ConfigModule, TemplateService],
})
export class AppModule {}
