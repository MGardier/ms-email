import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';

import { EmailModule } from 'src/modules/email/email.module';
import { TemplateModule } from 'src/modules/template/template.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    EmailModule,
    TemplateModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
