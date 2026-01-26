import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';

import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { IEmailProvider } from './email-provider.interface';
import { MailpitProvider } from './mailpit.provider';

export type EmailProviderType = 'mailpit' | 'mailjet' | 'resend';

@Injectable()
export class ProviderFactoryService {
  private readonly logger = new Logger(ProviderFactoryService.name);
  private readonly providers: Map<EmailProviderType, IEmailProvider>;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailpitProvider: MailpitProvider,
  ) {
    this.providers = new Map<EmailProviderType, IEmailProvider>([
      ['mailpit', this.mailpitProvider],
    ]);
  }

  getProvider(): IEmailProvider {
    const providerName = this.configService.get<EmailProviderType>(
      'EMAIL_PROVIDER',
      'mailpit',
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
