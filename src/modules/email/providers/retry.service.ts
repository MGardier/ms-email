import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULTS } from 'src/common/constants/defaults';
import { IRetryConfig, IRetryResult } from '../types';


@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);
  private readonly config: IRetryConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      maxAttempts: this.configService.get<number>(
        'EMAIL_RETRY_COUNT',
        DEFAULTS.EMAIL_RETRY_COUNT,
      ),
      baseDelayMs: this.configService.get<number>(
        'EMAIL_RETRY_DELAY_MS',
        DEFAULTS.EMAIL_RETRY_DELAY_MS,
      ),
      backoffMultiplier: this.configService.get<number>(
        'EMAIL_RETRY_BACKOFF_MULTIPLIER',
        DEFAULTS.EMAIL_RETRY_BACKOFF_MULTIPLIER,
      ),
      maxDelayMs: DEFAULTS.EMAIL_RETRY_MAX_DELAY_MS,
    };
  } 

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<IRetryResult<T>> {
    const errors: string[] = [];

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        this.logger.debug(
          `${context}: Attempt ${attempt}/${this.config.maxAttempts}`,
        );
        const result = await operation();

    
          this.logger.log(`${context}: Succeeded on attempt ${attempt}`);
      

        return {
          success: true,
          result,
          attempts: attempt,
          errors,
        };
      } catch (error) {
        const errorMessage = (error as Error).message;
        errors.push(`Attempt ${attempt}: ${errorMessage}`);

        this.logger.warn(
          `${context}: Attempt ${attempt} failed - ${errorMessage}`,
        );

        const isLastAttempt = attempt >= this.config.maxAttempts;

        if (!isLastAttempt) {
          const delay = this.calculateDelay(attempt);
          this.logger.debug(`${context}: Waiting ${delay}ms before retry`);
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(
      `${context}: All ${this.config.maxAttempts} attempts failed`,
    );

    return {
      success: false,
      attempts: this.config.maxAttempts,
      errors,
    };
  }

  private calculateDelay(attempt: number): number {
    // Exponential backoff: EMAIL_RETRY_DELAY_MS * (EMAIL_RETRY_BACKOFF_MULTIPLIER ^ (attempt - 1))
    const delay =
      this.config.baseDelayMs *
      Math.pow(this.config.backoffMultiplier, attempt - 1);

    return Math.min(delay, this.config.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
