import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { env } from 'process';

import { TemplateModule } from 'src/modules/template/template.module';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailRepository } from './email.repository';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          service: 'gmail',
          host: env.MAILER_HOST,
          secure: true,
          port: Number(env.NODEMAILER_PORT),
          auth: {
            user: env.MAILER_SENDER,
            pass: env.MAILER_TOKEN,
          },
        },
        template: {
          dir: join(
            process.cwd(),
            process.env.NODE_ENV === 'production'
              ? 'dist/modules/template'
              : 'src/modules/template',
          ),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: false,
          },
        },
        defaults: {
          from: `No Reply <${env.MAILER_SENDER}>`,
        },
      }),
    }),
    TemplateModule,
    PrismaModule,
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailRepository],
})
export class EmailModule {}
