import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'node-mailjet';

import {
  IEmailProvider,
  IEmailProviderOptions,
  IEmailProviderResult,
} from './email-provider.interface';

interface IMailjetMessageResponse {
  Messages: Array<{
    To: Array<{ MessageID: number }>;
  }>;
}

@Injectable()
export class MailjetProvider implements IEmailProvider {
  private readonly client: Client;

  constructor(private readonly configService: ConfigService) {
    this.client = Client.apiConnect(
      this.configService.get<string>('MAILJET_API_KEY'),
      this.configService.get<string>('MAILJET_API_SECRET'),
    );
  }

  async sendMail(
    options: IEmailProviderOptions,
  ): Promise<IEmailProviderResult> {
    try {
      const response = await this.client
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email:
                  options.from || this.configService.get<string>('EMAIL_FROM'),
              },
              To: options.to.map((email) => ({ Email: email })),
              Cc: options.cc?.map((email) => ({ Email: email })),
              Bcc: options.bcc?.map((email) => ({ Email: email })),
              Subject: options.subject,
              HTMLPart: options.html,
            },
          ],
        });

      const body = response.body as unknown as IMailjetMessageResponse;
      const messageId = body.Messages[0]?.To[0]?.MessageID;

      return { success: true, emailId: String(messageId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('user', { version: 'v3' }).request();
      return true;
    } catch {
      return false;
    }
  }
}
