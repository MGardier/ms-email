import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import {
  IEmailProvider,
  IEmailProviderOptions,
  IEmailProviderResult,
} from '../types';

@Injectable()
export class ResendProvider implements IEmailProvider {
  private readonly client: Resend;

  constructor(private readonly configService: ConfigService) {
    this.client = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async sendMail(
    options: IEmailProviderOptions,
  ): Promise<IEmailProviderResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: options.from || this.configService.get<string>('EMAIL_FROM'),
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, emailId: data.id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.client.emails.list();
      return !error;
    } catch {
      return false;
    }
  }
}
