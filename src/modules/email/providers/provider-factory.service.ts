import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';

import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { IEmailProvider } from './email-provider.interface';
import { MailpitProvider } from './mailpit.provider';
import { MailjetProvider } from './mailjet.provider';
import { ResendProvider } from './resend.provider';
import { EMAIL_PROVIDERS, EmailProviderType } from './provider.constants';

@Injectable()
export class ProviderFactoryService {
  private readonly logger = new Logger(ProviderFactoryService.name);
  private readonly providers: Map<EmailProviderType, IEmailProvider>;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailpitProvider: MailpitProvider,
    private readonly mailjetProvider: MailjetProvider,
    private readonly resendProvider: ResendProvider,
  ) {
    this.providers = new Map<EmailProviderType, IEmailProvider>([
      [EMAIL_PROVIDERS.MAILPIT, this.mailpitProvider],
      [EMAIL_PROVIDERS.MAILJET, this.mailjetProvider],
      [EMAIL_PROVIDERS.RESEND, this.resendProvider],
    ]);
  }

  getProvider(): IEmailProvider {
    const providerName = this.configService.get<EmailProviderType>(
      'EMAIL_PROVIDER',
      EMAIL_PROVIDERS.MAILPIT,
    );

    const provider = this.providers.get(providerName);

    if (!provider) {
      this.logger.error(
        `Provider "${providerName}" not found or not configured`,
      );
      throw new RpcException({
        code: ErrorCode.PROVIDER_NOT_CONFIGURED,
        context: {
          operation: 'provider-factory-getProvider',
          requestedProvider: providerName,
          availableProviders: Array.from(this.providers.keys()),
        },
      });
    }
    return provider;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const provider = this.getProvider();
      return await provider.healthCheck();
    } catch (error) {
      this.logger.error(
        `Provider health check failed: ${(error as Error).message}`,
      );
      return false;
    }
  }
}
