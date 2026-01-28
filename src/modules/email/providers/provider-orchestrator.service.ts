import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { ErrorCode } from 'src/common/enums/error-codes.enum';
import {
  IEmailProvider,
  IEmailProviderOptions,
  IOrchestratorResult, IProviderAttemptResult
} from '../types';
import { ProviderFactoryService } from './provider-factory.service';
import { RetryService } from './retry.service';


@Injectable()
export class ProviderOrchestratorService {
  private readonly logger = new Logger(ProviderOrchestratorService.name);

  constructor(
    private readonly providerFactory: ProviderFactoryService,
    private readonly retryService: RetryService,
  ) {}

  async sendWithRetryAndFallback(
    options: IEmailProviderOptions,
  ): Promise<IOrchestratorResult> {
    // Check if test mode is enabled
    if (this.providerFactory.isTestMode()) {
      return this.sendWithTestProvider(options);
    }

    const allErrors: string[] = [];

    // Try primary provider with retries
    const primaryName = this.providerFactory.getPrimaryProviderName();
    const primaryProvider = this.providerFactory.getPrimaryProvider();

    this.logger.log(
      `Attempting to send email via primary provider: ${primaryName}`,
    );

    const primaryResult = await this.tryProviderWithRetry(
      primaryProvider,
      primaryName,
      options,
    );

    if (primaryResult.success) {
      return {
        success: true,
        emailId: primaryResult.emailId,
        provider: primaryName,
        attempts: primaryResult.attempts,
        usedFallback: false,
        allErrors: primaryResult.errors,
      };
    }

    allErrors.push(...primaryResult.errors.map((e) => `[${primaryName}] ${e}`));

    // Try secondary provider with retries
    const secondaryName = this.providerFactory.getSecondaryProviderName();
    const secondaryProvider = this.providerFactory.getSecondaryProvider();

    this.logger.warn(
      `Primary provider ${primaryName} failed. Falling back to ${secondaryName}`,
    );

    const secondaryResult = await this.tryProviderWithRetry(
      secondaryProvider,
      secondaryName,
      options,
    );

    if (secondaryResult.success) {
      return {
        success: true,
        emailId: secondaryResult.emailId,
        provider: secondaryName,
        attempts: primaryResult.attempts + secondaryResult.attempts,
        usedFallback: true,
        allErrors: [
          ...allErrors,
          ...secondaryResult.errors.map((e) => `[${secondaryName}] ${e}`),
        ],
      };
    }

    allErrors.push(
      ...secondaryResult.errors.map((e) => `[${secondaryName}] ${e}`),
    );

    // Both providers failed
    this.logger.error('Both primary and secondary providers failed');
    throw new RpcException({
      code: ErrorCode.ALL_PROVIDERS_FAILED,
      context: {
        operation: 'provider-orchestrator-send',
        primaryProvider: primaryName,
        secondaryProvider: secondaryName,
        totalAttempts: primaryResult.attempts + secondaryResult.attempts,
        errors: allErrors,
      },
    });
  }

  private async tryProviderWithRetry(
    provider: IEmailProvider,
    providerName: string,
    options: IEmailProviderOptions,
  ): Promise<IProviderAttemptResult> {
    const retryResult = await this.retryService.executeWithRetry(
      async () => {
        const result = await provider.sendMail(options);
        if (!result.success) {
          throw new Error(result.error || 'Unknown provider error');
        }
        return result;
      },
      `Provider[${providerName}]`,
    );

    if (retryResult.success && retryResult.result) {
      return {
        success: true,
        emailId: retryResult.result.emailId,
        attempts: retryResult.attempts,
        errors: retryResult.errors,
      };
    }

    return {
      success: false,
      attempts: retryResult.attempts,
      errors: retryResult.errors,
    };
  }

  private async sendWithTestProvider(
    options: IEmailProviderOptions,
  ): Promise<IOrchestratorResult> {
    const testProviderName = this.providerFactory.getTestProviderName();
    const testProvider = this.providerFactory.getTestProvider();

    this.logger.log(
      `Test mode enabled. Sending via test provider: ${testProviderName}`,
    );

    // Direct send without retry for test provider
    const result = await testProvider.sendMail(options);

    if (result.success) {
      return {
        success: true,
        emailId: result.emailId,
        provider: testProviderName,
        attempts: 1,
        usedFallback: false,
        allErrors: [],
      };
    }

    this.logger.error(`Test provider ${testProviderName} failed`);
    throw new RpcException({
      code: ErrorCode.TEST_PROVIDER_FAILED,
      context: {
        operation: 'provider-orchestrator-send-test',
        provider: testProviderName,
        error: result.error,
      },
    });
  }
}
