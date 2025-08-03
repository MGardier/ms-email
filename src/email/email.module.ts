import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { env } from 'process';
import { PrismaService } from 'prisma/prisma.service';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { EmailRepository } from './email.repository';
import { TemplateModule } from 'src/template/template.module';

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
              ? 'dist/templates'
              : 'src/templates',
          ),

          adapter: new HandlebarsAdapter(),
          options: {
            strict: false,
          },
        },
        defaults: {
          from: `No Reply <${env.MAIL_FROM}>`,
        },
        inject: [ConfigService],
      }),
    }),
    TemplateModule,
  ],

  controllers: [EmailController],
  providers: [EmailService, PrismaService, EmailRepository],
})
export class EmailModule {}
