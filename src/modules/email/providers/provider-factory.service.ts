import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';

import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { IEmailProvider } from '../types';
import { MailpitProvider } from './mailpit.provider';
import { MailjetProvider } from './mailjet.provider';
import { ResendProvider } from './resend.provider';
import {
  PRODUCTION_PROVIDERS,
  TEST_PROVIDERS,
  ProductionProviderType,
  TestProviderType,
  EmailProviderType,
} from './provider.constants';

@Injectable()
export class ProviderFactoryService {
  private readonly logger = new Logger(ProviderFactoryService.name);
  private readonly productionProviders: Map<
    ProductionProviderType,
    IEmailProvider
  >;
  private readonly testProviders: Map<TestProviderType, IEmailProvider>;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailpitProvider: MailpitProvider,
    private readonly mailjetProvider: MailjetProvider,
    private readonly resendProvider: ResendProvider,
  ) {
    // Production providers
    this.productionProviders = new Map<ProductionProviderType, IEmailProvider>([
      [PRODUCTION_PROVIDERS.MAILJET, this.mailjetProvider],
      [PRODUCTION_PROVIDERS.RESEND, this.resendProvider],
    ]);

    // Test providers 
    this.testProviders = new Map<TestProviderType, IEmailProvider>([
      [TEST_PROVIDERS.MAILPIT, this.mailpitProvider],
    ]);
  }


  /** PRIMARY PROVIDER */

  getPrimaryProviderName(): ProductionProviderType {
    return this.configService.getOrThrow<ProductionProviderType>(
      'EMAIL_PROVIDER_PRIMARY'
    );
  }

  getPrimaryProvider(): IEmailProvider {
    const name = this.getPrimaryProviderName();
    return this.getProductionProvider(name, 'primary');
  }

  /** SECONDARY PROVIDER */
  
  getSecondaryProviderName(): ProductionProviderType {
    return this.configService.getOrThrow<ProductionProviderType>(
      'EMAIL_PROVIDER_SECONDARY',
    );
  }

  getSecondaryProvider(): IEmailProvider {
    const name = this.getSecondaryProviderName();
    return this.getProductionProvider(name, 'secondary');
  }

  /** TEST PROVIDER */

  getTestProviderName(): TestProviderType {
    return this.configService.get<TestProviderType>(
      'EMAIL_TEST_PROVIDER',
      TEST_PROVIDERS.MAILPIT,
    );
  }

  getTestProvider(): IEmailProvider {
    const name = this.getTestProviderName();
    const provider = this.testProviders.get(name);

    if (!provider) {
      this.logger.error(`Test provider "${name}" not found`);
      throw new RpcException({
        code: ErrorCode.PROVIDER_NOT_CONFIGURED,
        context: {
          operation: 'provider-factory-getTestProvider',
          requestedProvider: name,
          availableProviders: Array.from(this.testProviders.keys()),
        },
      });
    }

    return provider;
  }

  /** UTILITY METHODS */

  isTestMode(): boolean {
    const value = this.configService.get<boolean>(
      'EMAIL_USE_TEST_PROVIDER',
      false,
    );
    return Boolean(value);
  }

  private getProductionProvider(
    name: ProductionProviderType,
    role: 'primary' | 'secondary',
  ): IEmailProvider {
    const provider = this.productionProviders.get(name);

    if (!provider) {
      this.logger.error(`${role} provider "${name}" not found`);
      throw new RpcException({
        code: ErrorCode.PROVIDER_NOT_CONFIGURED,
        context: {
          operation: `provider-factory-get${role.charAt(0).toUpperCase() + role.slice(1)}Provider`,
          requestedProvider: name,
          availableProviders: Array.from(this.productionProviders.keys()),
        },
      });
    }

    return provider;
  }

  /** HEALTH CHECK */

  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    // Check primary provider
    const primaryName = this.getPrimaryProviderName();
    try {
      const primaryProvider = this.getPrimaryProvider();
      results[`primary_${primaryName}`] = await primaryProvider.healthCheck();
    } catch {
      results[`primary_${primaryName}`] = false;
    }

    // Check secondary provider
    const secondaryName = this.getSecondaryProviderName();
    try {
      const secondaryProvider = this.getSecondaryProvider();
      results[`secondary_${secondaryName}`] =
        await secondaryProvider.healthCheck();
    } catch {
      results[`secondary_${secondaryName}`] = false;
    }

    // Check test provider (always, as health check is always active)
    const testName = this.getTestProviderName();
    try {
      const testProvider = this.getTestProvider();
      results[`test_${testName}`] = await testProvider.healthCheck();
    } catch {
      results[`test_${testName}`] = false;
    }

    return results;
  }

  /** PROVIDERS GETTERS  */

  getProvider(): IEmailProvider {
    if (this.isTestMode()) {
      return this.getTestProvider();
    }
    return this.getPrimaryProvider();
  }

  getProviderName(): EmailProviderType {
    if (this.isTestMode()) {
      return this.getTestProviderName();
    }
    return this.getPrimaryProviderName();
  }
}
