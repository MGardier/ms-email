import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

import {
  IEmailProvider,
  IEmailProviderOptions,
  IEmailProviderResult,
} from './email-provider.interface';
import { DEFAULTS } from 'src/common/constants/defaults';

@Injectable()
export class MailpitProvider implements IEmailProvider, OnModuleDestroy {
  private readonly logger = new Logger(MailpitProvider.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAILPIT_HOST', DEFAULTS.MAILPIT_HOST),
      port: this.configService.get<number>('MAILPIT_PORT', DEFAULTS.MAILPIT_PORT),
      secure: false,
    });
  }

  async sendMail(
    options: IEmailProviderOptions,
  ): Promise<IEmailProviderResult> {
    try {
      const info = await this.transporter.sendMail({
        ...options,
        from: options.from || this.configService.get<string>('EMAIL_FROM'),
      });

      return {
        success: true,
        emailId: info.messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email via Mailpit: ${(error as Error).message}`,
      );

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error(
        `Mailpit health check failed: ${(error as Error).message}`,
      );
      return false;
    }
  }

  onModuleDestroy(): void {
    this.transporter.close();
  }
}
